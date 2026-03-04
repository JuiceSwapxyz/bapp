import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { BitcoinBridgeBitcoinToCitreaStep, BtcToCitreaSubStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
import { Erc20ChainSwapStep, Erc20ChainSwapSubStep } from 'uniswap/src/features/transactions/swap/steps/erc20ChainSwap'
import { LightningBridgeReverseStep, LnReverseSubStep } from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
import { WbtcBridgeStep, WbtcBridgeSubStep } from 'uniswap/src/features/transactions/swap/steps/wbtcBridge'

type ClaimPendingStep =
  | Erc20ChainSwapStep
  | WbtcBridgeStep
  | LightningBridgeReverseStep
  | BitcoinBridgeBitcoinToCitreaStep

interface CurrentStep {
  step: { type: string; subStep?: string; txHash?: string }
}

export function getClaimPendingStep(currentStep: CurrentStep | undefined | null): ClaimPendingStep | undefined {
  if (!currentStep) return undefined
  const { type, subStep } = currentStep.step

  if (type === TransactionStepType.Erc20ChainSwapStep && subStep === Erc20ChainSwapSubStep.ClaimPending) {
    return currentStep.step as Erc20ChainSwapStep
  }
  if (type === TransactionStepType.WbtcBridgeStep && subStep === WbtcBridgeSubStep.ClaimPending) {
    return currentStep.step as WbtcBridgeStep
  }
  if (type === TransactionStepType.LightningBridgeReverseStep && subStep === LnReverseSubStep.ClaimPending) {
    return currentStep.step as LightningBridgeReverseStep
  }
  if (type === TransactionStepType.BitcoinBridgeBitcoinToCitreaStep && subStep === BtcToCitreaSubStep.ClaimPending) {
    return currentStep.step as BitcoinBridgeBitcoinToCitreaStep
  }
  return undefined
}
