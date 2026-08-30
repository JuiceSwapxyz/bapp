import { TFunction } from 'i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { FetchError, getFetchErrorMessage, isRateLimitFetchError } from 'uniswap/src/data/apiClients/FetchError'
import { Err404 } from 'uniswap/src/data/tradingApi/__generated__'

import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'

export function getSwapWarningFromError({
  error,
  t,
  derivedSwapInfo,
}: {
  error: Error
  t: TFunction
  derivedSwapInfo: DerivedSwapInfo
}): Warning {
  // Trade object is null for quote not found case
  const isBridgeTrade =
    derivedSwapInfo.currencies.input?.currency.chainId !== derivedSwapInfo.currencies.output?.currency.chainId

  if (error instanceof FetchError) {
    // Special case: rate limit errors are not parsed by errorCode
    if (isRateLimitFetchError(error)) {
      return {
        type: WarningLabel.RateLimit,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('swap.warning.rateLimit.title'),
        message: t('swap.warning.rateLimit.message'),
      }
    }

    // Check for insufficient bridge liquidity
    if (
      error.data?.error === 'INSUFFICIENT_BRIDGE_LIQUIDITY' ||
      error.data?.errorCode === 'InsufficientBridgeLiquidity'
    ) {
      return {
        type: WarningLabel.LowLiquidity,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('swap.warning.insufficientBridgeLiquidity.title'),
        message: t('swap.warning.insufficientBridgeLiquidity.message'),
      }
    }

    // JUSD Gateway deposit/withdrawal paused (e.g. savings rate is 0%).
    // This is a deliberate protocol-level pause, not a routing failure — surface the
    // real reason instead of the generic "trade cannot be completed" message.
    if (typeof error.data?.error === 'string' && /^GATEWAY_.*_DISABLED$/.test(error.data.error)) {
      return {
        type: WarningLabel.GatewayJusdDisabled,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('swap.warning.gatewayJusdDisabled.title'),
        message: t('swap.warning.gatewayJusdDisabled.message', {
          // Prefer the human-readable `detail` field over the raw `error` code.
          reason:
            (typeof error.data?.detail === 'string' ? error.data.detail : undefined) ??
            getFetchErrorMessage(error) ??
            t('swap.warning.gatewayJusdDisabled.title'),
        }),
      }
    }

    // Map errorCode to Warning
    switch (error.data?.errorCode) {
      case Err404.errorCode.QUOTE_AMOUNT_TOO_LOW_ERROR: {
        return {
          type: WarningLabel.EnterLargerAmount,
          severity: WarningSeverity.Low,
          action: WarningAction.DisableReview,
          title: t('swap.warning.enterLargerAmount.title'),
          message: undefined,
        }
      }

      case Err404.errorCode.RESOURCE_NOT_FOUND: {
        if (isBridgeTrade) {
          return {
            type: WarningLabel.NoQuotesFound,
            severity: WarningSeverity.Low,
            action: WarningAction.DisableReview,
            title: t('swap.warning.noQuotesFound.title'),
            message: t('swap.warning.noQuotesFound.bridging.message'),
          }
        }
        return {
          type: WarningLabel.NoRoutesError,
          severity: WarningSeverity.Low,
          action: WarningAction.DisableReview,
          title: t('swap.warning.noRoutesFound.title'),
          message: t('swap.warning.noRoutesFound.message'),
        }
      }

      case Err404.errorCode.QUOTE_AMOUNT_TOO_HIGH: {
        return {
          type: WarningLabel.EnterSmallerAmount,
          severity: WarningSeverity.Low,
          action: WarningAction.DisableReview,
          title: t('Exceeds maximum limit available'),
          message: t('Exceeds maximum limit available'),
        }
      }
    }
  }

  // Generic routing error if we can't parse a specific case
  return {
    type: WarningLabel.SwapRouterError,
    severity: WarningSeverity.Low,
    action: WarningAction.DisableReview,
    title: t('swap.warning.router.title'),
    message: t('swap.warning.router.message'),
  }
}
