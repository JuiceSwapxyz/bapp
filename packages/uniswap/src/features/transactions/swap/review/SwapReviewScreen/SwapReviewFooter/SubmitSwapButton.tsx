import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, Flex, useIsShortMobileDevice } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import type { AppTFunction } from 'ui/src/i18n/types'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import type { PasskeyAuthStatus } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { FlashblocksConfirmButton } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/FlashblocksConfirmButton'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import type { SubmitButtonDisableReason } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/getSubmitButtonDisableReason'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import type { BitcoinBridgeBitcoinToCitreaStep } from 'uniswap/src/features/transactions/swap/steps/bitcoinBridge'
import type { LightningBridgeReverseStep } from 'uniswap/src/features/transactions/swap/steps/lightningBridge'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isInterface } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const KEEP_OPEN_MSG_DELAY = 3 * ONE_SECOND_MS

interface SubmitSwapButtonProps {
  disabled: boolean
  disableReason?: SubmitButtonDisableReason | null
  onSubmit: () => void
  showPendingUI: boolean
  warning?: Warning
}

export function SubmitSwapButton({
  disabled,
  disableReason,
  onSubmit,
  showPendingUI,
  warning,
}: SubmitSwapButtonProps): JSX.Element {
  const { t } = useTranslation()
  const { renderBiometricsIcon, passkeyAuthStatus } = useTransactionModalContext()

  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const isConfirmed = useSwapFormStore((s) => s.isConfirmed)
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(chainId)
  const currentStep = useSwapReviewStore((s) => s.currentStep)
  const isErc20ChainSwap = useSwapReviewTransactionStore((s) => s.isErc20ChainSwap)
  const {
    wrapType,
    trade: { trade, indicativeTrade },
  } = useSwapFormStoreDerivedSwapInfo((s) => ({
    wrapType: s.wrapType,
    trade: s.trade,
  }))
  const indicative = Boolean(!trade && indicativeTrade)

  const swapTxContext = useSwapTxStore((s) => s)
  const actionText = getActionText({
    t,
    wrapType,
    swapTxContext,
    warning,
    isAuthenticated: Boolean(passkeyAuthStatus?.isSessionAuthenticated),
    disableReason,
  })

  const isShortMobileDevice = useIsShortMobileDevice()
  const size = isShortMobileDevice ? 'medium' : 'large'

  const isErc20ChainSwapInProgress =
    isErc20ChainSwap && currentStep?.step.type === TransactionStepType.Erc20ChainSwapStep

  const icon = useMemo(() => {
    if (renderBiometricsIcon) {
      return renderBiometricsIcon({})
    } else if (passkeyAuthStatus?.isSignedInWithPasskey && !passkeyAuthStatus.isSessionAuthenticated) {
      return <Passkey size="$icon.24" />
    }
    return undefined
  }, [renderBiometricsIcon, passkeyAuthStatus?.isSignedInWithPasskey, passkeyAuthStatus?.isSessionAuthenticated])

  switch (true) {
    case indicative: {
      return (
        <Button loading variant="default" emphasis="secondary" size={size}>
          {t('swap.finalizingQuote')}
        </Button>
      )
    }
    case showPendingUI: {
      return (
        <Button loading variant="branded" emphasis="primary" size={size}>
          <DelayedSubmissionText />
        </Button>
      )
    }
    case isConfirmed && isFlashblocksEnabled: {
      // this has side effects for the balance logic as well
      return <FlashblocksConfirmButton size={size} />
    }
    case isErc20ChainSwapInProgress: {
      return (
        <Button loading isDisabled variant="branded" emphasis="primary" size={size}>
          {t('swap.button.processing')}
        </Button>
      )
    }
    case isInterface && isSubmitting: {
      return (
        <Button loading shouldAnimateBetweenLoadingStates={false} size={size}>
          <ConfirmInWalletText passkeyAuthStatus={passkeyAuthStatus} />
        </Button>
      )
    }
    case warning?.severity === WarningSeverity.High && !disabled: {
      // The critical (red) variant signals "you can proceed, but it's risky".
      // When the button is *also* disabled for an unrelated reason, the red
      // colour clashes with the disable-reason text (e.g. red "Loading
      // quote..."). Falling through to the default case in that combination
      // keeps the colour and the message in sync.
      return (
        <Button variant="critical" emphasis="primary" icon={icon} size={size} testID={TestID.Swap} onPress={onSubmit}>
          {actionText}
        </Button>
      )
    }
    default: {
      return (
        <Button
          variant={disabled ? 'default' : 'branded'}
          emphasis={disabled ? 'secondary' : 'primary'}
          isDisabled={disabled}
          icon={icon}
          size={size}
          testID={TestID.Swap}
          onPress={onSubmit}
        >
          {actionText}
        </Button>
      )
    }
  }
}

export enum SwapAction {
  Wrap = 'WRAP',
  Unwrap = 'UNWRAP',
  Swap = 'SWAP',
  SwapAnyway = 'SWAP_ANYWAY',
  ApproveAndSwap = 'APPROVE_AND_SWAP',
  SignAndSwap = 'SIGN_AND_SWAP',
}

// TODO: Refactor this to not need the entire `swapTxContext` from the store
export const getActionText = ({
  t,
  wrapType,
  swapTxContext,
  warning,
  isAuthenticated,
  disableReason,
}: {
  t: AppTFunction
  wrapType: WrapType
  swapTxContext?: SwapTxAndGasInfo
  warning?: Warning
  isAuthenticated?: boolean
  disableReason?: SubmitButtonDisableReason | null
}): string => {
  // When the button is disabled for a reason the user can act on, the button
  // label IS the explanation. Falls back to the standard action label otherwise.
  // `blocking_warning` already has the `warning.buttonText` path on the form
  // screen, but at review time we surface the warning's title so the user can
  // see WHY (e.g. "Insufficient USDC.e balance") instead of a silent grey button.
  if (disableReason) {
    const reasonText = getDisableReasonText({ t, disableReason })
    if (reasonText) {
      return reasonText
    }
  }

  const action = getSwapAction({ wrapType, swapTxContext, warning })

  const textMap: Record<SwapAction, { default: string; authenticated: string }> = {
    [SwapAction.Wrap]: {
      default: t('swap.button.wrap'),
      authenticated: t('swap.confirmWrap'),
    },
    [SwapAction.Unwrap]: {
      default: t('swap.button.unwrap'),
      authenticated: t('swap.button.confirmUnwrap'),
    },
    [SwapAction.ApproveAndSwap]: {
      default: t('swap.approveAndSwap'),
      authenticated: t('swap.confirmApproveAndSwap'),
    },
    [SwapAction.SignAndSwap]: {
      default: t('swap.signAndSwap'),
      authenticated: t('swap.button.confirmSignAndSwap'),
    },
    [SwapAction.SwapAnyway]: {
      default: t('swap.button.swapAnyways'),
      authenticated: t('swap.button.confirmSwapAnyways'),
    },
    [SwapAction.Swap]: {
      default: t('swap.button.swap'),
      authenticated: t('swap.confirmSwap'),
    },
  }

  return isAuthenticated ? textMap[action].authenticated : textMap[action].default
}

function DelayedSubmissionText(): JSX.Element {
  const { t } = useTranslation()
  const [showKeepOpenMessage, setShowKeepOpenMessage] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setShowKeepOpenMessage(true), KEEP_OPEN_MSG_DELAY)
    return () => clearTimeout(timeout)
  }, [])

  // Use different key to re-trigger animation when message changes
  const key = showKeepOpenMessage ? 'submitting-text-msg1' : 'submitting-text-msg2'

  return (
    <AnimatePresence key={key}>
      <Flex animateEnterExit="fadeInDownOutDown" animation="quicker">
        <Button.Text>
          {showKeepOpenMessage ? t('swap.button.submitting.keep.open') : t('swap.button.submitting')}
        </Button.Text>
      </Flex>
    </AnimatePresence>
  )
}

function useHasInvoiceDisplayed(): boolean {
  const currentStep = useSwapReviewStore((s) => s.currentStep)

  if (currentStep?.step.type === TransactionStepType.BitcoinBridgeBitcoinToCitreaStep) {
    return Boolean((currentStep.step as BitcoinBridgeBitcoinToCitreaStep).bip21)
  }

  if (currentStep?.step.type === TransactionStepType.LightningBridgeReverseStep) {
    return Boolean((currentStep.step as LightningBridgeReverseStep).invoice)
  }

  return false
}

function ConfirmInWalletText({ passkeyAuthStatus }: { passkeyAuthStatus?: PasskeyAuthStatus }): JSX.Element {
  const { t } = useTranslation()
  const hasInvoice = useHasInvoiceDisplayed()

  let text = t('common.confirmWallet')
  if (hasInvoice) {
    text = t('swap.button.payInvoice')
  } else if (passkeyAuthStatus?.isSessionAuthenticated) {
    text = t('swap.button.submitting')
  } else if (passkeyAuthStatus?.isSignedInWithPasskey) {
    text = t('swap.button.submitting.passkey')
  }

  return (
    <AnimatePresence>
      <Flex animateEnterExit="fadeInDownOutDown" animation="quicker">
        <Button.Text>{text}</Button.Text>
      </Flex>
    </AnimatePresence>
  )
}

/**
 * Maps each disable reason to a user-facing label that goes ON the button.
 *
 * The `is_submitting` branch is intentionally absent — that state has its own
 * loading button up in the main `switch` (the `isSubmitting` case renders
 * `ConfirmInWalletText`), so the user already sees what's happening and we
 * must not overwrite that text here.
 *
 * Returns `undefined` only for branches handled elsewhere; the calling code
 * then falls back to the standard action label.
 */
const getDisableReasonText = ({
  t,
  disableReason,
}: {
  t: AppTFunction
  disableReason: SubmitButtonDisableReason
}): string | undefined => {
  // Handled by the dedicated `isSubmitting` case in the main `switch` so
  // the spinner + "Confirm in wallet" UI keeps rendering — we must not
  // overwrite that label here.
  if (disableReason.kind === 'is_submitting') {
    return undefined
  }
  // Prefer the warning's own buttonText (e.g. "Insufficient USDC.e balance")
  // and fall back to its title so the button is never silently disabled.
  // The generic last-resort ensures *every* path produces user-visible
  // text — no blocking warning can ever produce a silent grey button.
  if (disableReason.kind === 'blocking_warning') {
    return disableReason.warning.buttonText ?? disableReason.warning.title ?? t('swap.button.disabled.cannotProceed')
  }
  const textByKind: Record<Exclude<SubmitButtonDisableReason['kind'], 'is_submitting' | 'blocking_warning'>, string> = {
    invalid_swap: t('swap.button.disabled.loadingQuote'),
    new_trade_requires_acceptance: t('swap.button.disabled.acceptNewPrice'),
    token_warning_unchecked: t('swap.button.disabled.acknowledgeTokenWarning'),
    lightning_address_invalid: t('swap.button.disabled.enterValidLightningAddress'),
    bitcoin_address_invalid: t('swap.button.disabled.enterValidBitcoinAddress'),
  }
  return textByKind[disableReason.kind]
}

const getSwapAction = ({
  wrapType,
  swapTxContext,
  warning,
}: {
  wrapType: WrapType
  swapTxContext?: SwapTxAndGasInfo
  warning?: Warning
}): SwapAction => {
  if (wrapType === WrapType.Wrap) {
    return SwapAction.Wrap
  }
  if (wrapType === WrapType.Unwrap) {
    return SwapAction.Unwrap
  }

  const hasPermitTx =
    swapTxContext && isClassic(swapTxContext) ? swapTxContext.permit?.method === PermitMethod.Transaction : false
  const hasApproveTx = Boolean(swapTxContext?.approveTxRequest)

  if (isInterface && (hasPermitTx || hasApproveTx)) {
    return SwapAction.ApproveAndSwap
  }
  if (isInterface && swapTxContext && isClassic(swapTxContext) && swapTxContext.unsigned) {
    return SwapAction.SignAndSwap
  }
  if (warning?.severity === WarningSeverity.High) {
    return SwapAction.SwapAnyway
  }

  return SwapAction.Swap
}
