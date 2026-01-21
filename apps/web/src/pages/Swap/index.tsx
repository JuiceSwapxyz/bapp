import type { Currency } from '@juiceswapxyz/sdk-core'
import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { SwapBottomCard } from 'components/SwapBottomCard'
import { CitreaCampaignProgress } from 'components/swap/CitreaCampaignProgress'
import { PageWrapper } from 'components/swap/styled'
import { useBAppsSwapTracking } from 'hooks/useBAppsSwapTracking'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { useModalState } from 'hooks/useModalState'
import { useRefundableSwaps } from 'hooks/useRefundableSwaps'
import { BAppsCard } from 'pages/Landing/components/cards/BAppsCard'
import { useResetOverrideOneClickSwapFlag } from 'pages/Swap/settings/OneClickSwap'
import { useWebSwapSettings } from 'pages/Swap/settings/useWebSwapSettings'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { useSwapCallback } from 'state/sagas/transactions/swapSaga'
import { useWrapCallback } from 'state/sagas/transactions/wrapSaga'
import { SwapAndLimitContextProvider } from 'state/swap/SwapContext'
import { useInitialCurrencyState } from 'state/swap/hooks'
import type { CurrencyState } from 'state/swap/types'
import { Flex, Text, Tooltip, styled } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useIsModeMismatch } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import type {
  PasskeyAuthStatus,
  SwapRedirectFn,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/SwapTransactionSettingsStoreContextProvider'
import { SwapFlow } from 'uniswap/src/features/transactions/swap/SwapFlow/SwapFlow'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { SwapDependenciesStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContextProvider'
import { SwapFormStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContextProvider'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { isMobileWeb } from 'utilities/src/platform'
import noop from 'utilities/src/react/noop'
import { isIFramed } from 'utils/isIFramed'

const SwapBackground = styled(Flex, {
  name: 'SwapBackground',
  position: 'fixed',
  top: 200,
  left: 0,
  right: 0,
  height: '70vh',
  zIndex: 0,
  pointerEvents: 'none',

  '$platform-web': {
    backgroundImage: `url(/images/landing_page/LandingHero-bg.svg)`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
    backgroundPosition: 'top center',
  },
} as const)

export default function SwapPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // (WEB-4737): Remove this line after completing A/A Test on Web
  useFeatureFlag(FeatureFlags.AATestWeb)

  const accountDrawer = useAccountDrawer()

  const {
    initialInputCurrency,
    initialOutputCurrency,
    initialChainId,
    initialTypedValue,
    initialField,
    triggerConnect,
  } = useInitialCurrencyState()

  const { data: refundableSwaps = [] } = useRefundableSwaps()

  useEffect(() => {
    if (triggerConnect) {
      accountDrawer.open()
      navigate(location.pathname, { replace: true })
    }
  }, [accountDrawer, triggerConnect, navigate, location.pathname])

  useEffect(() => {
    if (refundableSwaps.length > 0) {
      popupRegistry.addPopup(
        {
          type: PopupType.RefundableSwaps,
          count: refundableSwaps.length,
        },
        'refundable-swaps',
        Infinity,
      )
    }
  }, [refundableSwaps.length])

  return (
    <Trace logImpression page={InterfacePageName.SwapPage}>
      <Flex position="relative" width="100%" flex={1} alignItems="center">
        <SwapBackground />
        <PageWrapper>
        <Swap
          chainId={initialChainId}
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
          initialTypedValue={initialTypedValue}
          initialIndependentField={initialField}
          syncTabToUrl={true}
          usePersistedFilteredChainIds
        />
      </PageWrapper>
      </Flex>
    </Trace>
  )
}

/**
 * The swap component displays the swap interface, manages state for the swap, and triggers onchain swaps.
 *
 * In most cases, chainId should refer to the connected chain, i.e. `useAccount().chainId`.
 * However if this component is being used in a context that displays information from a different, unconnected
 * chain (e.g. the TDP), then chainId should refer to the unconnected chain.
 */
export function Swap({
  initialInputCurrency,
  initialOutputCurrency,
  initialTypedValue,
  initialIndependentField,
  chainId,
  hideHeader = false,
  hideFooter = false,
  onCurrencyChange,
  syncTabToUrl,
  swapRedirectCallback,
  tokenColor,
  usePersistedFilteredChainIds = false,
}: {
  chainId?: UniverseChainId
  onCurrencyChange?: (selected: CurrencyState) => void
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialTypedValue?: string
  initialIndependentField?: CurrencyField
  syncTabToUrl: boolean
  hideHeader?: boolean
  hideFooter?: boolean
  swapRedirectCallback?: SwapRedirectFn
  tokenColor?: string
  usePersistedFilteredChainIds?: boolean
  passkeyAuthStatus?: PasskeyAuthStatus
}) {
  const isExplorePage = useIsPage(PageType.EXPLORE)
  const isModeMismatch = useIsModeMismatch(chainId)
  const isSharedSwapDisabled = isModeMismatch && isExplorePage

  const input = currencyToAsset(initialInputCurrency)
  const output = currencyToAsset(initialOutputCurrency)

  const { isSwapTokenSelectorOpen, swapOutputChainId } = useUniswapContext()
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)

  const prefilledState = useSwapPrefilledState({
    input,
    output,
    exactAmountToken: initialTypedValue ?? '',
    exactCurrencyField: initialIndependentField ?? CurrencyField.INPUT,
    selectingCurrencyField: isSwapTokenSelectorOpen ? CurrencyField.OUTPUT : undefined,
    selectingCurrencyChainId: swapOutputChainId,
    skipFocusOnCurrencyField: isMobileWeb,
    filteredChainIdsOverride: usePersistedFilteredChainIds ? persistedFilteredChainIds : undefined,
  })

  return (
    <MultichainContextProvider initialChainId={chainId}>
      <SwapTransactionSettingsStoreContextProvider>
        <SwapAndLimitContextProvider
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
        >
          <PrefetchBalancesWrapper>
            <SwapFormStoreContextProvider
              prefilledState={prefilledState}
              hideSettings={hideHeader}
              hideFooter={hideFooter}
            >
              <Flex position="relative" gap="$spacing16" opacity={isSharedSwapDisabled ? 0.6 : 1}>
                {isSharedSwapDisabled && <DisabledSwapOverlay />}
                <UniversalSwapFlow
                  hideHeader={hideHeader}
                  hideFooter={hideFooter}
                  syncTabToUrl={syncTabToUrl}
                  swapRedirectCallback={swapRedirectCallback}
                  onCurrencyChange={onCurrencyChange}
                  prefilledState={prefilledState}
                  tokenColor={tokenColor}
                />
              </Flex>
            </SwapFormStoreContextProvider>
          </PrefetchBalancesWrapper>
        </SwapAndLimitContextProvider>
      </SwapTransactionSettingsStoreContextProvider>
    </MultichainContextProvider>
  )
}

const PATHNAME_TO_TAB: { [key: string]: SwapTab } = {
  '/swap': SwapTab.Swap,
  '/send': SwapTab.Send, // Keep for send modal
  '/limit': SwapTab.Swap, // Redirect to swap
  '/buy': SwapTab.Swap, // Redirect to swap
  '/sell': SwapTab.Swap, // Redirect to swap
}

function UniversalSwapFlow({
  hideHeader = false,
  hideFooter = false,
  prefilledState,
  onCurrencyChange,
  swapRedirectCallback,
  tokenColor,
}: {
  hideHeader?: boolean
  hideFooter?: boolean
  syncTabToUrl?: boolean
  disableTokenInputs?: boolean
  prefilledState?: SwapFormState
  onCurrencyChange?: (selected: CurrencyState, isBridgePair?: boolean) => void
  swapRedirectCallback?: SwapRedirectFn
  tokenColor?: string
}) {
  const [currentTab, setCurrentTab] = useState(SwapTab.Swap)
  const { pathname } = useLocation()
  // Store onSubmitSwap callback ref for access in swapCallback
  const onSubmitSwapRef = useRef<
    ((txHash?: string, inputToken?: string, outputToken?: string) => Promise<void> | void) | undefined
  >()

  // Removed Limit and Buy form imports as we only support Swap now

  const { openModal: openSendFormModal } = useModalState(ModalName.Send)

  useEffect(() => {
    if (pathname === '/send') {
      setCurrentTab(SwapTab.Swap)
      // Do not open the send modal if iFramed (we do not allow the send tab to be iFramed due to clickjacking protections)
      // https://www.notion.so/uniswaplabs/What-is-not-allowed-to-be-iFramed-Clickjacking-protections-874f85f066c648afa0eb3480b3f47b5c#d0ebf1846c83475a86342a594f77eae5
      if (!isIFramed()) {
        openSendFormModal()
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      setCurrentTab(PATHNAME_TO_TAB[pathname] ?? SwapTab.Swap)
    }
  }, [pathname, setCurrentTab, openSendFormModal])

  // Removed onTabClick as we only have one tab now

  // Removed SWAP_TAB_OPTIONS as we only have one tab now

  const swapSettings = useWebSwapSettings()
  const resetDisableOneClickSwap = useResetOverrideOneClickSwapFlag()

  // Track transaction for campaign monitoring
  const [currentTransaction, setCurrentTransaction] = useState<{
    txHash: string
    chainId: number
    inputToken: string
    outputToken: string
  } | null>(null)

  // Use automatic blockchain confirmation tracking
  useBAppsSwapTracking({
    txHash: currentTransaction?.txHash,
    chainId: currentTransaction?.chainId,
    inputToken: currentTransaction?.inputToken,
    outputToken: currentTransaction?.outputToken,
  })

  // Handle swap submission - store transaction details for monitoring
  const handleSubmitSwap = useCallback(
    // eslint-disable-next-line max-params
    async (txHash?: string, inputToken?: string, outputToken?: string) => {
      resetDisableOneClickSwap()

      // Store transaction details for blockchain confirmation tracking
      if (txHash && inputToken && outputToken) {
        setCurrentTransaction({
          txHash,
          chainId: 5115, // Citrea Testnet
          inputToken,
          outputToken,
        })
      }
    },
    [resetDisableOneClickSwap],
  )

  // Store the callback in ref for access in swapCallback
  onSubmitSwapRef.current = handleSubmitSwap

  const swapCallback = useSwapCallback(onSubmitSwapRef)
  const wrapCallback = useWrapCallback()

  return (
    <Flex>
      {/* Removed header completely - no tabs or title shown */}
      {currentTab === SwapTab.Swap && (
        <Flex gap="$spacing16">
          <SwapDependenciesStoreContextProvider swapCallback={swapCallback} wrapCallback={wrapCallback}>
            <SwapFlow
              settings={swapSettings}
              hideHeader={hideHeader}
              hideFooter={hideFooter}
              onClose={noop}
              swapRedirectCallback={swapRedirectCallback}
              onCurrencyChange={onCurrencyChange}
              prefilledState={prefilledState}
              tokenColor={tokenColor}
              onSubmitSwap={handleSubmitSwap}
            />
          </SwapDependenciesStoreContextProvider>
          <CitreaCampaignProgress />
          <BAppsCard />
          <SwapBottomCard />
        </Flex>
      )}
      {/* Removed Limit, Buy, and Sell tabs as we only support Swap now */}
    </Flex>
  )
}

const DisabledOverlay = styled(Flex, {
  position: 'absolute',
  width: '100%',
  height: '100%',
  zIndex: zIndexes.overlay,
})

const DisabledSwapOverlay = () => {
  const { t } = useTranslation()

  return (
    <DisabledOverlay cursor="not-allowed">
      <Tooltip placement="left-start">
        <Tooltip.Content animationDirection="left">
          <Tooltip.Arrow />
          <Text variant="body4">{t('testnet.unsupported')}</Text>
        </Tooltip.Content>
        <Tooltip.Trigger position="relative" width="100%" height="100%">
          <DisabledOverlay />
        </Tooltip.Trigger>
      </Tooltip>
    </DisabledOverlay>
  )
}
