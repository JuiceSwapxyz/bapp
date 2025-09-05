vi.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: vi.fn(),
  getFeatureFlag: vi.fn(),
}))

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
})

// NewUserCTAButton component has been removed
describe('NewUserCTAButton', () => {
  it.skip('displays a button with call to action text and icons', () => {
    // Component no longer exists - test skipped
  })
})
