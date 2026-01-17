import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { ChainId, QuoteRequest } from 'uniswap/src/data/tradingApi/__generated__'

export const isBitcoinBridgeQuote = (params: QuoteRequest): boolean => {
  const isOneSideCitrea = params.tokenOutChainId === ChainId._5115 || params.tokenInChainId === ChainId._5115
  const isOneSideBitcoin =
    params.tokenOutChainId === ChainId._21_000_000 || params.tokenInChainId === ChainId._21_000_000

  return isOneSideCitrea && isOneSideBitcoin
}

export const isLnBitcoinBridgeQuote = (params: QuoteRequest): boolean => {
  const isOneSideCitrea = params.tokenOutChainId === ChainId._5115 || params.tokenInChainId === ChainId._5115
  const isOneSideLightning =
    params.tokenOutChainId === ChainId._21_000_001 || params.tokenInChainId === ChainId._21_000_001

  return isOneSideCitrea && isOneSideLightning
}

export const isErc20ChainSwapQuote = (params: QuoteRequest): boolean => {
  const { tokenInChainId, tokenOutChainId, tokenIn, tokenOut } = params

  // Polygon (137) ↔ Citrea (5115)
  const isPolygonToCitrea = tokenInChainId === ChainId._137 && tokenOutChainId === ChainId._5115
  const isCitreaToPolygon = tokenInChainId === ChainId._5115 && tokenOutChainId === ChainId._137

  if (!isPolygonToCitrea && !isCitreaToPolygon) return false

  // Both must be ERC20 (not native)
  const isInputNative = !tokenIn || tokenIn === ZERO_ADDRESS
  const isOutputNative = !tokenOut || tokenOut === ZERO_ADDRESS

  return !isInputNative && !isOutputNative
}

export enum Erc20ChainSwapDirection {
  PolygonToCitrea = 'PolygonToCitrea',
  CitreaToPolygon = 'CitreaToPolygon',
}
