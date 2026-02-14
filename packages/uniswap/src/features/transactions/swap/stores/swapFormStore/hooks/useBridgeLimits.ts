import { parseUnits } from '@ethersproject/units'
import { Currency, CurrencyAmount } from '@juiceswapxyz/sdk-core'
import { useQuery } from '@tanstack/react-query'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fetchLdsOnChainBalance } from 'uniswap/src/features/lds-bridge/api/ldsOnChainBalance'
import {
  ChainPairsResponse,
  fetchBoltzBalance,
  getBoltzBalanceForSide,
  getLdsBridgeManager,
} from 'uniswap/src/features/lds-bridge'
import { calculateEffectiveBridgeMax } from 'uniswap/src/features/lds-bridge/utils/limits'
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

const isCitreaChainId = (chainId: UniverseChainId | undefined): boolean => {
  return chainId === UniverseChainId.CitreaMainnet || chainId === UniverseChainId.CitreaTestnet
}

const isSubmarineBridge = ({ currencyIn, currencyOut }: BridgeLimitsQueryParams): boolean => {
  return isCitreaChainId(currencyIn?.chainId) && currencyOut?.chainId === UniverseChainId.LightningNetwork
}

const isReverseBridge = ({ currencyIn, currencyOut }: BridgeLimitsQueryParams): boolean => {
  return currencyIn?.chainId === UniverseChainId.LightningNetwork && isCitreaChainId(currencyOut?.chainId)
}

const isErc20ChainBridge = ({ currencyIn, currencyOut }: BridgeLimitsQueryParams): boolean => {
  const isFromEthereumOrPolygon =
    currencyIn?.chainId === UniverseChainId.Mainnet || currencyIn?.chainId === UniverseChainId.Polygon
  const isToEthereumOrPolygon =
    currencyOut?.chainId === UniverseChainId.Mainnet || currencyOut?.chainId === UniverseChainId.Polygon
  const isFromCitrea = isCitreaChainId(currencyIn?.chainId)
  const isToCitrea = isCitreaChainId(currencyOut?.chainId)

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
  if (symbol === 'USDC' && chainId === UniverseChainId.Mainnet) {
    return 'USDC_ETH'
  }
  if (symbol === 'JUSD' && isCitreaChainId(chainId)) {
    return 'JUSD_CITREA'
  }
  if (symbol === 'WBTC' && chainId === UniverseChainId.Mainnet) {
    return 'WBTC_ETH'
  }
  if (symbol === 'cBTC' && isCitreaChainId(chainId)) {
    return 'cBTC'
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

  const { data: boltzBalance } = useQuery({
    queryKey: ['boltz-balance'],
    queryFn: fetchBoltzBalance,
    enabled: !!currencyIn && !!currencyOut && !!pairInfo,
  })

  const { data: onChainIn } = useQuery({
    queryKey: ['lds-onchain-balance', currencyIn?.chainId, currencyIn?.symbol],
    queryFn: () => fetchLdsOnChainBalance(currencyIn!.chainId, currencyIn!.symbol ?? ''),
    enabled: !!currencyIn?.chainId && !!currencyIn?.symbol && !!pairInfo,
  })

  const { data: onChainOut } = useQuery({
    queryKey: ['lds-onchain-balance', currencyOut?.chainId, currencyOut?.symbol],
    queryFn: () => fetchLdsOnChainBalance(currencyOut!.chainId, currencyOut!.symbol ?? ''),
    enabled: !!currencyOut?.chainId && !!currencyOut?.symbol && !!pairInfo,
  })

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

  if (isErc20ChainBridge(params)) {
    const pairData = pairInfo[symbolIn]?.[symbolOut]
    if (!pairData?.limits) return undefined

    const { minimal, maximal } = pairData.limits

    const balanceOutBoltz = boltzBalance
      ? getBoltzBalanceForSide(boltzBalance, { chainId: currencyOut.chainId, symbol: currencyOut.symbol ?? '' })
      : undefined
    const effectiveBalanceOut =
      balanceOutBoltz !== undefined
        ? onChainOut !== undefined
          ? Math.min(balanceOutBoltz, onChainOut)
          : balanceOutBoltz
        : undefined

    if (effectiveBalanceOut === undefined) return undefined

    const effectiveMax = Math.min(maximal, effectiveBalanceOut)
    const decimalsIn = currencyIn.decimals
    const maxInput = parseFloat((effectiveMax / 1e8).toFixed(2))
    const minInput = parseFloat((minimal / 1e8).toFixed(2))
    const minRaw = parseUnits(minInput.toString(), decimalsIn).toString()
    const maxRaw = parseUnits(maxInput.toString(), decimalsIn).toString()

    return {
      [CurrencyField.INPUT]: {
        min: CurrencyAmount.fromRawAmount(currencyIn, minRaw),
        max: CurrencyAmount.fromRawAmount(currencyIn, maxRaw),
      },
      [CurrencyField.OUTPUT]: undefined,
    }
  }

  const { limits } = pairInfo[symbolIn]?.[symbolOut] || {}
  if (!limits) return undefined

  const isInputSide = !isCitreaChainId(currencyIn.chainId)
  const limitsCurrency = isInputSide ? currencyIn : currencyOut

  const { minimal, maximal } = limits
  const feeBuffer = isInputSide ? 1 : 1.02
  const adjustedMinimal = Math.floor(minimal * feeBuffer)

  const balanceInBoltz = boltzBalance
    ? getBoltzBalanceForSide(boltzBalance, { chainId: currencyIn.chainId, symbol: currencyIn.symbol ?? '' })
    : undefined
  const balanceOutBoltz = boltzBalance
    ? getBoltzBalanceForSide(boltzBalance, { chainId: currencyOut.chainId, symbol: currencyOut.symbol ?? '' })
    : undefined

  const effectiveBalanceIn =
    balanceInBoltz !== undefined
      ? onChainIn !== undefined
        ? Math.min(balanceInBoltz, onChainIn)
        : balanceInBoltz
      : undefined
  const effectiveBalanceOut =
    balanceOutBoltz !== undefined
      ? onChainOut !== undefined
        ? Math.min(balanceOutBoltz, onChainOut)
        : balanceOutBoltz
      : undefined

  const rawIn = effectiveBalanceIn !== undefined ? Math.floor(effectiveBalanceIn) : undefined
  const rawOut = effectiveBalanceOut !== undefined ? Math.floor(effectiveBalanceOut) : undefined
  const effectiveMax = calculateEffectiveBridgeMax(maximal, rawIn, rawOut)

  const decimals = limitsCurrency.decimals
  const minRaw = parseUnits((adjustedMinimal / 1e8).toFixed(decimals), decimals).toString()
  const maxRaw = BigInt(Math.floor((effectiveMax / 1e8) * 10 ** decimals)).toString()

  const bridgeLimits: BridgeLimits = {
    min: CurrencyAmount.fromRawAmount(limitsCurrency, minRaw),
    max: CurrencyAmount.fromRawAmount(limitsCurrency, maxRaw),
  }

  return {
    [CurrencyField.INPUT]: bridgeLimits,
    [CurrencyField.OUTPUT]: undefined,
  }
}
