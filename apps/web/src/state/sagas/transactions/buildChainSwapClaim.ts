/* eslint-disable curly */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable no-console */
/**
 * Standalone Chain Swap Claim Implementation
 *
 * This file contains all the code needed to claim a chain swap (e.g., cBTC -> BTC OnChain)
 * after the server has locked BTC on-chain.
 *
 * REQUIRED DEPENDENCIES:
 *
 * npm install \
 *   boltz-core@^3.0.0 \
 *   bitcoinjs-lib@^6.1.7 \
 *   @vulpemventures/secp256k1-zkp@^3.2.1 \
 *   @bitcoinerlab/secp256k1@^1.2.0 \
 *   ecpair@^3.0.0 \
 *   buffer@^6.0.3 \
 *   @scure/bip32@^1.7.0 \
 *   @scure/bip39@^1.6.0 \
 *   crypto
 *
 * Browser Configuration:
 * - vite-plugin-node-polyfills (for Buffer and crypto)
 * - vite-plugin-wasm (for @vulpemventures/secp256k1-zkp WASM)
 *
 * IMPORTANT NOTES:
 *
 * 1. **Transaction Broadcasting**: This function returns the signed transaction hex.
 *    You MUST broadcast it to the network using `broadcastClaimTransaction()` or
 *    your preferred method (block explorer API, node, etc.).
 *
 * 2. **Non-Cooperative Claim**: Not implemented. If cooperative signing fails,
 *    you'll need to implement non-cooperative claim separately (uses swap tree's
 *    claim leaf directly).
 *
 * 3. **Server Lockup Transaction**: You need to get the server's lockup transaction
 *    from the API: GET /v2/swap/chain/{id}/transactions
 *    Use the `serverLock.transaction.hex` field.
 *
 * 4. **Timing**: You can only claim after the server's lockup transaction is confirmed,
 *    but before the timeout block height.
 *
 * 5. **Error Handling**: The function validates inputs and provides specific error
 *    messages for common failure cases.
 */

import ecc from '@bitcoinerlab/secp256k1'
import { HDKey } from '@scure/bip32'
import { mnemonicToSeedSync } from '@scure/bip39'
import type { Network } from 'bitcoinjs-lib'
import { Transaction, address, initEccLib, networks } from 'bitcoinjs-lib'
import type { ClaimDetails } from 'boltz-core'
import { Musig, OutputType, SwapTreeSerializer, TaprootUtils, constructClaimTransaction, detectSwap } from 'boltz-core'
import { init } from 'boltz-core/dist/lib/liquid'
import { Buffer } from 'buffer'
import type { ECPairInterface } from 'ecpair'
import { ECPairFactory } from 'ecpair'

// Browser-compatible random bytes generator
const randomBytes = (size: number): Buffer => {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes)
}

// Initialize ECC library
initEccLib(ecc)
const ECPair = ECPairFactory(ecc)

// Initialize secp256k1-zkp for MuSig (lazy load)
let secpZkp: any = null
const getSecpZkp = async () => {
  if (!secpZkp) {
    const zkp = (await import('@vulpemventures/secp256k1-zkp')).default
    secpZkp = await zkp()
    init(secpZkp)
  }
  return secpZkp
}

// Types
export type ChainSwapClaimParams = {
  /** Swap ID from creation */
  swapId: string
  /** Your mnemonic phrase */
  mnemonic: string
  /** Key index used during swap creation */
  claimPrivateKeyIndex: number
  /** Preimage (hex string) from swap creation */
  preimage: string
  /** Your BTC claim address */
  claimAddress: string
  /** Claim details from swap creation response */
  claimDetails: {
    swapTree: {
      claimLeaf: { output: string; version: number }
      refundLeaf: { output: string; version: number }
    }
    serverPublicKey: string // hex
    timeoutBlockHeight: number
    amount: number
    blindingKey?: string
  }
  /** Server's lockup transaction hex */
  serverLockupTxHex: string
  /** Network: "mainnet" | "testnet" | "regtest" */
  network?: string
  /** API base URL for cooperative signing */
  apiBaseUrl?: string
  /** Whether to use cooperative signing (default: true) */
  cooperative?: boolean
}

export type ChainSwapClaimResult = {
  /** Claim transaction hex (ready to broadcast) */
  transactionHex: string
  /** Transaction ID */
  transactionId: string
  /** Whether cooperative signing was used */
  cooperative: boolean
}

/**
 * Broadcasts a transaction to the Bitcoin network.
 * You can use this helper or broadcast manually via your preferred method.
 */
export const broadcastClaimTransaction = async (
  transactionHex: string,
  apiBaseUrl?: string,
): Promise<{ id: string }> => {
  if (!apiBaseUrl) {
    throw new Error('apiBaseUrl required for broadcasting')
  }

  return fetcher<{ id: string }>(`/v2/chain/BTC/transaction`, { hex: transactionHex }, apiBaseUrl)
}

// Helper: Derive private key from mnemonic
const derivePrivateKey = (mnemonic: string, keyIndex: number): ECPairInterface => {
  const seed = mnemonicToSeedSync(mnemonic)
  const hdKey = HDKey.fromMasterSeed(seed)
  const derivedKey = hdKey.derive(`m/44/0/0/0/${keyIndex}`)

  if (!derivedKey.privateKey) {
    throw new Error('Failed to derive private key')
  }

  return ECPair.fromPrivateKey(Buffer.from(derivedKey.privateKey))
}

// Helper: Get Bitcoin network
const getNetwork = (network: string = 'mainnet'): Network => {
  if (network === 'mainnet') return networks.bitcoin
  if (network === 'testnet') return networks.testnet
  if (network === 'regtest') return networks.regtest
  throw new Error(`Unsupported network: ${network}`)
}

// Helper: Decode BTC address to script
const decodeAddress = (addr: string, network: Network): Buffer => {
  return Buffer.from(address.toOutputScript(addr, network))
}

// Helper: Create MuSig
const createMusig = async (ourKeys: ECPairInterface, theirPublicKey: Buffer): Promise<Musig> => {
  const secp = await getSecpZkp()
  return new Musig(secp, ourKeys, randomBytes(32), [
    // Boltz's key always comes first
    theirPublicKey,
    Buffer.from(ourKeys.publicKey),
  ])
}

// Helper: Tweak MuSig with swap tree
const tweakMusig = (musig: Musig, tree: any): Buffer => {
  return TaprootUtils.tweakMusig(musig, tree)
}

// Helper: Hash for witness v1
const hashForWitnessV1 = (
  network: Network,
  inputs: ClaimDetails[],
  tx: any, // Use any to avoid type conflicts between different bitcoinjs-lib versions
  index: number,
  leafHash?: Buffer,
): Buffer => {
  return TaprootUtils.hashForWitnessV1(inputs, tx, index, leafHash)
}

// Helper: Parse blinding key (for Liquid, not needed for BTC)
const parseBlindingKey = (blindingKey?: string): Buffer | undefined => {
  return blindingKey ? Buffer.from(blindingKey, 'hex') : undefined
}

// Helper: Get output amount (simplified for BTC)
const getOutputAmount = (output: any): number => {
  return output.value
}

// Helper: Create adjusted claim transaction
const createAdjustedClaim = async (
  claimDetails: (ClaimDetails & { blindingPrivateKey?: Buffer })[],
  destinationScript: Buffer,
  receiveAmount: number,
  network: Network,
): Promise<any> => {
  // Use any to avoid type conflicts
  // Calculate input sum
  let inputSum = 0
  for (const details of claimDetails) {
    inputSum += getOutputAmount(details)
  }

  // Fee budget = inputSum - receiveAmount
  const feeBudget = Math.floor(inputSum - receiveAmount)

  if (feeBudget < 0) {
    throw new Error('Insufficient funds for claim transaction')
  }

  // Build claim transaction
  return constructClaimTransaction(
    claimDetails as ClaimDetails[],
    destinationScript,
    feeBudget,
    true, // isRbf
  )
}

// API helpers
const fetcher = async <T>(endpoint: string, body?: any, baseUrl?: string): Promise<T> => {
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}${endpoint}` : endpoint

  const options: RequestInit = {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API error: ${error}`)
  }

  return response.json()
}

// Get server's claim details for cooperative signing
const getChainSwapClaimDetails = async (swapId: string, apiBaseUrl?: string) => {
  return fetcher<{
    pubNonce: string
    publicKey: string
    transactionHash: string
  }>(`/v2/swap/chain/${swapId}/claim`, undefined, apiBaseUrl)
}

// Post chain swap details for cooperative signing
const postChainSwapDetails = async (
  swapId: string,
  preimage: string,
  signature: { pubNonce: string; partialSignature: string },
  toSign: { pubNonce: string; transaction: string; index: number },
  apiBaseUrl?: string,
) => {
  return fetcher<{
    pubNonce: string
    partialSignature: string
  }>(
    `/v2/swap/chain/${swapId}/claim`,
    {
      preimage,
      signature,
      toSign,
    },
    apiBaseUrl,
  )
}

/**
 * Builds and signs a claim transaction for a chain swap.
 *
 * @param params - Claim parameters
 * @returns Claim transaction hex and ID
 *
 * @example
 * ```typescript
 * const result = await buildChainSwapClaim({
 *   swapId: "abc123",
 *   mnemonic: "your mnemonic phrase",
 *   claimPrivateKeyIndex: 0,
 *   preimage: "preimage hex",
 *   claimAddress: "bc1q...",
 *   claimDetails: { ... },
 *   serverLockupTxHex: "01000000...",
 *   network: "mainnet",
 *   apiBaseUrl: "https://api.boltz.exchange",
 *   cooperative: true
 * });
 *
 * console.log("Transaction ID:", result.transactionId);
 * ```
 */
export const buildChainSwapClaim = async (params: ChainSwapClaimParams): Promise<ChainSwapClaimResult> => {
  const {
    swapId,
    mnemonic,
    claimPrivateKeyIndex,
    preimage,
    claimAddress,
    claimDetails,
    serverLockupTxHex,
    network = 'mainnet',
    apiBaseUrl,
    cooperative = true,
  } = params

  // Validate inputs
  if (!preimage || preimage.length !== 64) {
    throw new Error('Invalid preimage: must be 64 hex characters (32 bytes)')
  }

  if (claimDetails.amount <= 0) {
    throw new Error('Invalid amount: must be greater than 0')
  }

  if (!serverLockupTxHex || serverLockupTxHex.length < 100) {
    throw new Error('Invalid server lockup transaction hex')
  }

  // Get network
  const bitcoinNetwork = getNetwork(network)

  // Derive claim private key
  const claimPrivateKey = derivePrivateKey(mnemonic, claimPrivateKeyIndex)

  // Parse server's public key
  const serverPublicKey = Buffer.from(claimDetails.serverPublicKey, 'hex')

  // Create MuSig
  const musig = await createMusig(claimPrivateKey, serverPublicKey)

  // Deserialize swap tree
  const claimTree = SwapTreeSerializer.deserializeSwapTree(claimDetails.swapTree)

  // Tweak MuSig with swap tree
  const tweakedKey = tweakMusig(musig, claimTree.tree)

  // Parse lockup transaction
  const lockupTx = Transaction.fromHex(serverLockupTxHex)

  // Find swap output using the tweaked key (cast to any to avoid type conflicts)
  const swapOutput = detectSwap(tweakedKey, lockupTx as any)

  if (!swapOutput) {
    throw new Error('Swap output not found in lockup transaction')
  }

  // Build claim details (cast to any to avoid type conflicts between bitcoinjs-lib versions)
  const details: any[] = [
    {
      ...swapOutput,
      cooperative,
      swapTree: claimTree,
      keys: claimPrivateKey,
      type: OutputType.Taproot,
      txHash: Buffer.from(lockupTx.getHash()),
      blindingPrivateKey: parseBlindingKey(claimDetails.blindingKey),
      internalKey: musig.getAggregatedPublicKey(),
      preimage: Buffer.from(preimage, 'hex'),
    },
  ]

  // Decode claim address
  const destinationScript = decodeAddress(claimAddress, bitcoinNetwork)

  // Build claim transaction
  const claimTx = await createAdjustedClaim(details, destinationScript, claimDetails.amount, bitcoinNetwork)

  // Cooperative signing
  if (cooperative && apiBaseUrl) {
    try {
      // Get server's claim details
      const serverClaimDetails = await getChainSwapClaimDetails(swapId, apiBaseUrl)

      // Get our public nonce (before aggregating)
      const ourPubNonce = Buffer.from(musig.getPublicNonce()).toString('hex')

      // Aggregate nonces with server's nonce
      musig.aggregateNonces([[serverPublicKey, Buffer.from(serverClaimDetails.pubNonce, 'hex')]])

      // Initialize session with transaction hash
      const hash = hashForWitnessV1(bitcoinNetwork, details, claimTx, 0)
      musig.initializeSession(hash)

      // Sign our partial signature
      const ourPartialSignature = musig.signPartial()

      const ourPartial = {
        pubNonce: ourPubNonce,
        partialSignature: Buffer.from(ourPartialSignature).toString('hex'),
      }

      // Post our signature and get server's partial signature
      const theirPartial = await postChainSwapDetails(
        swapId,
        preimage,
        ourPartial,
        {
          index: 0,
          transaction: claimTx.toHex(),
          pubNonce: ourPubNonce,
        },
        apiBaseUrl,
      )

      // Re-aggregate nonces with server's nonce from response
      musig.aggregateNonces([[serverPublicKey, Buffer.from(theirPartial.pubNonce, 'hex')]])

      // Re-initialize session
      musig.initializeSession(hash)

      // Add server's partial signature
      musig.addPartial(serverPublicKey, Buffer.from(theirPartial.partialSignature, 'hex'))

      // Sign our part again (after adding their partial)
      musig.signPartial()

      // Aggregate final signature
      const finalSignature = musig.aggregatePartials()
      claimTx.ins[0].witness = [finalSignature]
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error'

      // Check for specific error cases
      if (errorMessage.includes('swap not eligible') || errorMessage.includes('already broadcast')) {
        throw new Error(
          'Server has already claimed or swap is not eligible for cooperative claim. ' +
            'You may need to use non-cooperative claim (not implemented in this version).',
        )
      }

      console.warn('Cooperative signing failed:', errorMessage)
      // Fall back to non-cooperative (would need different implementation)
      throw new Error(
        `Cooperative signing failed: ${errorMessage}. ` +
          'Non-cooperative claim not implemented in this standalone version.',
      )
    }
  } else {
    // Non-cooperative signing (simplified - would need full implementation)
    throw new Error('Non-cooperative claim not fully implemented. Use cooperative signing with apiBaseUrl.')
  }

  return {
    transactionHex: claimTx.toHex(),
    transactionId: claimTx.getId(),
    cooperative: cooperative && !!apiBaseUrl,
  }
}
