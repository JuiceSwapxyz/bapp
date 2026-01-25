import { Currency, CurrencyAmount } from '@juiceswapxyz/sdk-core'
import { useQuery } from '@tanstack/react-query'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ChainPairsResponse, getLdsBridgeManager } from 'uniswap/src/features/lds-bridge'
import type {
  LightningBridgeReverseGetResponse,
  LightningBridgeSubmarineGetResponse,
} from 'uniswap/src/features/lds-bridge/lds-types/api'
import { CurrencyField } from 'uniswap/src/types/currency'

export interface BridgeLimits {
  min: CurrencyAmount<Currency>
  max: CurrencyAmount<Currency>
}

export interface BridgeLimitsInfo {
  [CurrencyField.INPUT]: BridgeLimits | undefined
  [CurrencyField.OUTPUT]: BridgeLimits | undefined
}

interface BridgeLimitsQueryParams {
  currencyIn: Currency | null | undefined
  currencyOut: Currency | null | undefined
}

const useChainBridge = (params?: { enabled: boolean }): ReturnType<typeof useQuery<ChainPairsResponse>> => {
  const ldsBridge = getLdsBridgeManager()
  return useQuery<ChainPairsResponse>({
    queryKey: ['chain-bridge'],
    queryFn: () => ldsBridge.getChainPairs(),
    enabled: params?.enabled,
  })
}

const useReverseBridge = (params?: {
  enabled: boolean
}): ReturnType<typeof useQuery<LightningBridgeReverseGetResponse>> => {
  const ldsBridge = getLdsBridgeManager()
  return useQuery<LightningBridgeReverseGetResponse>({
    queryKey: ['reverse-bridge'],
    queryFn: () => ldsBridge.getReversePairs(),
    enabled: params?.enabled,
  })
}

const useSubmarineBridge = (params?: {
  enabled: boolean
}): ReturnType<typeof useQuery<LightningBridgeSubmarineGetResponse>> => {
  const ldsBridge = getLdsBridgeManager()
  return useQuery<LightningBridgeSubmarineGetResponse>({
    queryKey: ['submarine-bridge'],
    queryFn: () => ldsBridge.getSubmarinePairs(),
    enabled: params?.enabled,
  })
}

const isChainBridge = ({ currencyIn, currencyOut }: BridgeLimitsQueryParams): boolean => {
  return currencyIn?.chainId === UniverseChainId.Bitcoin || currencyOut?.chainId === UniverseChainId.Bitcoin
}

const isSubmarineBridge = ({ currencyIn, currencyOut }: BridgeLimitsQueryParams): boolean => {
  return (
    currencyIn?.chainId === UniverseChainId.CitreaTestnet && currencyOut?.chainId === UniverseChainId.LightningNetwork
  )
}

const isReverseBridge = ({ currencyIn, currencyOut }: BridgeLimitsQueryParams): boolean => {
  return (
    currencyIn?.chainId === UniverseChainId.LightningNetwork && currencyOut?.chainId === UniverseChainId.CitreaTestnet
  )
}

const isErc20ChainBridge = ({ currencyIn, currencyOut }: BridgeLimitsQueryParams): boolean => {
  const isFromEthereumOrPolygon =
    currencyIn?.chainId === UniverseChainId.Mainnet || currencyIn?.chainId === UniverseChainId.Polygon
  const isToEthereumOrPolygon =
    currencyOut?.chainId === UniverseChainId.Mainnet || currencyOut?.chainId === UniverseChainId.Polygon
  const isFromCitrea = currencyIn?.chainId === UniverseChainId.CitreaTestnet
  const isToCitrea = currencyOut?.chainId === UniverseChainId.CitreaTestnet

  // Ethereum/Polygon → Citrea or Citrea → Ethereum/Polygon
  return (isFromEthereumOrPolygon && isToCitrea) || (isFromCitrea && isToEthereumOrPolygon)
}

const symbolMap = {
  lnBTC: 'BTC',
  cBTC: 'cBTC',
  BTC: 'BTC',
}

// Maps currency symbol + chainId to API symbol for ERC20 chain swaps
const getErc20ApiSymbol = (symbol: string | undefined, chainId: UniverseChainId | undefined): string | undefined => {
  if (!symbol || !chainId) {
    return undefined
  }

  if (symbol === 'USDT' && chainId === UniverseChainId.Mainnet) {
    return 'USDT_ETH'
  }
  if (symbol === 'USDT' && chainId === UniverseChainId.Polygon) {
    return 'USDT_POLYGON'
  }
  if (symbol === 'JUSD' && chainId === UniverseChainId.CitreaTestnet) {
    return 'JUSD_CITREA'
  }

  return undefined
}

const usePairInfo = (
  params: BridgeLimitsQueryParams,
): ChainPairsResponse | LightningBridgeReverseGetResponse | LightningBridgeSubmarineGetResponse | undefined => {
  const { data: chainPairs } = useChainBridge()
  const { data: reversePairs } = useReverseBridge()
  const { data: submarinePairs } = useSubmarineBridge()

  if (isReverseBridge(params)) {
    return reversePairs
  }

  if (isSubmarineBridge(params)) {
    return submarinePairs
  }

  if (isChainBridge(params)) {
    return chainPairs
  }

  if (isErc20ChainBridge(params)) {
    return chainPairs
  }

  return undefined
}

export function useBridgeLimits(params: BridgeLimitsQueryParams): BridgeLimitsInfo | undefined {
  const pairInfo = usePairInfo(params)
  const { currencyIn, currencyOut } = params

  if (!currencyIn || !currencyOut || !pairInfo) {
    return undefined
  }

  // Determine API symbols based on bridge type
  let symbolIn: string | undefined
  let symbolOut: string | undefined

  if (isErc20ChainBridge(params)) {
    symbolIn = getErc20ApiSymbol(currencyIn.symbol, currencyIn.chainId)
    symbolOut = getErc20ApiSymbol(currencyOut.symbol, currencyOut.chainId)
  } else {
    symbolIn = symbolMap[currencyIn.symbol as keyof typeof symbolMap]
    symbolOut = symbolMap[currencyOut.symbol as keyof typeof symbolMap]
  }

  if (!symbolIn || !symbolOut) {
    return undefined
  }

  const { limits } = pairInfo[symbolIn]?.[symbolOut] || {}
  if (!limits) {
    return undefined
  }
  const isInputSide = currencyIn.chainId !== UniverseChainId.CitreaTestnet
  const nonEvmCurrency = currencyIn.chainId !== UniverseChainId.CitreaTestnet ? currencyIn : currencyOut

  const { minimal, maximal } = limits

  const bridgeLimits: BridgeLimits = {
    min: CurrencyAmount.fromRawAmount(nonEvmCurrency, minimal),
    max: CurrencyAmount.fromRawAmount(nonEvmCurrency, maximal),
  }

  return {
    [CurrencyField.INPUT]: isInputSide ? bridgeLimits : undefined,
    [CurrencyField.OUTPUT]: isInputSide ? undefined : bridgeLimits,
  }
}
