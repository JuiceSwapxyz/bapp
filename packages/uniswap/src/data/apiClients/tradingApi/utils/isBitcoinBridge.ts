import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { ChainId, QuoteRequest } from 'uniswap/src/data/tradingApi/__generated__'

// Citrea chain IDs (Mainnet and Testnet)
const CITREA_CHAIN_IDS = [ChainId._4114, ChainId._5115]

// WBTC address on Ethereum Mainnet
export const WBTC_ETHEREUM_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
const WBTC_ETHEREUM_ADDRESS_LOWER = WBTC_ETHEREUM_ADDRESS.toLowerCase()

export const isCitreaChainId = (chainId: ChainId | undefined): boolean => {
  return chainId !== undefined && CITREA_CHAIN_IDS.includes(chainId)
}

export const isBitcoinBridgeQuote = (params: QuoteRequest): boolean => {
  const isOneSideCitrea = isCitreaChainId(params.tokenOutChainId) || isCitreaChainId(params.tokenInChainId)
  const isOneSideBitcoin =
    params.tokenOutChainId === ChainId._21_000_000 || params.tokenInChainId === ChainId._21_000_000

  return isOneSideCitrea && isOneSideBitcoin
}

export const isLnBitcoinBridgeQuote = (params: QuoteRequest): boolean => {
  const isOneSideCitrea = isCitreaChainId(params.tokenOutChainId) || isCitreaChainId(params.tokenInChainId)
  const isOneSideLightning =
    params.tokenOutChainId === ChainId._21_000_001 || params.tokenInChainId === ChainId._21_000_001

  return isOneSideCitrea && isOneSideLightning
}

export const isErc20ChainSwapQuote = (params: QuoteRequest): boolean => {
  const { tokenInChainId, tokenOutChainId, tokenIn, tokenOut } = params

  // Support both Citrea Mainnet (4114) and Testnet (5115)
  const isPolygonToCitrea = tokenInChainId === ChainId._137 && isCitreaChainId(tokenOutChainId)
  const isCitreaToPolygon = isCitreaChainId(tokenInChainId) && tokenOutChainId === ChainId._137
  const isEthereumToCitrea = tokenInChainId === ChainId._1 && isCitreaChainId(tokenOutChainId)
  const isCitreaToEthereum = isCitreaChainId(tokenInChainId) && tokenOutChainId === ChainId._1

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

export enum WbtcBridgeDirection {
  EthereumToCitrea = 'WbtcEthereumToCitrea',
  CitreaToEthereum = 'WbtcCitreaToEthereum',
}

/**
 * Checks if the quote request is a WBTC bridge swap between Ethereum and Citrea.
 * WBTC (ERC20 on Ethereum) <-> cBTC (native on Citrea)
 */
export const isWbtcBridgeQuote = (params: QuoteRequest): boolean => {
  const { tokenInChainId, tokenOutChainId, tokenIn, tokenOut } = params

  // WBTC (Ethereum) -> cBTC (Citrea native)
  const isWbtcToCbtc =
    tokenInChainId === ChainId._1 &&
    isCitreaChainId(tokenOutChainId) &&
    tokenIn?.toLowerCase() === WBTC_ETHEREUM_ADDRESS_LOWER &&
    (!tokenOut || tokenOut === ZERO_ADDRESS)

  // cBTC (Citrea native) -> WBTC (Ethereum)
  const isCbtcToWbtc =
    isCitreaChainId(tokenInChainId) &&
    tokenOutChainId === ChainId._1 &&
    (!tokenIn || tokenIn === ZERO_ADDRESS) &&
    tokenOut?.toLowerCase() === WBTC_ETHEREUM_ADDRESS_LOWER

  return isWbtcToCbtc || isCbtcToWbtc
}
