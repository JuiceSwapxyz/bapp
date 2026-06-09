import { fetchPointsForAddress } from 'components/AccountDrawer/Points/api'

const ADDRESS = '0x1111111111111111111111111111111111111111'

/**
 * The header points ticker and points UI must reflect the wallet's real points
 * from the ponder API — never a fabricated mock. On API failure we show zeros,
 * not pseudo-random numbers (which previously surfaced as a bogus ~1,400).
 */
describe('fetchPointsForAddress — real-API points', () => {
  const realFetch = global.fetch

  afterEach(() => {
    global.fetch = realFetch
    vi.restoreAllMocks()
  })

  it('returns the real total reported by the ponder API', async () => {
    const body = {
      total: 4242,
      swaps: { count: 3, points: 300 },
      liquidity: { days: 1, points: 50, currentUsdValue: 80, meetsMinimum: true },
    }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => body }) as unknown as typeof fetch

    const result = await fetchPointsForAddress(ADDRESS)
    expect(result.total).toBe(4242)
  })

  it('returns zeros (never a fabricated mock) when the API is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch

    const result = await fetchPointsForAddress(ADDRESS)
    expect(result.total).toBe(0)
    expect(result.swaps.count).toBe(0)
    expect(result.liquidity.points).toBe(0)
  })
})
