/**
 * Direct-pool fallback for selling JUSD on Citrea Mainnet.
 *
 * Background: JuiceSwap's `/v1/quote` API special-cases the JUSD token address and always
 * routes it through the JuiceSwap Gateway (JUSD <-> svJUSD wrap/unwrap), regardless of what
 * `protocols` the client requests. The Gateway's JUSD-deposit leg
 * (`Savings.save()` / `SavingsVaultJUSD._deposit()`) reverts on-chain with `ModuleDisabled()`
 * whenever the savings interest rate is 0% (confirmed on-chain: `currentRatePPM() == 0` on the
 * `SavingsGateway` at 0x22FE239892eBC8805DA8f05eD3bc6aF75332b60b). That blocks selling JUSD
 * (JUSD -> anything) even though buying JUSD still works, because the buy side only needs the
 * unblocked `withdraw()` leg.
 *
 * This module bypasses the Gateway (and the remote API) entirely for the JUSD-sell direction by
 * reading a real JuiceSwap V3 pool on-chain and computing/executing the swap locally, via the
 * same JuiceSwap V3 SwapRouter02 contract used by every other pair. It has zero dependency on
 * api.juiceswap.com and therefore isn't affected by the Gateway's paused state.
 *
 * All calldata here is built against SwapRouter02's *verified on-chain ABI*
 * (0x565eD3D57fe40f78A46f348C220121AE093c3cF8), NOT the @juiceswapxyz/v3-sdk `SwapRouter` helper:
 * that helper emits the legacy `ISwapRouter.exactInputSingle` struct which carries a `deadline`
 * field, whereas the deployed SwapRouter02 uses `IV3SwapRouter.exactInputSingle` (no `deadline`)
 * and enforces deadlines via its `multicall` wrapper instead. Contract-level facts relied on here:
 *   - `pay()` pulls the input via `safeTransferFrom(tokenIn, msg.sender, pool)` when payer is the
 *     caller, so a *plain ERC20 approve* of JUSD to SwapRouter02 is sufficient (no Permit2).
 *   - `Constants.ADDRESS_THIS == address(2)` tells the router to keep the output; `multicall`
 *     runs via `delegatecall`, preserving `msg.sender`, so a trailing `unwrapWETH9(min)` sends
 *     native cBTC to the user.
 *
 * Prerequisite: a funded JUSD/WCBTC V3 pool must exist on-chain. See
 * `scripts/seed-jusd-wcbtc-pool.mjs`. Until such a pool exists, `getJusdDirectPoolQuote` resolves
 * to `null` and callers fall back to the existing generic error message.
 */
import { CurrencyAmount, Token } from '@juiceswapxyz/sdk-core'
import { FeeAmount, Pool } from '@juiceswapxyz/v3-sdk'
import { createPublicClient, encodeFunctionData, http, zeroAddress, type Address, type PublicClient } from 'viem'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const JUSD_ADDRESS_CITREA_MAINNET: Address = '0x0987D3720D38847ac6dBB9D025B9dE892a3CA35C'
export const WCBTC_ADDRESS_CITREA_MAINNET: Address = '0x3100000000000000000000000000000000000006'
export const JUICESWAP_V3_FACTORY_CITREA_MAINNET: Address = '0xd809b1285aDd8eeaF1B1566Bf31B2B4C4Bba8e82'
export const JUICESWAP_SWAP_ROUTER02_CITREA_MAINNET: Address = '0x565eD3D57fe40f78A46f348C220121AE093c3cF8'
// SwapRouter02 `Constants.ADDRESS_THIS` sentinel — tells the router to keep the swap output so a
// trailing unwrapWETH9 can sweep it out as native cBTC. Verified in the deployed router source.
const ROUTER_ADDRESS_THIS: Address = '0x0000000000000000000000000000000000000002'
const CITREA_MAINNET_RPC_URL = 'https://rpc.citreascan.com'

// Fee tiers to probe, in preference order (matches the tiers JuiceSwap already uses for the
// svJUSD/cBTC pool and its other V3 pairs).
const CANDIDATE_FEE_TIERS: FeeAmount[] = [FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.HIGH]

// Matches the historical JUSD slippage default used across the app (see evmSwapInstructionsService).
export const DEFAULT_JUSD_SLIPPAGE_PERCENT = 5.5

/** Converts a percent slippage (e.g. 5.5) into basis points (550), clamped to [0, 10000]. */
export function slippagePercentToBps(percent: number | undefined): number {
  const pct = percent ?? DEFAULT_JUSD_SLIPPAGE_PERCENT
  const bps = Math.round(pct * 100)
  if (!Number.isFinite(bps) || bps < 0) {
    return Math.round(DEFAULT_JUSD_SLIPPAGE_PERCENT * 100)
  }
  return Math.min(bps, 10_000)
}

const factoryAbi = [
  {
    name: 'getPool',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'address' }, { type: 'address' }, { type: 'uint24' }],
    outputs: [{ type: 'address' }],
  },
] as const

const poolAbi = [
  {
    name: 'slot0',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { type: 'uint160', name: 'sqrtPriceX96' },
      { type: 'int24', name: 'tick' },
      { type: 'uint16', name: 'observationIndex' },
      { type: 'uint16', name: 'observationCardinality' },
      { type: 'uint16', name: 'observationCardinalityNext' },
      { type: 'uint8', name: 'feeProtocol' },
      { type: 'bool', name: 'unlocked' },
    ],
  },
  { name: 'liquidity', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint128' }] },
] as const

// IV3SwapRouter.ExactInputSingleParams — deliberately WITHOUT a `deadline` field.
// Verified against the deployed SwapRouter02 ABI at 0x565eD3D57fe40f78A46f348C220121AE093c3cF8.
const swapRouter02Abi = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  // 1-arg unwrapWETH9: unwraps the router's WCBTC balance and sends native cBTC to msg.sender.
  {
    name: 'unwrapWETH9',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'amountMinimum', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
] as const

const erc20Abi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const

let cachedClient: PublicClient | undefined
function getCitreaMainnetPublicClient(): PublicClient {
  cachedClient ??= createPublicClient({ transport: http(CITREA_MAINNET_RPC_URL) })
  return cachedClient
}

export interface JusdDirectPoolQuote {
  poolAddress: Address
  fee: FeeAmount
  amountIn: bigint
  amountOut: bigint
  tokenIn: Address
  tokenOut: Address
}

/**
 * True only for the pair/chain this fallback supports: selling JUSD for the chain's native asset
 * (cBTC) or its wrapped form (WCBTC) on Citrea Mainnet. `tokenOutAddress` is the trading-API token
 * address, i.e. the zero address for native cBTC.
 *
 * Extend deliberately — do not generalize to "any JUSD pair" without re-checking the on-chain
 * assumptions this module hardcodes.
 */
export function isJusdDirectPoolSupported(params: {
  chainId: UniverseChainId
  tokenInAddress: Address | undefined
  tokenOutAddress: Address | undefined
}): boolean {
  const { chainId, tokenInAddress, tokenOutAddress } = params
  if (chainId !== UniverseChainId.CitreaMainnet) {
    return false
  }
  const tokenIn = tokenInAddress?.toLowerCase()
  const tokenOut = tokenOutAddress?.toLowerCase()
  if (tokenIn !== JUSD_ADDRESS_CITREA_MAINNET.toLowerCase()) {
    return false
  }
  return (
    tokenOut === zeroAddress || // native cBTC
    tokenOut === WCBTC_ADDRESS_CITREA_MAINNET.toLowerCase()
  )
}

/**
 * Finds the best JUSD/WCBTC pool across the candidate fee tiers and computes the exact-input quote
 * directly from on-chain pool state, using the same `Pool.getOutputAmount` math the rest of this
 * codebase relies on for parsing CLASSIC routes. "Best" = highest output amount, so thin-liquidity
 * tiers don't silently give the user a worse price. Returns `null` if no seeded pool exists yet.
 */
export async function getJusdDirectPoolQuote(amountIn: bigint): Promise<JusdDirectPoolQuote | null> {
  if (amountIn <= BigInt(0)) {
    return null
  }
  const client = getCitreaMainnetPublicClient()

  const jusd = new Token(UniverseChainId.CitreaMainnet, JUSD_ADDRESS_CITREA_MAINNET, 18, 'JUSD', 'Juice Dollar')
  const wcbtc = new Token(UniverseChainId.CitreaMainnet, WCBTC_ADDRESS_CITREA_MAINNET, 18, 'WcBTC', 'Wrapped Citrea BTC')
  const inputAmount = CurrencyAmount.fromRawAmount(jusd, amountIn.toString())

  let best: JusdDirectPoolQuote | null = null

  for (const fee of CANDIDATE_FEE_TIERS) {
    const poolAddress = (await client.readContract({
      address: JUICESWAP_V3_FACTORY_CITREA_MAINNET,
      abi: factoryAbi,
      functionName: 'getPool',
      args: [JUSD_ADDRESS_CITREA_MAINNET, WCBTC_ADDRESS_CITREA_MAINNET, fee],
    })) as Address

    if (poolAddress === zeroAddress) {
      continue
    }

    const [slot0, liquidity] = await Promise.all([
      client.readContract({ address: poolAddress, abi: poolAbi, functionName: 'slot0' }),
      client.readContract({ address: poolAddress, abi: poolAbi, functionName: 'liquidity' }),
    ])
    const [sqrtPriceX96, tick] = slot0 as readonly [bigint, number, ...unknown[]]

    if ((liquidity as bigint) === BigInt(0) || sqrtPriceX96 === BigInt(0)) {
      // Pool exists but was never seeded with liquidity (e.g. only initialized, never minted into).
      continue
    }

    let amountOut: bigint
    try {
      const pool = new Pool(jusd, wcbtc, fee, sqrtPriceX96.toString(), (liquidity as bigint).toString(), tick)
      const [outputAmount] = await pool.getOutputAmount(inputAmount)
      amountOut = BigInt(outputAmount.quotient.toString())
    } catch {
      // getOutputAmount throws if the swap would exhaust the pool's in-range liquidity (insufficient
      // depth for this size). Skip this tier rather than aborting the whole quote.
      continue
    }

    if (amountOut > BigInt(0) && (!best || amountOut > best.amountOut)) {
      best = {
        poolAddress,
        fee,
        amountIn,
        amountOut,
        tokenIn: JUSD_ADDRESS_CITREA_MAINNET,
        tokenOut: WCBTC_ADDRESS_CITREA_MAINNET,
      }
    }
  }

  return best
}

export interface JusdDirectPoolSwapTx {
  to: Address
  data: `0x${string}`
  value: bigint
}

function applySlippage(amountOut: bigint, slippageToleranceBps: number): bigint {
  if (slippageToleranceBps < 0 || slippageToleranceBps > 10_000) {
    throw new Error(`Invalid slippageToleranceBps: ${slippageToleranceBps}`)
  }
  return (amountOut * BigInt(10_000 - slippageToleranceBps)) / BigInt(10_000)
}

/**
 * Builds calldata against SwapRouter02 for the JUSD-sell swap.
 *
 * - `outputIsNative` (user selected cBTC): emits
 *   `multicall([exactInputSingle(recipient=ADDRESS_THIS), unwrapWETH9(minOut)])` so the user
 *   receives native cBTC.
 * - otherwise (user selected WCBTC): emits a bare `exactInputSingle(recipient=user)`.
 *
 * `slippageToleranceBps` is applied to `quote.amountOut` to derive `amountOutMinimum`
 * (e.g. 550 == 5.5%). The caller must ensure SwapRouter02 has a sufficient JUSD allowance first
 * (see `getJusdRouterAllowance` / `buildJusdRouterApprovalTx`).
 */
export function buildJusdDirectPoolSwapTx(params: {
  quote: JusdDirectPoolQuote
  // Recipient of the swap output. Used only for the wrapped-output (WCBTC) path; for native output
  // the trailing unwrapWETH9 always pays msg.sender (the caller), so `recipient` is not encoded.
  recipient: Address
  slippageToleranceBps: number
  outputIsNative: boolean
}): JusdDirectPoolSwapTx {
  const { quote, recipient, slippageToleranceBps, outputIsNative } = params
  const amountOutMinimum = applySlippage(quote.amountOut, slippageToleranceBps)

  if (!outputIsNative) {
    const data = encodeFunctionData({
      abi: swapRouter02Abi,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: quote.tokenIn,
          tokenOut: quote.tokenOut,
          fee: quote.fee,
          recipient,
          amountIn: quote.amountIn,
          amountOutMinimum,
          sqrtPriceLimitX96: BigInt(0),
        },
      ],
    })
    return { to: JUICESWAP_SWAP_ROUTER02_CITREA_MAINNET, data, value: BigInt(0) }
  }

  // Native output: swap into the router, then unwrap WCBTC -> cBTC to the user via multicall.
  const swapCall = encodeFunctionData({
    abi: swapRouter02Abi,
    functionName: 'exactInputSingle',
    args: [
      {
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        fee: quote.fee,
        recipient: ROUTER_ADDRESS_THIS,
        amountIn: quote.amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: BigInt(0),
      },
    ],
  })
  const unwrapCall = encodeFunctionData({
    abi: swapRouter02Abi,
    functionName: 'unwrapWETH9',
    args: [amountOutMinimum],
  })
  const data = encodeFunctionData({
    abi: swapRouter02Abi,
    functionName: 'multicall',
    args: [[swapCall, unwrapCall]],
  })
  return { to: JUICESWAP_SWAP_ROUTER02_CITREA_MAINNET, data, value: BigInt(0) }
}

/** Reads the current JUSD allowance the owner has granted to SwapRouter02. */
export async function getJusdRouterAllowance(owner: Address): Promise<bigint> {
  const client = getCitreaMainnetPublicClient()
  return client.readContract({
    address: JUSD_ADDRESS_CITREA_MAINNET,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, JUICESWAP_SWAP_ROUTER02_CITREA_MAINNET],
  }) as Promise<bigint>
}

/** Builds an ERC20 `approve` call granting SwapRouter02 the given JUSD amount. */
export function buildJusdRouterApprovalTx(amount: bigint): { to: Address; data: `0x${string}`; value: bigint } {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [JUICESWAP_SWAP_ROUTER02_CITREA_MAINNET, amount],
  })
  return { to: JUSD_ADDRESS_CITREA_MAINNET, data, value: BigInt(0) }
}
