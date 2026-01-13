import ecc from '@bitcoinerlab/secp256k1'
import { initEccLib, Transaction } from 'bitcoinjs-lib'
import { ClaimDetails, detectSwap, Musig, OutputType, SwapTreeSerializer, TaprootUtils } from 'boltz-core'
import { init } from 'boltz-core/dist/lib/liquid'
import { hashForWitnessV1 } from 'boltz-core/dist/lib/swap/TaprootUtils'
import { Buffer } from 'buffer'
import type { ECPairInterface } from 'ecpair'
import { SwapType, type ChainSwap, type ReverseSwap, type SomeSwap, type SubmarineSwap } from '../lds-types/storage'

type SecpZkp = Awaited<ReturnType<typeof import('@vulpemventures/secp256k1-zkp').default>>

const randomBytes = (size: number): Buffer => {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes)
}

initEccLib(ecc)

let secpZkp: SecpZkp | null = null

const getSecpZkp = async (): Promise<SecpZkp> => {
  if (!secpZkp) {
    const zkp = (await import('@vulpemventures/secp256k1-zkp')).default
    secpZkp = await zkp()
    init(secpZkp)
  }
  return secpZkp
}

/**
 * Creates a Musig instance for chain swap claiming
 * @param ourKeys - Our ECPair keys
 * @param theirPublicKey - The counterparty's public key
 * @returns Musig instance for collaborative signing
 */
export const createMusig = async (ourKeys: ECPairInterface, theirPublicKey: Buffer): Promise<Musig> => {
  const secp = await getSecpZkp()
  return new Musig(secp, ourKeys, randomBytes(32), [theirPublicKey, Buffer.from(ourKeys.publicKey)])
}

/**
 * Prepares musig for chain swap claim by creating musig instance and tweaking with swap tree
 * @param claimKeyPair - Our claim key pair
 * @param chainSwap - Chain swap details from storage
 * @returns Object containing musig instance, tweaked key, and swap tree
 */
export const prepareClaimMusig = async (
  claimKeyPair: ECPairInterface,
  chainSwap: ChainSwap,
): Promise<{
  musig: Musig
  tweakedKey: Buffer
  swapTree: ReturnType<typeof SwapTreeSerializer.deserializeSwapTree>
}> => {
  const swapTree = SwapTreeSerializer.deserializeSwapTree(chainSwap.claimDetails.swapTree!)
  const serverPublicKey = Buffer.from(chainSwap.claimDetails.serverPublicKey!, 'hex')
  const musig = await createMusig(claimKeyPair, serverPublicKey)
  const tweakedKey = TaprootUtils.tweakMusig(musig, swapTree.tree)

  return { musig, tweakedKey, swapTree }
}

/**
 * Prepares musig for chain swap refund by creating musig instance and tweaking with swap tree
 * @param claimKeyPair - Our claim key pair
 * @param chainSwap - Chain swap details from storage
 * @returns Object containing musig instance, tweaked key, and swap tree
 */
export const prepareRefundMusig = async (
  claimKeyPair: ECPairInterface,
  chainSwap: ChainSwap,
): Promise<{
  musig: Musig
  tweakedKey: Buffer
  swapTree: ReturnType<typeof SwapTreeSerializer.deserializeSwapTree>
}> => {
  const swapTree = SwapTreeSerializer.deserializeSwapTree(chainSwap.lockupDetails.swapTree!)
  const serverPublicKey = Buffer.from(chainSwap.lockupDetails.serverPublicKey!, 'hex')
  const musig = await createMusig(claimKeyPair, serverPublicKey)
  const tweakedKey = TaprootUtils.tweakMusig(musig, swapTree.tree)

  return { musig, tweakedKey, swapTree }
}

/**
 * Builds ClaimDetails object for constructing claim transaction
 * @param params - Parameters for building claim details
 * @returns ClaimDetails object ready for transaction construction
 */
export const buildClaimDetails = (params: {
  tweakedKey: Buffer
  lockupTx: Transaction
  swapTree: ReturnType<typeof SwapTreeSerializer.deserializeSwapTree>
  claimKeyPair: ECPairInterface
  musig: Musig
  preimage: Buffer
}): ClaimDetails => {
  const { tweakedKey, lockupTx, swapTree, claimKeyPair, musig, preimage } = params
  const swapOutput = detectSwap(tweakedKey, lockupTx as any)

  return {
    ...swapOutput,
    cooperative: true,
    swapTree,
    keys: claimKeyPair,
    type: OutputType.Taproot,
    txHash: lockupTx.getHash(),
    internalKey: musig.getAggregatedPublicKey(),
    preimage,
  } as ClaimDetails
}

/**
 * Builds refund details object for constructing refund transaction
 * @param params - Parameters for building refund details
 * @returns Refund details object ready for transaction construction
 */
export const buildRefundDetails = (params: {
  tweakedKey: Buffer
  lockupTx: Transaction
  swapTree: ReturnType<typeof SwapTreeSerializer.deserializeSwapTree>
  claimKeyPair: ECPairInterface
  musig: Musig
  swap: ChainSwap
}): any => {
  const { tweakedKey, lockupTx, swapTree, claimKeyPair, musig, swap } = params
  const swapOutput = detectSwap(tweakedKey, lockupTx as any)

  if (!swapOutput || swapOutput.vout === undefined) {
    throw new Error('Swap output not found in lockup transaction')
  }

  return {
    ...swapOutput,
    cooperative: false,
    swapTree,
    keys: claimKeyPair,
    type: OutputType.Taproot,
    txHash: lockupTx.getHash(),
    blindingPrivateKey: parseBlindingKey(swap, true),
    internalKey: musig.getAggregatedPublicKey(),
  }
}

/**
 * Completes collaborative musig signing by aggregating signatures
 * @param params - Parameters for collaborative signing
 * @returns Aggregated signature ready for witness
 */
export const completeCollaborativeSigning = (params: {
  musig: Musig
  serverPubNonce: Buffer
  serverPartialSignature: Buffer
  claimDetails: ClaimDetails[]
  claimTx: Transaction
  inputIndex: number
}): Buffer => {
  const { musig, serverPubNonce, serverPartialSignature, claimDetails, claimTx, inputIndex } = params

  musig.aggregateNoncesOrdered([serverPubNonce, musig.getPublicNonce()])
  musig.initializeSession(hashForWitnessV1(claimDetails, claimTx, inputIndex))
  musig.addPartial(inputIndex, serverPartialSignature)
  musig.signPartial()

  return musig.aggregatePartials()
}

export const parseBlindingKey = (swap: SomeSwap, isRefund: boolean) => {
  let blindingKey: string | undefined

  switch (swap.type) {
    case SwapType.Chain:
      if (isRefund) {
        blindingKey = (swap as ChainSwap).lockupDetails.blindingKey
      } else {
        blindingKey = (swap as ChainSwap).claimDetails.blindingKey
      }
      break
    default:
      blindingKey = (swap as SubmarineSwap | ReverseSwap).blindingKey
  }

  return blindingKey ? Buffer.from(blindingKey, 'hex') : undefined
}
