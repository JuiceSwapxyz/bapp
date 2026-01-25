/**
 * ERC20 Chain Swap Test Script
 *
 * This script demonstrates a complete USDT (Polygon) → JUSD (Citrea) chain swap
 * using the Boltz Protocol. It serves as a reference implementation for the
 * frontend integration.
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx scripts/erc20-chain-swap-test.ts
 *   SWAP_AMOUNT=50 PRIVATE_KEY=0x... npx tsx scripts/erc20-chain-swap-test.ts
 *
 * Requirements:
 *   - USDT balance on Polygon
 *   - Small amount of MATIC for gas on Polygon
 *   - Small amount of cBTC for gas on Citrea (for claim)
 *
 * Flow:
 *   1. Create chain swap via Boltz API
 *   2. Approve USDT for ERC20Swap contract
 *   3. Lock USDT on Polygon
 *   4. Wait for Boltz to lock JUSD on Citrea
 *   5. Claim JUSD on Citrea
 *
 * IMPORTANT - Decimal Handling:
 *   - Boltz API uses 8 decimals internally
 *   - USDT has 6 decimals, JUSD has 18 decimals
 *   - USDT → Boltz: multiply by 100 (6→8)
 *   - Boltz → JUSD: multiply by 10^10 (8→18)
 *   - JUSD → Boltz: divide by 10^10 (18→8)
 *   - Boltz → USDT: divide by 100 (8→6)
 */

import { JsonRpcProvider } from '@ethersproject/providers'
import { ADDRESS } from '@juicedollar/jusd'
import { createHash, randomBytes } from 'crypto'
import { Contract, Wallet } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import WebSocket from 'ws'

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Boltz API
  boltzApi: 'https://dev.lightning.space/v1/swap',
  boltzWs: 'wss://dev.lightning.space/v1/swap/v2/ws',

  // Source Chain: Polygon Mainnet
  polygon: {
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    erc20Swap: '0x2E21F58Da58c391F110467c7484EdfA849C1CB9B',
  },

  // Target Chain: Citrea Testnet
  citrea: {
    rpcUrl: 'https://rpc.testnet.citrea.xyz',
    chainId: 5115,
    jusd: ADDRESS[5115]!.juiceDollar,
    erc20Swap: '0xf2e019a371e5Fd32dB2fC564Ad9eAE9E433133cc',
  },

  // Swap amount (in USDT with 6 decimals)
  swapAmount: process.env.SWAP_AMOUNT || '10', // 10 USDT default
}

// =============================================================================
// ABIs
// =============================================================================

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

const ERC20_SWAP_ABI = [
  'function lock(bytes32 preimageHash, uint256 amount, address tokenAddress, address claimAddress, uint256 timelock)',
  'function claim(bytes32 preimage, uint256 amount, address tokenAddress, address refundAddress, uint256 timelock)',
  'function swaps(bytes32 hash) view returns (bool)',
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function sha256(data: Buffer): Buffer {
  return createHash('sha256').update(data).digest()
}

async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  return response.json()
}

async function getGasPrices(provider: JsonRpcProvider) {
  const feeData = await provider.getFeeData()

  // Minimum priority fee for Polygon (25 gwei = 25000000000 wei)
  const minPriorityFeePerGas = parseUnits('25', 'gwei')
  const minMaxFeePerGas = parseUnits('100', 'gwei')

  // Ensure we meet minimums
  const maxPriorityFeePerGas =
    feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas.gt(minPriorityFeePerGas)
      ? feeData.maxPriorityFeePerGas
      : minPriorityFeePerGas

  const maxFeePerGas =
    feeData.maxFeePerGas && feeData.maxFeePerGas.gt(minMaxFeePerGas) ? feeData.maxFeePerGas : minMaxFeePerGas

  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
  }
}

// =============================================================================
// MAIN SWAP FUNCTION
// =============================================================================

async function usdtPolygonToJusdSwap(privateKey: string) {
  console.log('='.repeat(60))
  console.log('ERC20 Chain Swap: USDT (Polygon) → JUSD (Citrea)')
  console.log('='.repeat(60))

  // Setup wallets
  const polygonProvider = new JsonRpcProvider(CONFIG.polygon.rpcUrl)
  const citreaProvider = new JsonRpcProvider(CONFIG.citrea.rpcUrl)

  const polygonWallet = new Wallet(privateKey, polygonProvider)
  const citreaWallet = new Wallet(privateKey, citreaProvider)

  const userAddress = await polygonWallet.getAddress()
  console.log(`\nUser Address: ${userAddress}`)

  // Check USDT balance on Polygon
  const polygonUsdt = new Contract(CONFIG.polygon.usdt, ERC20_ABI, polygonWallet)
  const decimals = await polygonUsdt.decimals()
  const balance = await polygonUsdt.balanceOf(userAddress)
  console.log(`USDT Balance (Polygon): ${formatUnits(balance, decimals)} USDT`)

  const swapAmountRaw = parseUnits(CONFIG.swapAmount, decimals)
  if (balance < swapAmountRaw) {
    throw new Error(`Insufficient USDT balance. Need ${CONFIG.swapAmount}, have ${formatUnits(balance, decimals)}`)
  }

  // Generate preimage
  const preimage = randomBytes(32)
  const preimageHash = sha256(preimage)

  console.log(`\nPreimage: ${preimage.toString('hex')}`)
  console.log(`Preimage Hash: ${preimageHash.toString('hex')}`)

  // ==========================================================================
  // STEP 1: Create Chain Swap via Boltz API
  // ==========================================================================
  console.log('\n--- Step 1: Creating Chain Swap ---')

  // IMPORTANT: Boltz uses 8 decimals, USDT has 6 decimals
  // Convert: amount * 10^(8-6) = amount * 100
  const userLockAmount = Number(swapAmountRaw) * 100

  const createSwapResponse = await fetchJson(`${CONFIG.boltzApi}/v2/swap/chain`, {
    method: 'POST',
    body: JSON.stringify({
      from: 'USDT_POLYGON',
      to: 'JUSD_CITREA',
      preimageHash: preimageHash.toString('hex'),
      claimAddress: userAddress,
      userLockAmount,
    }),
  })

  console.log('\nSwap created:')
  console.log(`  ID: ${createSwapResponse.id}`)
  console.log(`  Lockup (Polygon):`, JSON.stringify(createSwapResponse.lockupDetails, null, 2))
  console.log(`  Claim (Citrea):`, JSON.stringify(createSwapResponse.claimDetails, null, 2))

  // Save swap details for recovery
  const swapDetails = {
    id: createSwapResponse.id,
    preimage: preimage.toString('hex'),
    preimageHash: preimageHash.toString('hex'),
    lockupDetails: createSwapResponse.lockupDetails,
    claimDetails: createSwapResponse.claimDetails,
    amount: CONFIG.swapAmount,
  }

  const fs = await import('fs')
  fs.writeFileSync(`./swap-${createSwapResponse.id}.json`, JSON.stringify(swapDetails, null, 2))
  console.log(`\nSwap details saved to: swap-${createSwapResponse.id}.json`)

  // ==========================================================================
  // STEP 2: Approve USDT for ERC20Swap contract
  // ==========================================================================
  console.log('\n--- Step 2: Approving USDT on Polygon ---')
  const currentAllowance = await polygonUsdt.allowance(userAddress, CONFIG.polygon.erc20Swap)

  if (currentAllowance < swapAmountRaw) {
    console.log(`Approving ${CONFIG.swapAmount} USDT for ERC20Swap...`)
    const gasPrices = await getGasPrices(polygonProvider)
    console.log(
      `Gas prices: maxFeePerGas=${formatUnits(gasPrices.maxFeePerGas, 'gwei')} gwei, maxPriorityFeePerGas=${formatUnits(gasPrices.maxPriorityFeePerGas, 'gwei')} gwei`,
    )
    const approveTx = await polygonUsdt.approve(CONFIG.polygon.erc20Swap, swapAmountRaw, {
      maxFeePerGas: gasPrices.maxFeePerGas,
      maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
    })
    console.log(`Approve TX: ${approveTx.hash}`)
    await approveTx.wait()
    console.log('Approved!')

    // Wait a bit to avoid rate limits
    console.log('Waiting 2 seconds before next transaction...')
    await new Promise((resolve) => setTimeout(resolve, 2000))
  } else {
    console.log('Already approved')
  }

  // ==========================================================================
  // STEP 3: Lock USDT on Polygon
  // ==========================================================================
  console.log('\n--- Step 3: Locking USDT on Polygon ---')
  const polygonErc20Swap = new Contract(CONFIG.polygon.erc20Swap, ERC20_SWAP_ABI, polygonWallet)

  const gasPrices = await getGasPrices(polygonProvider)
  console.log(
    `Gas prices: maxFeePerGas=${formatUnits(gasPrices.maxFeePerGas, 'gwei')} gwei, maxPriorityFeePerGas=${formatUnits(gasPrices.maxPriorityFeePerGas, 'gwei')} gwei`,
  )

  // Use manual gas limit to avoid gas estimation calls (which can hit rate limits)
  // Typical lock transaction uses ~150k-200k gas
  const lockTx = await polygonErc20Swap.lock(
    '0x' + preimageHash.toString('hex'),
    swapAmountRaw, // Use 6 decimals for contract
    CONFIG.polygon.usdt,
    createSwapResponse.lockupDetails.claimAddress,
    createSwapResponse.lockupDetails.timeoutBlockHeight,
    {
      maxFeePerGas: gasPrices.maxFeePerGas,
      maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
      gasLimit: 200000, // Manual gas limit to avoid estimation
    },
  )

  console.log(`Lock TX: ${lockTx.hash}`)
  console.log('Waiting for confirmation...')
  await lockTx.wait()
  console.log('USDT locked on Polygon!')

  // ==========================================================================
  // STEP 4: Wait for Boltz to lock on Citrea, then claim
  // ==========================================================================
  console.log('\n--- Step 4: Waiting for Boltz lockup on Citrea ---')

  return new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(CONFIG.boltzWs)

    ws.on('open', () => {
      console.log('WebSocket connected')
      ws.send(
        JSON.stringify({
          op: 'subscribe',
          channel: 'swap.update',
          args: [createSwapResponse.id],
        }),
      )
    })

    ws.on('message', async (data) => {
      const msg = JSON.parse(data.toString())

      if (msg.event === 'subscribe') {
        console.log('Subscribed to swap updates')
        return
      }

      if (msg.event !== 'update') return

      const status = msg.args[0].status
      console.log(`\nStatus: ${status}`)

      switch (status) {
        case 'swap.created':
          console.log('Waiting for user lockup...')
          break

        case 'transaction.mempool':
          console.log('User lockup in mempool')
          break

        case 'transaction.confirmed':
          console.log('User lockup confirmed')
          break

        case 'transaction.server.mempool':
          console.log('Boltz lockup in mempool on Citrea!')
          break

        case 'transaction.server.confirmed':
          console.log('Boltz lockup confirmed on Citrea!')
          console.log('\n--- Step 5: Claiming JUSD on Citrea ---')

          try {
            // IMPORTANT: Boltz returns amount in 8 decimals, JUSD has 18 decimals
            // Convert: amount * 10^10 (8→18)
            const claimAmount = BigInt(createSwapResponse.claimDetails.amount) * 10n ** 10n

            await claimJusdOnCitrea(citreaWallet, preimage, createSwapResponse.claimDetails, claimAmount)

            // Check new balance
            const citreaJusd = new Contract(CONFIG.citrea.jusd, ERC20_ABI, citreaProvider)
            const newBalance = await citreaJusd.balanceOf(userAddress)
            console.log(`\nNew JUSD Balance (Citrea): ${formatUnits(newBalance, 18)} JUSD`)

            ws.close()
            resolve()
          } catch (error) {
            console.error('Failed to claim:', error)
            reject(error)
          }
          break

        case 'transaction.claimed':
          console.log('Swap complete!')
          break

        case 'transaction.failed':
        case 'swap.expired':
          console.error(`Swap failed: ${status}`)
          ws.close()
          reject(new Error(status))
          break
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      reject(error)
    })
  })
}

// =============================================================================
// CLAIM FUNCTION
// =============================================================================

async function claimJusdOnCitrea(wallet: Wallet, preimage: Buffer, claimDetails: any, amount: bigint) {
  const contract = new Contract(CONFIG.citrea.erc20Swap, ERC20_SWAP_ABI, wallet)

  console.log(`Contract: ${CONFIG.citrea.erc20Swap}`)
  console.log(`Preimage: ${preimage.toString('hex')}`)
  console.log(`Amount: ${formatUnits(amount, 18)} JUSD`)
  console.log(`Refund Address: ${claimDetails.refundAddress}`)
  console.log(`Timelock: ${claimDetails.timeoutBlockHeight}`)

  const provider = wallet.provider as JsonRpcProvider
  const gasPrices = await getGasPrices(provider)
  console.log(
    `Gas prices: maxFeePerGas=${formatUnits(gasPrices.maxFeePerGas, 'gwei')} gwei, maxPriorityFeePerGas=${formatUnits(gasPrices.maxPriorityFeePerGas, 'gwei')} gwei`,
  )

  const claimTx = await contract.claim(
    '0x' + preimage.toString('hex'),
    amount,
    CONFIG.citrea.jusd,
    claimDetails.refundAddress,
    claimDetails.timeoutBlockHeight,
    {
      maxFeePerGas: gasPrices.maxFeePerGas,
      maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
    },
  )

  console.log(`\nClaim TX: ${claimTx.hash}`)
  console.log('Waiting for confirmation...')

  const receipt = await claimTx.wait()
  console.log(`Confirmed in block: ${receipt?.blockNumber}`)

  return receipt
}

// =============================================================================
// ENTRY POINT
// =============================================================================

async function main() {
  const privateKey = process.env.PRIVATE_KEY || process.env.CITREA_PRIVATE_KEY

  if (!privateKey) {
    console.error('ERROR: Set PRIVATE_KEY or CITREA_PRIVATE_KEY environment variable')
    console.log('\nUsage:')
    console.log('  PRIVATE_KEY=0x... npx tsx scripts/erc20-chain-swap-test.ts')
    console.log('  SWAP_AMOUNT=50 PRIVATE_KEY=0x... npx tsx scripts/erc20-chain-swap-test.ts')
    process.exit(1)
  }

  try {
    await usdtPolygonToJusdSwap(privateKey)
    console.log('\n' + '='.repeat(60))
    console.log('✓ Swap completed successfully!')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('\n✗ Swap failed:', error)
    process.exit(1)
  }
}

main()
