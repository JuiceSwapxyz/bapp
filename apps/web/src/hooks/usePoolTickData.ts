import { Currency, V3_CORE_FACTORY_ADDRESSES } from '@juiceswapxyz/sdk-core'
import { FeeAmount, TICK_SPACINGS, Pool as V3Pool, tickToPrice as tickToPriceV3 } from '@juiceswapxyz/v3-sdk'
import { Pool as V4Pool, tickToPrice as tickToPriceV4 } from '@juiceswapxyz/v4-sdk'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Ticks } from 'appGraphql/data/AllV3TicksQuery'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { PositionField } from 'types/position'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { usePoolTicks } from 'uniswap/src/data/apiClients/tradingApi/usePoolTicks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import computeSurroundingTicks, { TickProcessed } from 'utils/computeSurroundingTicks'

const PRICE_FIXED_DIGITS = 8

function getActiveTick({
  tickCurrent,
  feeAmount,
  tickSpacing,
}: {
  tickCurrent?: number
  feeAmount?: FeeAmount
  tickSpacing?: number
}): number | undefined {
  return tickCurrent != null && feeAmount !== undefined && tickSpacing
    ? Math.floor(tickCurrent / tickSpacing) * tickSpacing
    : undefined
}

export function usePoolActiveLiquidity({
  sdkCurrencies,
  feeAmount,
  chainId,
  version,
  tickSpacing,
  hooks,
  poolId,
  skip,
}: {
  poolId?: string
  sdkCurrencies: { [field in PositionField]: Maybe<Currency> }
  feeAmount?: number
  version: ProtocolVersion
  chainId?: UniverseChainId
  tickSpacing?: number
  hooks?: string
  skip?: boolean
}): {
  isLoading: boolean
  error: any
  currentTick?: number
  activeTick?: number
  liquidity?: JSBI
  sqrtPriceX96?: JSBI
  data?: TickProcessed[]
} {
  const multichainContext = useMultichainContext()
  const defaultChainId = multichainContext.chainId ?? UniverseChainId.Mainnet
  const effectiveChainId = chainId ?? defaultChainId

  // Compute pool address for the REST call
  const poolAddress = useMemo(() => {
    if (poolId) {
      return poolId
    }
    const { TOKEN0, TOKEN1 } = sdkCurrencies
    if (TOKEN0 && TOKEN1 && feeAmount && version === ProtocolVersion.V3) {
      return V3Pool.getAddress(
        TOKEN0.wrapped,
        TOKEN1.wrapped,
        feeAmount,
        undefined,
        V3_CORE_FACTORY_ADDRESSES[effectiveChainId],
      )
    }
    if (version === ProtocolVersion.V4 && TOKEN0 && TOKEN1 && feeAmount && tickSpacing && hooks) {
      return V4Pool.getPoolId(TOKEN0, TOKEN1, feeAmount, tickSpacing, hooks)
    }
    return undefined
  }, [poolId, sdkCurrencies, feeAmount, version, effectiveChainId, tickSpacing, hooks])

  // Fetch tick data + pool state from REST endpoint
  const {
    data: ticksData,
    isLoading: ticksLoading,
    error: ticksError,
  } = usePoolTicks({
    address: skip ? null : poolAddress,
    chainId: skip ? null : effectiveChainId,
  })

  // Extract pool state from REST response
  const currentTick = ticksData?.pool.tick
  const poolLiquidity = ticksData?.pool.liquidity
  const poolSqrtPriceX96 = ticksData?.pool.sqrtPriceX96
  const restTickSpacing = ticksData?.pool.tickSpacing

  const tickSpacingWithFallback =
    tickSpacing ?? restTickSpacing ?? (feeAmount ? TICK_SPACINGS[feeAmount as FeeAmount] : undefined)

  // Map REST ticks to the Ticks type expected by computeSurroundingTicks
  const ticks: Ticks | undefined = useMemo(() => {
    if (!ticksData?.ticks || ticksData.ticks.length === 0) {
      return undefined
    }
    return ticksData.ticks.map((t: { tick: number; liquidityNet: string }) => ({
      tick: t.tick,
      liquidityNet: t.liquidityNet,
      price0: undefined,
      price1: undefined,
    }))
  }, [ticksData?.ticks])

  const activeTick = useMemo(
    () =>
      getActiveTick({
        tickCurrent: currentTick,
        feeAmount,
        tickSpacing: tickSpacingWithFallback,
      }),
    [currentTick, feeAmount, tickSpacingWithFallback],
  )

  return useMemo(() => {
    const token0 = sdkCurrencies.TOKEN0
    const token1 = sdkCurrencies.TOKEN1

    if (
      !token0 ||
      !token1 ||
      activeTick === undefined ||
      !poolLiquidity ||
      !ticks ||
      ticks.length === 0 ||
      ticksLoading
    ) {
      return {
        isLoading: ticksLoading,
        error: ticksError,
        activeTick,
        data: undefined,
      }
    }

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot =
      ticks.findIndex((tickData: { tick?: number }) => tickData.tick != null && tickData.tick > activeTick) - 1

    if (pivot < 0) {
      logger.debug('usePoolTickData', 'usePoolActiveLiquidity', 'TickData pivot not found', {
        token0: token0.isToken ? token0.address : ZERO_ADDRESS,
        token1: token1.isToken ? token1.address : ZERO_ADDRESS,
        chainId: token0.chainId,
      })
      return {
        isLoading: ticksLoading,
        error: ticksError,
        activeTick,
        data: undefined,
      }
    }

    let sdkPrice
    try {
      sdkPrice =
        version === ProtocolVersion.V3
          ? tickToPriceV3(token0.wrapped, token1.wrapped, activeTick)
          : tickToPriceV4(token0, token1, activeTick)
    } catch (e) {
      logger.debug('usePoolTickData', 'usePoolActiveLiquidity', 'Error getting price', {
        error: e,
        token0: token0.isToken ? token0.address : ZERO_ADDRESS,
        token1: token1.isToken ? token1.address : ZERO_ADDRESS,
        chainId: token0.chainId,
      })

      return {
        isLoading: ticksLoading,
        error: ticksError,
        activeTick,
        data: undefined,
      }
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: JSBI.BigInt(poolLiquidity),
      tick: activeTick,
      liquidityNet:
        Number(ticks[pivot]?.tick) === activeTick ? JSBI.BigInt(ticks[pivot]?.liquidityNet ?? 0) : JSBI.BigInt(0),
      price0: sdkPrice.toFixed(PRICE_FIXED_DIGITS),
      sdkPrice,
    }

    const subsequentTicks = computeSurroundingTicks({
      token0,
      token1,
      activeTickProcessed,
      sortedTickData: ticks,
      pivot,
      ascending: true,
      version,
    })

    const previousTicks = computeSurroundingTicks({
      token0,
      token1,
      activeTickProcessed,
      sortedTickData: ticks,
      pivot,
      ascending: false,
      version,
    })

    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    return {
      isLoading: ticksLoading,
      error: ticksError,
      currentTick,
      activeTick,
      liquidity: JSBI.BigInt(poolLiquidity),
      sqrtPriceX96: JSBI.BigInt(poolSqrtPriceX96 ?? 0),
      data: ticksProcessed,
    }
  }, [
    sdkCurrencies,
    activeTick,
    poolLiquidity,
    poolSqrtPriceX96,
    ticks,
    ticksLoading,
    version,
    ticksError,
    currentTick,
  ])
}
