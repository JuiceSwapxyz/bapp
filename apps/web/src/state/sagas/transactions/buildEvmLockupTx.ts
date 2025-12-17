/* eslint-disable @typescript-eslint/no-restricted-imports */
/* eslint-disable multiline-comment-style */
import type { Contract, Signer } from 'ethers'
import { Contract as EthersContract } from 'ethers'

/**
 * Builds an EVM lockup transaction for a chain swap (e.g., cBTC -> BTC OnChain).
 *
 * Required dependencies:
 * - ethers (v6)
 *
 * Browser Configuration:
 * This code requires ethers.js which is browser-friendly by default.
 * You'll need to provide a Signer instance (from a wallet provider).
 *
 * @example
 * ```typescript
 * import { BrowserProvider } from "ethers";
 * import { buildEvmLockupTx } from "./buildEvmLockupTx";
 *
 * // Connect to wallet
 * const provider = new BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 *
 * // Build transaction
 * const tx = await buildEvmLockupTx({
 *   signer,
 *   contractAddress: "0x...", // CoinSwap contract address
 *   contractAbi: [...], // EtherSwap ABI
 *   preimageHash: "abc123...", // hex string without 0x
 *   claimAddress: "0x...", // BTC address (will be converted)
 *   timeoutBlockHeight: 123456,
 *   amountSatoshis: 100000, // amount in satoshis
 * });
 *
 * // Send transaction
 * const receipt = await tx.wait();
 * console.log("Transaction hash:", receipt.hash);
 * ```
 */

const COIN_SWAP_ABI = [
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

export type BuildEvmLockupTxParams = {
  /** Ethers Signer instance (from wallet provider) */
  signer: Signer
  /** CoinSwap contract address */
  contractAddress: string
  /** Preimage hash (hex string without 0x prefix) */
  preimageHash: string
  /** Claim address - can be:
   * - EVM address (0x... format) - will be used directly
   * - BTC address bytes20 (0x + 40 hex chars) - use btcAddressToBytes20() helper if needed
   */
  claimAddress: string
  /** Timeout block height */
  timeoutBlockHeight: number
  /** Amount in satoshis */
  amountSatoshis: number
}

export type EvmLockupTransaction = {
  /** The contract instance */
  contract: Contract
  /** The transaction response (can be awaited for receipt) */
  tx: Awaited<ReturnType<Contract['lock']>>
  /** Transaction hash */
  hash: string
}

/**
 * Converts a BTC address to bytes20 format for EVM contracts.
 * Note: This is a simplified implementation. For production use,
 * you should use bitcoinjs-lib to properly decode BTC addresses.
 *
 * @param btcAddress - BTC address (P2PKH, P2WPKH, etc.)
 * @returns bytes20 hex string (0x + 40 hex chars)
 */
export const btcAddressToBytes20 = (btcAddress: string): string => {
  // This is a placeholder - in production, decode the BTC address properly
  // using bitcoinjs-lib's address decoding to extract the hash160 or witness program
  // For now, we assume the address is already in the correct format or will be handled by the caller

  // If it's already a hex string with 0x prefix and 40 chars, return as-is
  if (btcAddress.startsWith('0x') && btcAddress.length === 42) {
    return btcAddress
  }

  // If it's a hex string without 0x prefix and 40 chars, add prefix
  if (!btcAddress.startsWith('0x') && btcAddress.length === 40) {
    return `0x${btcAddress}`
  }

  throw new Error(
    `Invalid address format: ${btcAddress}. ` +
      'For BTC addresses, use bitcoinjs-lib to decode them first, or provide the address in bytes20 format (0x + 40 hex chars).',
  )
}

/**
 * Converts satoshis to wei (1 satoshi = 10^10 wei)
 */
const satoshiToWei = (satoshis: number): bigint => {
  const weiFactor = BigInt(10 ** 10)
  return BigInt(satoshis) * weiFactor
}

/**
 * Adds 0x prefix to hex string if not present
 */
export const prefix0x = (val: string): string => {
  return val.startsWith('0x') ? val : `0x${val}`
}

/**
 * Builds and sends an EVM lockup transaction for a chain swap.
 *
 * @param params - Transaction parameters
 * @returns Transaction response that can be awaited for receipt
 */
export const buildEvmLockupTx = async (params: BuildEvmLockupTxParams): Promise<EvmLockupTransaction> => {
  const { signer, contractAddress, preimageHash, claimAddress, timeoutBlockHeight, amountSatoshis } = params

  // Create contract instance
  const contract = new EthersContract(contractAddress, COIN_SWAP_ABI, signer) as Contract

  // Convert preimageHash to bytes32 with 0x prefix
  const preimageHashBytes32 = prefix0x(preimageHash)

  // claimAddress should already be in the correct format (EVM address or bytes20)
  // If you have a BTC address, convert it first using btcAddressToBytes20()
  // Ethers.js will validate the address format

  // Convert satoshis to wei
  const value = satoshiToWei(amountSatoshis)

  // Call the lock function
  // Note: The contract expects:
  // - preimageHash: bytes32
  // - claimAddress: address (bytes20)
  // - timeoutBlockHeight: uint256
  // - value: amount in wei (sent as transaction value)
  const tx = await contract.lock(
    preimageHashBytes32,
    claimAddress, // Ethers.js will handle address validation
    timeoutBlockHeight,
    {
      value,
    },
  )

  return {
    contract,
    tx,
    hash: tx.hash,
  }
}
