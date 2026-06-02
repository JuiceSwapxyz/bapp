import {
  JUICESWAP_DEFAULT_SLIPPAGE,
  resolveJuiceSwapSlippageTolerance,
} from 'uniswap/src/features/transactions/swap/constants/juiceSwapSlippage'

describe('resolveJuiceSwapSlippageTolerance', () => {
  it('submits the shared default when the user has no custom tolerance (#764 AC4)', () => {
    // This is the value the Satsuma/Gateway builders send to /v1/swap.
    expect(resolveJuiceSwapSlippageTolerance(undefined)).toBe('5')
    expect(resolveJuiceSwapSlippageTolerance(undefined)).toBe(JUICESWAP_DEFAULT_SLIPPAGE.toString())
  })

  it('respects a user-provided custom tolerance', () => {
    expect(resolveJuiceSwapSlippageTolerance(2.5)).toBe('2.5')
  })

  it('keeps the submitted default in sync with the displayed default', () => {
    // The "Max slippage" display uses the numeric JUICESWAP_DEFAULT_SLIPPAGE,
    // the builders use its string form — they must never diverge (#764 AC4).
    expect(JUICESWAP_DEFAULT_SLIPPAGE).toBe(5)
    expect(resolveJuiceSwapSlippageTolerance(undefined)).toBe(String(JUICESWAP_DEFAULT_SLIPPAGE))
  })
})
