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
