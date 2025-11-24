/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { call } from 'typed-redux-saga'
import { BitcoinBridgeLockTransactionStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { buildEvmLockupTx } from './buildEvmLockupTx'
import { generateChainSwapKeys } from './chainSwapKeys'
import { claimBitcoin } from './claimBitcoin'
import { getSigner } from './utils'

interface HandleBitcoinBridgeLockTransactionStepParams {
  step: BitcoinBridgeLockTransactionStep
  setCurrentStep: SetCurrentStepFn
  trade: Trade
  account: AccountDetails
  destinationAddress?: string
  onTransactionHash?: (hash: string) => void
}

interface SwapTreeLeaf {
  version: number
  output: string
}

interface SwapTree {
  claimLeaf: SwapTreeLeaf
  refundLeaf: SwapTreeLeaf
}

interface ClaimDetails {
  serverPublicKey: string
  amount: number
  lockupAddress: string
  timeoutBlockHeight: number
  swapTree: SwapTree
}

interface LockupDetails {
  claimAddress: string
  amount: number
  lockupAddress: string
  timeoutBlockHeight: number
}

interface BitcoinBridgeSwapResponse {
  referralId: string
  id: string
  claimDetails: ClaimDetails
  lockupDetails: LockupDetails
}

interface FetchSwapChainResult {
  payDetails: BitcoinBridgeSwapResponse
  preimageHash: string
  claimPublicKey: string
  mnemonic: string
  keyIndex: number
}

enum SwapStatus {
  Created = 'swap.created',
}

// TODO: Replace with actual EtherSwap contract ABI
// This ABI should match the contract at lockupDetails.lockupAddress
const ETHER_SWAP_ABI = [
  {
    inputs: [
      { name: 'preimageHash', type: 'bytes32' },
      { name: 'claimAddress', type: 'address' },
      { name: 'timeoutBlockHeight', type: 'uint256' },
    ],
    name: 'lock',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

const fetchSwapChain = async (
  claimAddress: string = 'bc1qs2tanqekdj9ew7vklfremkjmunlh7usxyvrw9n',
  userLockAmount: number = 2500,
): Promise<FetchSwapChainResult> => {
  const chainInfo = await fetch(`https://dev.lightning.space/v1/swap/v2/swap/chain`).then((res) => res.json())

  const { preimageHash, claimPublicKey, mnemonic, keyIndex } = generateChainSwapKeys()

  const swapChainData = {
    from: 'cBTC',
    to: 'BTC',
    preimageHash,
    claimPublicKey,
    claimAddress,
    pairHash: chainInfo.cBTC.BTC.hash,
    referralId: 'boltz_webapp_desktop',
    userLockAmount,
  }

  const payDetails = await fetch(`https://dev.lightning.space/v1/swap/v2/swap/chain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(swapChainData),
  }).then((res) => res.json())

  return {
    payDetails,
    preimageHash,
    claimPublicKey,
    mnemonic,
    keyIndex,
  }
}

const fetchSwapStatus = async (swapId: string): Promise<{ status: SwapStatus }> => {
  return await fetch(`https://dev.lightning.space/v1/swap/v2/swap/${swapId}`).then((res) => res.json())
}

/**
 * Delay helper for waiting between operations
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export function* handleBitcoinBridgeLockTransactionStep(params: HandleBitcoinBridgeLockTransactionStepParams) {
  const { step, setCurrentStep, trade, account, destinationAddress, onTransactionHash } = params

  // Step 1: Fetch swap chain details and generate keys
  const { payDetails, preimageHash, mnemonic, keyIndex } = yield* call(fetchSwapChain, destinationAddress)

  // TODO: Store these values securely for the claim step
  // We'll need: mnemonic, keyIndex, preimageHash, payDetails.id, payDetails.claimDetails
  console.log('Swap created - ID:', payDetails.id)
  console.log('Save this data for claiming:', {
    swapId: payDetails.id,
    mnemonic, // CRITICAL: Save securely!
    keyIndex,
    preimageHash,
    serverPublicKey: payDetails.claimDetails.serverPublicKey,
    swapTree: payDetails.claimDetails.swapTree,
    timeoutBlockHeight: payDetails.claimDetails.timeoutBlockHeight,
  })

  // Step 2: Check swap status
  const swapStatus = yield* call(fetchSwapStatus, payDetails.id)

  if (swapStatus.status === SwapStatus.Created) {
    // Step 3: Build and send the EVM lockup transaction
    const signer = yield* call(getSigner, account.address)

    const evmTxResult = yield* call(buildEvmLockupTx, {
      signer,
      contractAddress: payDetails.lockupDetails.lockupAddress,
      contractAbi: ETHER_SWAP_ABI,
      preimageHash,
      claimAddress: payDetails.lockupDetails.claimAddress,
      timeoutBlockHeight: payDetails.lockupDetails.timeoutBlockHeight,
      amountSatoshis: payDetails.lockupDetails.amount,
    })

    // Notify about transaction hash
    if (onTransactionHash) {
      yield* call(onTransactionHash, evmTxResult.hash)
    }

    // Wait for transaction to be mined
    yield* call([evmTxResult.tx, 'wait'])

    console.log('EVM lockup confirmed. Waiting 20 seconds for server to lock BTC...')

    // Step 4: Wait 20 seconds for server to lock BTC on-chain
    yield* call(delay, 20000)

    // Step 5: Claim the Bitcoin
    try {
      console.log('Attempting to claim Bitcoin...')

      const claimTxId = yield* call(claimBitcoin, {
        swapId: payDetails.id,
        mnemonic,
        claimPrivateKeyIndex: keyIndex,
        preimage: preimageHash,
        claimAddress: destinationAddress || 'bc1qs2tanqekdj9ew7vklfremkjmunlh7usxyvrw9n',
        claimDetails: {
          swapTree: payDetails.claimDetails.swapTree,
          serverPublicKey: payDetails.claimDetails.serverPublicKey,
          timeoutBlockHeight: payDetails.claimDetails.timeoutBlockHeight,
          amount: payDetails.claimDetails.amount,
        },
        network: 'mainnet',
        apiBaseUrl: 'https://dev.lightning.space',
      })

      console.log('Bitcoin claimed successfully! Transaction ID:', claimTxId)
    } catch (error) {
      console.error('Failed to claim Bitcoin:', error)
      // Don't throw - user can claim manually later with saved data
      console.log('You can claim manually later using the saved swap data')
    }
  }

  setCurrentStep({ step, accepted: true })
}
