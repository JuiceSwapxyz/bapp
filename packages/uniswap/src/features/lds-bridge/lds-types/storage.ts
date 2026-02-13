import type { LightningBridgeSubmarineLockResponse } from 'uniswap/src/features/lds-bridge/lds-types/api'
import { CreateChainSwapResponse, CreateReverseSwapResponse } from 'uniswap/src/features/lds-bridge/lds-types/api'
import type { LdsSwapStatus } from 'uniswap/src/features/lds-bridge/lds-types/websocket'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

export enum SwapType {
  Submarine = 'submarine',
  Reverse = 'reverse',
  Chain = 'chain',
}

export type SwapBase = {
  type: SwapType
  userId: string
  status: LdsSwapStatus
  assetSend: string
  assetReceive: string
  sendAmount: number
  receiveAmount: number
  version: number
  date: number
  preimageHash: string
  preimageSeed: string
  keyIndex: number
  chainId?: UniverseChainId
  // Not set for submarine swaps; but set for interface compatibility
  claimTx?: string

  refundTx?: string
  lockupTx?: string

  signer?: string
  // Set for hardware wallet signers
  derivationPath?: string
}

export type SubmarineSwap = SwapBase &
  LightningBridgeSubmarineLockResponse & {
    invoice: string
    preimage?: string
    refundPrivateKeyIndex?: number
    blindingKey?: string
    // Deprecated; used for backwards compatibility
    refundPrivateKey?: string
  }

export type ReverseSwap = SwapBase &
  CreateReverseSwapResponse & {
    preimage: string
    claimAddress: string
    claimPrivateKeyIndex?: number
    blindingKey?: string
    // Deprecated; used for backwards compatibility
    claimPrivateKey?: string
  }

export type ChainSwap = SwapBase &
  CreateChainSwapResponse & {
    preimage: string
    claimAddress: string
    claimPrivateKeyIndex?: number
    refundPrivateKeyIndex?: number
    magicRoutingHintSavedFees?: string

    // Deprecated; used for backwards compatibility
    claimPrivateKey?: string
    refundPrivateKey?: string

    // EVM Chain Swap: All 4 transaction IDs
    // Source chain (where user sends funds)
    sourceChainId?: number
    sourceLockupTx?: string // User lockup TX on source chain
    sourceClaimTx?: string // Boltz claim TX on source chain

    // Destination chain (where user receives funds)
    destChainId?: number
    destLockupTx?: string // Boltz lockup TX on destination chain
    destClaimTx?: string // User claim TX on destination chain
  }

export type SomeSwap = SubmarineSwap | ReverseSwap | ChainSwap
