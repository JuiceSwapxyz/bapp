// Seeds a real JUSD/WCBTC JuiceSwap V3 pool on Citrea Mainnet.
//
// Prerequisite for the "GATEWAY_DEPOSIT_DISABLED" fallback in
// packages/uniswap/src/features/transactions/swap/utils/jusdDirectPool.ts —
// that fallback only activates once this pool exists on-chain with real liquidity.
//
// This moves REAL funds. Run manually, review every step, never commit your key.
// Full rationale + runbook: docs/jusd-liquidity-migration.md
//
// Usage:
//   PRIVATE_KEY=0x... \
//   JUSD_AMOUNT=1000 \
//   WCBTC_AMOUNT=0.017 \
//   FEE_TIER=3000 \
//   CBTC_PRICE_USD=58689 \
//   node scripts/seed-jusd-wcbtc-pool.mjs --dry-run   # inspect first, remove --dry-run to execute

import { createPublicClient, createWalletClient, http, parseUnits, formatUnits, getContract } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const RPC_URL = 'https://rpc.citreascan.com'
const CHAIN = {
  id: 4114,
  name: 'Citrea Mainnet',
  nativeCurrency: { name: 'Citrea BTC', symbol: 'cBTC', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
}

const JUSD = '0x0987D3720D38847ac6dBB9D025B9dE892a3CA35C'
const WCBTC = '0x3100000000000000000000000000000000000006'
const SV_JUSD_VAULT = '0x1b70ae756b1089cc5948e4f8a2AD498DF30E897d'
const NPM = '0x3D3821D358f56395d4053954f98aec0E1F0fa568' // nonfungiblePositionManagerAddress
const FACTORY = '0xd809b1285aDd8eeaF1B1566Bf31B2B4C4Bba8e82' // v3CoreFactoryAddress

const FEE_TIER = Number(process.env.FEE_TIER ?? 3000) // 0.3%, matches the existing svJUSD/cBTC pool
const JUSD_AMOUNT = process.env.JUSD_AMOUNT
const WCBTC_AMOUNT = process.env.WCBTC_AMOUNT
const CBTC_PRICE_USD = Number(process.env.CBTC_PRICE_USD ?? 58689) // check a live source before running
const DRY_RUN = process.argv.includes('--dry-run')

if (!process.env.PRIVATE_KEY) {
  throw new Error('Set PRIVATE_KEY (0x-prefixed) in the environment. Never hardcode it here.')
}
if (!JUSD_AMOUNT || !WCBTC_AMOUNT) {
  throw new Error('Set JUSD_AMOUNT and WCBTC_AMOUNT (human units, e.g. JUSD_AMOUNT=1000 WCBTC_AMOUNT=0.017)')
}

const account = privateKeyToAccount(process.env.PRIVATE_KEY)
const publicClient = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) })
const walletClient = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) })

const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
]

const vaultAbi = [
  { name: 'redeem', type: 'function', stateMutability: 'nonpayable', inputs: [{ type: 'uint256', name: 'shares' }, { type: 'address', name: 'receiver' }, { type: 'address', name: 'owner' }], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'maxRedeem', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
]

const factoryAbi = [
  { name: 'getPool', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }, { type: 'uint24' }], outputs: [{ type: 'address' }] },
]

const npmAbi = [
  {
    name: 'createAndInitializePoolIfNecessary',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { type: 'address', name: 'token0' },
      { type: 'address', name: 'token1' },
      { type: 'uint24', name: 'fee' },
      { type: 'uint160', name: 'sqrtPriceX96' },
    ],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        type: 'tuple',
        name: 'params',
        components: [
          { type: 'address', name: 'token0' },
          { type: 'address', name: 'token1' },
          { type: 'uint24', name: 'fee' },
          { type: 'int24', name: 'tickLower' },
          { type: 'int24', name: 'tickUpper' },
          { type: 'uint256', name: 'amount0Desired' },
          { type: 'uint256', name: 'amount1Desired' },
          { type: 'uint256', name: 'amount0Min' },
          { type: 'uint256', name: 'amount1Min' },
          { type: 'address', name: 'recipient' },
          { type: 'uint256', name: 'deadline' },
        ],
      },
    ],
    outputs: [
      { type: 'uint256', name: 'tokenId' },
      { type: 'uint128', name: 'liquidity' },
      { type: 'uint256', name: 'amount0' },
      { type: 'uint256', name: 'amount1' },
    ],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
]

// Uniswap V3 requires token0 < token1 by address.
const [token0, token1] = JUSD.toLowerCase() < WCBTC.toLowerCase() ? [JUSD, WCBTC] : [WCBTC, JUSD]
const jusdIsToken0 = token0 === JUSD

function sqrtPriceX96FromPrice(price) {
  // price = token1 per token0 (human units, both assumed 18 decimals here)
  const Q96 = 2n ** 96n
  // Use a fixed-point sqrt via BigInt: scale price by 1e18, take integer sqrt, then apply Q96.
  const SCALE = 10n ** 18n
  const scaledPrice = BigInt(Math.round(price * 1e18))
  const sqrtScaled = bigIntSqrt(scaledPrice * SCALE) // sqrt(price * 1e18 * 1e18) = sqrt(price) * 1e18
  return (sqrtScaled * Q96) / SCALE
}

function bigIntSqrt(value) {
  if (value < 0n) throw new Error('negative')
  if (value < 2n) return value
  let x0 = value / 2n
  let x1 = (x0 + value / x0) / 2n
  while (x1 < x0) {
    x0 = x1
    x1 = (x0 + value / x0) / 2n
  }
  return x0
}

async function main() {
  console.log('Account:', account.address)

  // Price of WCBTC in terms of JUSD (JUSD pegged ~$1): 1 JUSD = 1/CBTC_PRICE_USD WCBTC
  const priceJusdPerWcbtc = CBTC_PRICE_USD
  const priceToken1PerToken0 = jusdIsToken0 ? 1 / priceJusdPerWcbtc : priceJusdPerWcbtc
  const sqrtPriceX96 = sqrtPriceX96FromPrice(priceToken1PerToken0)
  console.log('token0:', token0, jusdIsToken0 ? '(JUSD)' : '(WCBTC)')
  console.log('token1:', token1, jusdIsToken0 ? '(WCBTC)' : '(JUSD)')
  console.log('sqrtPriceX96:', sqrtPriceX96.toString())

  const existingPool = await publicClient.readContract({
    address: FACTORY,
    abi: factoryAbi,
    functionName: 'getPool',
    args: [token0, token1, FEE_TIER],
  })
  console.log('Existing pool at this fee tier:', existingPool)

  const jusdWei = parseUnits(JUSD_AMOUNT, 18)
  const wcbtcWei = parseUnits(WCBTC_AMOUNT, 18)
  const amount0Desired = jusdIsToken0 ? jusdWei : wcbtcWei
  const amount1Desired = jusdIsToken0 ? wcbtcWei : jusdWei

  // Full-range position for simplicity on a fresh pool. Fee tier 3000 -> tick spacing 60.
  const tickSpacing = { 500: 10, 3000: 60, 10000: 200 }[FEE_TIER]
  if (!tickSpacing) throw new Error(`Unknown tick spacing for fee tier ${FEE_TIER}`)
  const MIN_TICK = -887272
  const MAX_TICK = 887272
  const tickLower = Math.ceil(MIN_TICK / tickSpacing) * tickSpacing
  const tickUpper = Math.floor(MAX_TICK / tickSpacing) * tickSpacing

  console.log({
    jusdWei: jusdWei.toString(),
    wcbtcWei: wcbtcWei.toString(),
    tickLower,
    tickUpper,
    fee: FEE_TIER,
  })

  if (DRY_RUN) {
    console.log('\n--dry-run set: no transactions sent. Review the numbers above, then re-run without --dry-run.')
    return
  }

  // Step 1: redeem svJUSD -> JUSD if you're holding svJUSD and need more raw JUSD.
  const svJusdBalance = await publicClient.readContract({
    address: SV_JUSD_VAULT,
    abi: vaultAbi,
    functionName: 'balanceOf',
    args: [account.address],
  })
  console.log('Current svJUSD balance:', formatUnits(svJusdBalance, 18))
  if (svJusdBalance > 0n) {
    const maxRedeem = await publicClient.readContract({
      address: SV_JUSD_VAULT,
      abi: vaultAbi,
      functionName: 'maxRedeem',
      args: [account.address],
    })
    console.log('Redeeming', formatUnits(maxRedeem, 18), 'svJUSD shares -> JUSD ...')
    const redeemHash = await walletClient.writeContract({
      address: SV_JUSD_VAULT,
      abi: vaultAbi,
      functionName: 'redeem',
      args: [maxRedeem, account.address, account.address],
    })
    console.log('redeem tx:', redeemHash)
    await publicClient.waitForTransactionReceipt({ hash: redeemHash })
  }

  // Step 2: wrap cBTC -> WCBTC if needed (skipped here — fund the wallet with WCBTC directly,
  // or add a WETH9.deposit() call for WCBTC_AMOUNT before this script if you're starting from native cBTC).

  // Step 3: approve JUSD and WCBTC to the position manager.
  for (const [addr, amount] of [[JUSD, jusdWei], [WCBTC, wcbtcWei]]) {
    const allowance = await publicClient.readContract({
      address: addr,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [account.address, NPM],
    })
    if (allowance < amount) {
      console.log('Approving', addr, '...')
      const approveHash = await walletClient.writeContract({
        address: addr,
        abi: erc20Abi,
        functionName: 'approve',
        args: [NPM, amount],
      })
      await publicClient.waitForTransactionReceipt({ hash: approveHash })
    }
  }

  // Step 4: create + initialize the pool if it doesn't exist yet.
  if (existingPool === '0x0000000000000000000000000000000000000000') {
    console.log('Creating and initializing pool ...')
    const initHash = await walletClient.writeContract({
      address: NPM,
      abi: npmAbi,
      functionName: 'createAndInitializePoolIfNecessary',
      args: [token0, token1, FEE_TIER, sqrtPriceX96],
    })
    console.log('init tx:', initHash)
    await publicClient.waitForTransactionReceipt({ hash: initHash })
  }

  // Step 5: mint the liquidity position (full-range, 0 slippage floor for a brand-new pool).
  console.log('Minting position ...')
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800)
  const mintHash = await walletClient.writeContract({
    address: NPM,
    abi: npmAbi,
    functionName: 'mint',
    args: [
      {
        token0,
        token1,
        fee: FEE_TIER,
        tickLower,
        tickUpper,
        amount0Desired,
        amount1Desired,
        amount0Min: 0n,
        amount1Min: 0n,
        recipient: account.address,
        deadline,
      },
    ],
  })
  console.log('mint tx:', mintHash)
  const receipt = await publicClient.waitForTransactionReceipt({ hash: mintHash })
  console.log('Done. Position minted in block', receipt.blockNumber.toString())
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
