import { Percent, TradeType } from '@juiceswapxyz/sdk-core'
import type {
  GatewayJusdQuoteResponse,
  SatsumaQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { GatewayJusdTrade, SatsumaTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  getJuiceSwapPriceImpact,
  parseJuiceSwapPriceImpact,
} from 'uniswap/src/features/transactions/swap/utils/juiceSwapPriceImpact'
import { USDC, WBTC } from 'uniswap/src/constants/tokens'

function buildSatsumaTrade(priceImpact: string | undefined): SatsumaTrade {
  const quote = {
    requestId: 'test',
    routing: 'SATSUMA',
    permitData: null,
    quote: {
      amount: '3003416087', // 3003.416087 USDC.e (6 decimals)
      quote: '1756651830', // 1756.651830 ctUSD
      priceImpact,
    },
  } as unknown as SatsumaQuoteResponse

  return new SatsumaTrade({ quote, currencyIn: USDC, currencyOut: WBTC, tradeType: TradeType.EXACT_INPUT })
}

function buildGatewayTrade(): GatewayJusdTrade {
  const quote = {
    requestId: 'test',
    routing: 'GATEWAY_JUSD',
    permitData: null,
    quote: {
      input: { amount: '3003416087' },
      output: { amount: '3003416087' },
      slippage: 0,
    },
  } as unknown as GatewayJusdQuoteResponse

  return new GatewayJusdTrade({ quote, currencyIn: USDC, currencyOut: WBTC, tradeType: TradeType.EXACT_INPUT })
}

describe('parseJuiceSwapPriceImpact', () => {
  it('parses a small percentage string into a Percent', () => {
    expect(parseJuiceSwapPriceImpact('0.05')?.equalTo(new Percent(5, 10_000))).toBe(true)
  })

  it('parses a catastrophic percentage string into a Percent', () => {
    expect(parseJuiceSwapPriceImpact('41.51')?.toFixed(2)).toBe('41.51')
  })

  it('accepts a numeric value', () => {
    expect(parseJuiceSwapPriceImpact(0.3)?.equalTo(new Percent(30, 10_000))).toBe(true)
  })

  it.each([undefined, '', 'not-a-number'])('returns undefined for invalid value %p', (value) => {
    expect(parseJuiceSwapPriceImpact(value)).toBeUndefined()
  })
})

describe('getJuiceSwapPriceImpact', () => {
  it('surfaces the API-reported impact for pool fallback (Satsuma) trades', () => {
    const trade = buildSatsumaTrade('41.51')
    expect(getJuiceSwapPriceImpact(trade)?.toFixed(2)).toBe('41.51')
    // Regression for #764: the impact must not be silently dropped.
    expect(trade.priceImpact).toBeDefined()
  })

  it('returns undefined for a Satsuma trade without an API impact value', () => {
    expect(getJuiceSwapPriceImpact(buildSatsumaTrade(undefined))).toBeUndefined()
  })

  it('returns undefined for Gateway/JUSD 1:1 conversions', () => {
    expect(getJuiceSwapPriceImpact(buildGatewayTrade())).toBeUndefined()
  })
})
