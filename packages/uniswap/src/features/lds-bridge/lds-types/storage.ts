import type { LightningBridgeSubmarineLockResponse } from 'uniswap/src/features/lds-bridge/lds-types/api'
import { CreateChainSwapResponse, CreateReverseSwapResponse } from 'uniswap/src/features/lds-bridge/lds-types/api'
import type { LdsSwapStatus } from './websocket'

export enum SwapType {
  Submarine = 'submarine',
  Reverse = 'reverse',
  Chain = 'chain',
}

export type SwapBase = {
  type: SwapType
  status?: LdsSwapStatus
  assetSend: string
  assetReceive: string
  sendAmount: number
  receiveAmount: number
  version: number
  date: number
  preimageHash: string
  mnemonic: string
  keyIndex: number
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
    mnemonic?: string
    blindingKey?: string
    // Deprecated; used for backwards compatibility
    refundPrivateKey?: string
  }

export type ReverseSwap = SwapBase &
  CreateReverseSwapResponse & {
    preimage: string
    claimAddress: string
    claimPrivateKeyIndex?: number
    mnemonic: string
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
    mnemonic: string

    // Deprecated; used for backwards compatibility
    claimPrivateKey?: string
    refundPrivateKey?: string
  }

export type SomeSwap = SubmarineSwap | ReverseSwap | ChainSwap
