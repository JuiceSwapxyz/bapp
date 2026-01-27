import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { ChainId, QuoteRequest } from 'uniswap/src/data/tradingApi/__generated__'

export const isBitcoinBridgeQuote = (params: QuoteRequest): boolean => {
  const isOneSideCitrea = params.tokenOutChainId === ChainId._4114 || params.tokenInChainId === ChainId._4114
  const isOneSideBitcoin =
    params.tokenOutChainId === ChainId._21_000_000 || params.tokenInChainId === ChainId._21_000_000

  return isOneSideCitrea && isOneSideBitcoin
}

export const isLnBitcoinBridgeQuote = (params: QuoteRequest): boolean => {
  const isOneSideCitrea = params.tokenOutChainId === ChainId._4114 || params.tokenInChainId === ChainId._4114
  const isOneSideLightning =
    params.tokenOutChainId === ChainId._21_000_001 || params.tokenInChainId === ChainId._21_000_001

  return isOneSideCitrea && isOneSideLightning
}

export const isErc20ChainSwapQuote = (params: QuoteRequest): boolean => {
  const { tokenInChainId, tokenOutChainId, tokenIn, tokenOut } = params

  const isPolygonToCitrea = tokenInChainId === ChainId._137 && tokenOutChainId === ChainId._4114
  const isCitreaToPolygon = tokenInChainId === ChainId._4114 && tokenOutChainId === ChainId._137
  const isEthereumToCitrea = tokenInChainId === ChainId._1 && tokenOutChainId === ChainId._4114
  const isCitreaToEthereum = tokenInChainId === ChainId._4114 && tokenOutChainId === ChainId._1

  // eslint-disable-next-line curly
  if (!isPolygonToCitrea && !isCitreaToPolygon && !isEthereumToCitrea && !isCitreaToEthereum) return false

  const isInputNative = !tokenIn || tokenIn === ZERO_ADDRESS
  const isOutputNative = !tokenOut || tokenOut === ZERO_ADDRESS

  return !isInputNative && !isOutputNative
}

export enum Erc20ChainSwapDirection {
  PolygonToCitrea = 'PolygonToCitrea',
  CitreaToPolygon = 'CitreaToPolygon',
  EthereumToCitrea = 'EthereumToCitrea',
  CitreaToEthereum = 'CitreaToEthereum',
}
