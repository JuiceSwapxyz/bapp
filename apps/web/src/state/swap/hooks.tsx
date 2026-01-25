import { Currency, Token } from '@juiceswapxyz/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { CurrencyState, SerializedCurrencyState, SwapState } from 'state/swap/types'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/useSwapContext'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ALWAYS_ENABLED_CHAIN_IDS } from 'uniswap/src/features/chains/utils'
import { getJuiceAddress, isJuiceAddress } from 'uniswap/src/features/tokens/jusdAbstraction'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isAddress } from 'utilities/src/addresses'
import { getParsedChainId } from 'utils/chainParams'

/**
 * Maps well-known currency symbols to their "home" chain.
 * This allows URLs like /swap?inputCurrency=BTC&outputCurrency=cBTC to work
 * without explicitly specifying chain and outputChain parameters.
 *
 * @param symbol - The currency symbol (e.g., 'BTC', 'cBTC', 'ETH')
 * @returns The chain ID where this currency is native, or undefined if unknown
 */
function getHomeChainForCurrency(symbol: string): UniverseChainId | undefined {
  const symbolUpper = symbol.toUpperCase()

  switch (symbolUpper) {
    // Bitcoin is native to the Bitcoin chain
    case 'BTC':
      return UniverseChainId.Bitcoin

    // cBTC is native to Citrea (testnet for now, mainnet when available)
    case 'CBTC':
      return UniverseChainId.CitreaTestnet

    default:
      return undefined
  }
}

export function useSwapActionHandlers(): {
  onSwitchTokens: (options: { newOutputHasTax: boolean; previouslyEstimatedOutput: string }) => void
} {
  const { swapState, setSwapState } = useSwapContext()
  const { setCurrencyState } = useSwapAndLimitContext()

  const onSwitchTokens = useCallback(
    ({
      newOutputHasTax,
      previouslyEstimatedOutput,
    }: {
      newOutputHasTax: boolean
      previouslyEstimatedOutput: string
    }) => {
      // To prevent swaps with FOT tokens as exact-outputs, we leave it as an exact-in swap and use the previously estimated output amount as the new exact-in amount.
      if (newOutputHasTax && swapState.independentField === CurrencyField.INPUT) {
        setSwapState((swapState) => ({
          ...swapState,
          typedValue: previouslyEstimatedOutput,
        }))
      } else {
        setSwapState((prev) => ({
          ...prev,
          independentField: prev.independentField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT,
        }))
      }

      setCurrencyState((prev) => ({
        inputCurrency: prev.outputCurrency,
        outputCurrency: prev.inputCurrency,
      }))
    },
    [setCurrencyState, setSwapState, swapState.independentField],
  )

  return {
    onSwitchTokens,
  }
}

function parseFromURLParameter(urlParam: ParsedQs[string]): string | undefined {
  if (typeof urlParam === 'string') {
    return urlParam
  }
  return undefined
}

function getTokenAddressBySymbol(chainId: UniverseChainId | undefined, symbol: string): string | undefined {
  if (!chainId) return undefined

  const chainInfo = getChainInfo(chainId)
  const symbolUpper = symbol.toUpperCase()

  // Check if symbol matches native currency (e.g., cBTC on Citrea, ETH on Ethereum, BTC on Bitcoin)
  if (chainInfo.nativeCurrency.symbol.toUpperCase() === symbolUpper) {
    return NATIVE_CHAIN_ID
  }

  if (symbolUpper === 'USDT') {
    return chainInfo.tokens.USDT?.address
  }

  if (symbolUpper === 'JUSD') {
    return (chainInfo.tokens as any).JUSD?.address
  }

  if (symbolUpper === 'JUICE') {
    return getJuiceAddress(chainId)
  }

  return undefined
}

function getCurrencyFromChainInfo(chainId: UniverseChainId, address: string): Currency | undefined {
  // Handle native currencies (NATIVE_CHAIN_ID, BTC, cBTC)
  if (address === NATIVE_CHAIN_ID || ['btc', 'cbtc', 'native'].includes(address.toLowerCase())) {
    return nativeOnChain(chainId)
  }

  if (!isAddress(address)) {
    return undefined
  }

  const chainInfo = getChainInfo(chainId)
  const normalizedAddress = address.toLowerCase()

  if (chainInfo.tokens.USDT?.address.toLowerCase() === normalizedAddress) {
    return chainInfo.tokens.USDT
  }

  const jusdToken = (chainInfo.tokens as any).JUSD as Token | undefined
  if (jusdToken?.address.toLowerCase() === normalizedAddress) {
    return jusdToken
  }

  return undefined
}

function getTokenSymbolByAddress(chainId: UniverseChainId | undefined, address: string): string | undefined {
  if (!chainId || !isAddress(address)) return undefined

  const chainInfo = getChainInfo(chainId)
  const normalizedAddress = address.toLowerCase()

  if (chainInfo.tokens.USDT?.address.toLowerCase() === normalizedAddress) {
    return 'USDT'
  }

  const jusdToken = (chainInfo.tokens as any).JUSD as Token | undefined
  if (jusdToken?.address.toLowerCase() === normalizedAddress) {
    return 'JUSD'
  }

  if (isJuiceAddress(chainId, address)) {
    return 'JUICE'
  }

  return undefined
}

export function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string | undefined {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) {
      return valid
    }

    const upper = urlParam.toUpperCase()

    if (urlParam === NATIVE_CHAIN_ID) {
      return NATIVE_CHAIN_ID
    }

    // BTC is the native token on Bitcoin chain
    if (upper === 'BTC') {
      return NATIVE_CHAIN_ID
    }

    // cBTC is the native token on Citrea - treat like NATIVE
    if (upper === 'CBTC') {
      return NATIVE_CHAIN_ID
    }

    if (upper === 'USDT' || upper === 'JUSD' || upper === 'USDC' || upper === 'DAI' || upper === 'JUICE') {
      return upper
    }
  }
  return undefined
}

interface BaseSwapParams {
  chainId?: UniverseChainId
  outputChainId?: UniverseChainId
  inputCurrency?: string
  outputCurrency?: string
  typedValue?: string
  independentField?: CurrencyField
}

function createBaseSwapURLParams({
  chainId,
  outputChainId,
  inputCurrency,
  outputCurrency,
  typedValue,
  independentField,
}: BaseSwapParams): URLSearchParams {
  const params = new URLSearchParams()

  if (chainId) {
    params.set('chain', getChainInfo(chainId).interfaceName)
  }

  if (outputChainId && outputChainId !== chainId) {
    params.set('outputChain', getChainInfo(outputChainId).interfaceName)
  }

  if (inputCurrency) {
    params.set('inputCurrency', inputCurrency)
  }

  if (outputCurrency) {
    params.set('outputCurrency', outputCurrency)
  }

  if (typedValue) {
    params.set('value', typedValue)
  }

  if (independentField) {
    params.set('field', independentField)
  }

  return params
}

export function serializeSwapStateToURLParameters(
  state: CurrencyState & Partial<SwapState> & { chainId: UniverseChainId },
): string {
  const { inputCurrency, outputCurrency, typedValue, independentField, chainId } = state
  const hasValidInput = (inputCurrency || outputCurrency) && typedValue

  const getCurrencyParam = (currency: Currency | undefined, currencyChainId: UniverseChainId): string | undefined => {
    if (!currency) return undefined
    if (currency.isNative) return NATIVE_CHAIN_ID
    const symbol = getTokenSymbolByAddress(currencyChainId, currency.address)
    return symbol ?? currency.address
  }

  return (
    '?' +
    createBaseSwapURLParams({
      chainId,
      outputChainId: outputCurrency?.chainId !== inputCurrency?.chainId ? outputCurrency?.chainId : undefined,
      inputCurrency: getCurrencyParam(inputCurrency, chainId),
      outputCurrency: getCurrencyParam(outputCurrency, outputCurrency?.chainId ?? chainId),
      typedValue: hasValidInput ? typedValue : undefined,
      independentField: hasValidInput ? independentField : undefined,
    }).toString()
  )
}

export function serializeSwapAddressesToURLParameters({
  inputTokenAddress,
  outputTokenAddress,
  chainId,
  outputChainId,
}: {
  inputTokenAddress?: string
  outputTokenAddress?: string
  chainId?: UniverseChainId | null
  outputChainId?: UniverseChainId | null
}): string {
  const chainIdOrDefault = chainId ?? UniverseChainId.Mainnet
  const outputChainIdOrDefault = outputChainId ?? chainIdOrDefault

  const getAddressParam = (address: string | undefined, currencyChainId: UniverseChainId): string | undefined => {
    if (!address) return undefined
    if (address === getNativeAddress(currencyChainId)) return NATIVE_CHAIN_ID
    const symbol = getTokenSymbolByAddress(currencyChainId, address)
    return symbol ?? address
  }

  return (
    '?' +
    createBaseSwapURLParams({
      chainId: chainId ?? undefined,
      outputChainId: outputChainId ?? undefined,
      inputCurrency: getAddressParam(inputTokenAddress, chainIdOrDefault),
      outputCurrency: getAddressParam(outputTokenAddress, outputChainIdOrDefault),
    }).toString()
  )
}

export function queryParametersToCurrencyState(parsedQs: ParsedQs): SerializedCurrencyState {
  // Parse explicit chain params from URL
  const explicitChainId = getParsedChainId(parsedQs)
  const explicitOutputChainId = getParsedChainId(parsedQs, CurrencyField.OUTPUT)

  // Get raw URL parameters for chain inference (before conversion to NATIVE_CHAIN_ID)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const rawInputCurrency =
    typeof (parsedQs.inputCurrency ?? parsedQs.inputcurrency) === 'string'
      ? ((parsedQs.inputCurrency ?? parsedQs.inputcurrency) as string)
      : undefined
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const rawOutputCurrency =
    typeof (parsedQs.outputCurrency ?? parsedQs.outputcurrency) === 'string'
      ? ((parsedQs.outputCurrency ?? parsedQs.outputcurrency) as string)
      : undefined

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const parsedInputCurrencyAddress = parseCurrencyFromURLParameter(parsedQs.inputCurrency ?? parsedQs.inputcurrency)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const parsedOutputCurrencyAddress = parseCurrencyFromURLParameter(parsedQs.outputCurrency ?? parsedQs.outputcurrency)

  // Infer chains from currency symbols if not explicitly specified
  // Use raw URL params (BTC, cBTC) not parsed ones (NATIVE_CHAIN_ID) so we can identify the chain
  const inferredInputChainId =
    !explicitChainId && rawInputCurrency ? getHomeChainForCurrency(rawInputCurrency) : undefined
  const inferredOutputChainId =
    !explicitOutputChainId && rawOutputCurrency ? getHomeChainForCurrency(rawOutputCurrency) : undefined

  // Use explicit chain if provided, otherwise use inferred chain
  const chainId = explicitChainId ?? inferredInputChainId
  const outputChainId = explicitOutputChainId ?? inferredOutputChainId

  const outputCurrencyAddress =
    parsedOutputCurrencyAddress === parsedInputCurrencyAddress && outputChainId === chainId
      ? undefined
      : parsedOutputCurrencyAddress
  const hasCurrencyInput = parsedInputCurrencyAddress || outputCurrencyAddress
  const value = hasCurrencyInput ? parseFromURLParameter(parsedQs.value) : undefined
  const field = value ? parseFromURLParameter(parsedQs.field) : undefined

  return {
    inputCurrencyAddress: parsedInputCurrencyAddress,
    outputCurrencyAddress,
    value,
    field,
    chainId,
    outputChainId,
  }
}

// Despite a lighter QuickTokenBalances query we've received feedback that the initial load time is too slow.
// Removing the logic that uses user's balance to determine the initial currency.
// We can revisit this if we find a way to make the initial load time faster.

// When we get the speed up here is the PR that removed the beautiful code:
// https://app.graphite.dev/github/pr/Uniswap/universe/11068/fix-web-default-to-eth-mainnet-on-multichain
export function useInitialCurrencyState(): {
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialTypedValue?: string
  initialField?: CurrencyField
  initialChainId: UniverseChainId
  triggerConnect: boolean
} {
  const { setIsUserSelectedToken } = useMultichainContext()
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)

  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  const parsedCurrencyState = useMemo(() => {
    return queryParametersToCurrencyState(parsedQs)
  }, [parsedQs])

  // For non-EVM chains like Bitcoin, use the parsed chain directly (they won't be in "supported" EVM chains)
  const evmSupportedChainId = useSupportedChainId(parsedCurrencyState.chainId ?? defaultChainId)
  const isNonEvmChain =
    parsedCurrencyState.chainId === UniverseChainId.Bitcoin ||
    parsedCurrencyState.chainId === UniverseChainId.LightningNetwork
  const supportedChainId: UniverseChainId = isNonEvmChain
    ? (parsedCurrencyState.chainId as UniverseChainId)
    : evmSupportedChainId ?? UniverseChainId.Mainnet
  const supportedChainInfo = getChainInfo(supportedChainId)
  const isChainExplicitlySpecified = !!parsedCurrencyState.chainId
  const isSupportedChainCompatible =
    isChainExplicitlySpecified ||
    isTestnetModeEnabled === !!supportedChainInfo.testnet ||
    ALWAYS_ENABLED_CHAIN_IDS.includes(supportedChainId)

  const hasCurrencyQueryParams =
    parsedCurrencyState.inputCurrencyAddress || parsedCurrencyState.outputCurrencyAddress || parsedCurrencyState.chainId

  useEffect(() => {
    if (parsedCurrencyState.inputCurrencyAddress || parsedCurrencyState.outputCurrencyAddress) {
      setIsUserSelectedToken(true)
    }
  }, [parsedCurrencyState.inputCurrencyAddress, parsedCurrencyState.outputCurrencyAddress, setIsUserSelectedToken])

  const { initialInputCurrencyAddress, initialChainId } = useMemo(() => {
    // Default to native token if no query params or chain is not compatible with testnet or mainnet mode
    if (!hasCurrencyQueryParams || !isSupportedChainCompatible) {
      const initialChainId = persistedFilteredChainIds?.input ?? defaultChainId
      return {
        initialInputCurrencyAddress: getNativeAddress(initialChainId),
        initialChainId,
      }
    }
    // Handle query params or disconnected state
    if (parsedCurrencyState.inputCurrencyAddress) {
      let resolvedAddress: string | undefined
      if (
        parsedCurrencyState.inputCurrencyAddress !== NATIVE_CHAIN_ID &&
        parsedCurrencyState.inputCurrencyAddress !== 'ETH' &&
        !isAddress(parsedCurrencyState.inputCurrencyAddress)
      ) {
        resolvedAddress = getTokenAddressBySymbol(supportedChainId, parsedCurrencyState.inputCurrencyAddress)
        if (!resolvedAddress) {
          resolvedAddress = parsedCurrencyState.inputCurrencyAddress
        }
      } else {
        resolvedAddress = parsedCurrencyState.inputCurrencyAddress
      }

      return {
        initialInputCurrencyAddress: resolvedAddress,
        initialChainId: supportedChainId,
      }
    }
    // return native token on other chains
    return {
      initialInputCurrencyAddress: parsedCurrencyState.outputCurrencyAddress ? undefined : 'ETH',
      initialChainId: supportedChainId,
    }
    // We do not want to rerender on a change to persistedFilteredChainIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasCurrencyQueryParams,
    isSupportedChainCompatible,
    parsedCurrencyState.inputCurrencyAddress,
    parsedCurrencyState.outputCurrencyAddress,
    supportedChainId,
    defaultChainId,
  ])

  const outputChainIsSupported = useSupportedChainId(parsedCurrencyState.outputChainId)

  const initialOutputCurrencyAddress = useMemo(() => {
    // If there are parsed output currency params, use them
    if (parsedCurrencyState.outputCurrencyAddress) {
      const outputChainId = parsedCurrencyState.outputChainId ?? supportedChainId
      const resolvedAddress =
        parsedCurrencyState.outputCurrencyAddress !== NATIVE_CHAIN_ID &&
        parsedCurrencyState.outputCurrencyAddress !== 'ETH' &&
        !isAddress(parsedCurrencyState.outputCurrencyAddress)
          ? getTokenAddressBySymbol(outputChainId, parsedCurrencyState.outputCurrencyAddress) ??
            parsedCurrencyState.outputCurrencyAddress
          : parsedCurrencyState.outputCurrencyAddress

      // clear output if identical unless there's a supported outputChainId which means we're bridging
      if (initialInputCurrencyAddress === resolvedAddress && !outputChainIsSupported) {
        return undefined
      }
      return resolvedAddress
    }

    // Default to cUSD when no output currency is specified
    if (!hasCurrencyQueryParams) {
      // For Citrea Testnet, default to cUSD
      if (initialChainId === UniverseChainId.CitreaTestnet || initialChainId === UniverseChainId.Sepolia) {
        return '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0' // cUSD
      }
    }

    return undefined
  }, [
    initialInputCurrencyAddress,
    parsedCurrencyState.outputCurrencyAddress,
    parsedCurrencyState.outputChainId,
    outputChainIsSupported,
    hasCurrencyQueryParams,
    initialChainId,
    supportedChainId,
  ])

  const currencyFromInputHook = useCurrency({ address: initialInputCurrencyAddress, chainId: initialChainId })
  const currencyFromOutputHook = useCurrency({
    address: initialOutputCurrencyAddress,
    chainId: parsedCurrencyState.outputChainId ?? initialChainId,
  })

  const initialInputCurrency = useMemo(() => {
    if (currencyFromInputHook) {
      return currencyFromInputHook
    }
    if (initialInputCurrencyAddress && initialChainId) {
      // Handle NATIVE_CHAIN_ID or native symbol directly
      if (
        initialInputCurrencyAddress === NATIVE_CHAIN_ID ||
        ['btc', 'cbtc', 'native'].includes(initialInputCurrencyAddress.toLowerCase())
      ) {
        return nativeOnChain(initialChainId)
      }
      const address = isAddress(initialInputCurrencyAddress)
        ? initialInputCurrencyAddress
        : getTokenAddressBySymbol(initialChainId, initialInputCurrencyAddress)
      if (address) {
        return getCurrencyFromChainInfo(initialChainId, address)
      }
    }
    return undefined
  }, [currencyFromInputHook, initialInputCurrencyAddress, initialChainId])

  const initialOutputCurrency = useMemo(() => {
    if (currencyFromOutputHook) {
      return currencyFromOutputHook
    }
    const outputChainId = parsedCurrencyState.outputChainId ?? initialChainId
    if (initialOutputCurrencyAddress && outputChainId) {
      const address = isAddress(initialOutputCurrencyAddress)
        ? initialOutputCurrencyAddress
        : getTokenAddressBySymbol(outputChainId, initialOutputCurrencyAddress)
      if (address) {
        return getCurrencyFromChainInfo(outputChainId, address)
      }
    }
    return undefined
  }, [currencyFromOutputHook, initialOutputCurrencyAddress, parsedCurrencyState.outputChainId, initialChainId])
  const initialTypedValue = initialInputCurrency || initialOutputCurrency ? parsedCurrencyState.value : undefined
  const initialFieldUpper =
    parsedCurrencyState.field && typeof parsedCurrencyState.field === 'string'
      ? parsedCurrencyState.field.toUpperCase()
      : undefined
  const initialField =
    initialTypedValue && initialFieldUpper && initialFieldUpper in CurrencyField
      ? CurrencyField[initialFieldUpper as keyof typeof CurrencyField]
      : undefined

  return {
    initialInputCurrency,
    initialOutputCurrency,
    initialTypedValue,
    initialField,
    initialChainId,
    triggerConnect: !!parsedQs.connect,
  }
}
