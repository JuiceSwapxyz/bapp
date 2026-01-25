import { renderHook } from '@testing-library/react'
import { useNativeTokenPercentageBufferExperiment } from 'components/Liquidity/Create/hooks/useNativeTokenPercentageBufferExperiment'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useExperimentValue } from 'uniswap/src/features/gating/hooks'
import { vi } from 'vitest'

vi.mock('uniswap/src/features/gating/hooks', async (importOriginal) => ({
  ...(await importOriginal()),
  useExperimentValue: vi.fn(),
}))

const useExperimentValueMock = vi.mocked(useExperimentValue)

describe('useNativeTokenPercentageBufferExperiment', () => {
  const defaultBufferSize = 1

  beforeEach(() => {
    vi.clearAllMocks()
    useExperimentValueMock.mockReturnValue(defaultBufferSize)
  })

  it('returns 0 for CitreaTestnet (cheap gas chain)', () => {
    const { result } = renderHook(() => useNativeTokenPercentageBufferExperiment(UniverseChainId.CitreaTestnet))
    expect(result.current).toBe(0)
  })

  it('returns experiment value for Ethereum Mainnet', () => {
    const { result } = renderHook(() => useNativeTokenPercentageBufferExperiment(UniverseChainId.Mainnet))
    expect(result.current).toBe(defaultBufferSize)
  })

  it('returns experiment value for Polygon', () => {
    const { result } = renderHook(() => useNativeTokenPercentageBufferExperiment(UniverseChainId.Polygon))
    expect(result.current).toBe(defaultBufferSize)
  })

  it('returns experiment value when chainId is undefined', () => {
    const { result } = renderHook(() => useNativeTokenPercentageBufferExperiment(undefined))
    expect(result.current).toBe(defaultBufferSize)
  })

  it('returns experiment value when called without arguments', () => {
    const { result } = renderHook(() => useNativeTokenPercentageBufferExperiment())
    expect(result.current).toBe(defaultBufferSize)
  })

  it('respects custom experiment value for non-excluded chains', () => {
    const customBufferSize = 5
    useExperimentValueMock.mockReturnValue(customBufferSize)

    const { result } = renderHook(() => useNativeTokenPercentageBufferExperiment(UniverseChainId.Mainnet))
    expect(result.current).toBe(customBufferSize)
  })

  it('ignores experiment value for CitreaTestnet (always returns 0)', () => {
    const customBufferSize = 5
    useExperimentValueMock.mockReturnValue(customBufferSize)

    const { result } = renderHook(() => useNativeTokenPercentageBufferExperiment(UniverseChainId.CitreaTestnet))
    expect(result.current).toBe(0)
  })
})
