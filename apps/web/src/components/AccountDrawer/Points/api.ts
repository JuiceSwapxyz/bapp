import {
  MIN_LIQUIDITY_USD,
  POINTS_PER_LIQUIDITY_DAY,
  POINTS_PER_SWAP,
} from 'components/AccountDrawer/Points/constants'
import { PointsBreakdown } from 'components/AccountDrawer/Points/types'
import {
  LEADERBOARD_MAX_ENTRIES,
  LeaderboardData,
  LeaderboardEntry,
} from 'components/AccountDrawer/Points/usePointsLeaderboard'

/**
 * Backend contract for the points service.
 *
 * The frontend treats whatever the API returns as the source of truth and never
 * computes points itself. The API (running against the JuiceSwapxyz/ponder
 * indexer) is responsible for enforcing all anti-exploit rules:
 *
 *   - Only count Swap events emitted by the official JuiceSwap V2/V3 routers
 *     (router-address whitelist). Custom contracts emitting fake `Swap` events
 *     must not be counted.
 *   - Only count finalized blocks (Citrea finality lag, e.g. `latest - 64`).
 *     Reverted/uncled txs do not emit logs and therefore cannot be claimed.
 *   - Apply a minimum USD-notional per swap (e.g. ≥ $1 at swap time).
 *   - Cap points per address per 24h window to prevent micro-swap farming.
 *   - For LP points: time-weighted minimum balance ≥ MIN_LIQUIDITY_USD across
 *     a continuous 24h window in *whitelisted* JuiceSwap pools (cBTC/cUSD/JUSD).
 *   - Detect and exclude wash-trading patterns (same EOA via different routers,
 *     A→B→A round-trips, etc.).
 *
 * Expected endpoints (ponder service):
 *   GET {BASE}/points/{address}      -> PointsApiResponse
 *   GET {BASE}/points/leaderboard    -> LeaderboardApiResponse
 *
 * BASE is read from REACT_APP_PONDER_JUICESWAP_URL.
 * Toggle with REACT_APP_JUICE_POINTS_API_ENABLED=true (defaults to mock).
 *
 * Until the backend ships these endpoints the fetchers fall back to a deterministic
 * mock (see `mockPoints` / `mockLeaderboard`) so the UI is fully functional during
 * development.
 */

interface PointsApiResponse {
  total: number
  swaps: { count: number; points: number }
  liquidity: {
    days: number
    points: number
    currentUsdValue: number
    meetsMinimum: boolean
  }
}

interface LeaderboardApiResponse {
  entries: Array<{ rank: number; address: string; points: number }>
  updatedAt: number
}

const POINTS_API_BASE = process.env.REACT_APP_PONDER_JUICESWAP_URL || ''
const POINTS_API_ENABLED = process.env.REACT_APP_JUICE_POINTS_API_ENABLED === 'true'
const REQUEST_TIMEOUT_MS = 5_000

async function safeFetch<T>(url: string): Promise<T | undefined> {
  if (!POINTS_API_ENABLED || !POINTS_API_BASE) {
    return undefined
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      return undefined
    }
    return (await res.json()) as T
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

function pseudoRandomFromAddress(address: string, max: number): number {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % max
}

function mockPoints(address: string): PointsBreakdown {
  const swapCount = pseudoRandomFromAddress(address, 25)
  const liquidityDays = pseudoRandomFromAddress(address.split('').reverse().join(''), 14)
  const currentUsdValue = liquidityDays > 0 ? 50 + (liquidityDays % 100) : 0
  const swapPoints = swapCount * POINTS_PER_SWAP
  const liquidityPoints = liquidityDays * POINTS_PER_LIQUIDITY_DAY
  return {
    total: swapPoints + liquidityPoints,
    swaps: { count: swapCount, points: swapPoints },
    liquidity: {
      days: liquidityDays,
      points: liquidityPoints,
      currentUsdValue,
      meetsMinimum: currentUsdValue >= MIN_LIQUIDITY_USD,
    },
  }
}

function generateMockAddress(seed: number): string {
  const hex = '0123456789abcdef'
  let a = (seed * 2654435761) >>> 0
  let b = ((seed + 1) * 1597334677) >>> 0
  let out = '0x'
  for (let i = 0; i < 40; i++) {
    a = (a + 0x9e3779b9) >>> 0
    a ^= a << 13
    a ^= a >>> 17
    a ^= a << 5
    b = (b ^ a) >>> 0
    out += hex[b & 0xf]
  }
  return out
}

function mockLeaderboard(): LeaderboardData {
  const raw = Array.from({ length: LEADERBOARD_MAX_ENTRIES }, (_, i) => ({
    address: generateMockAddress(i + 1),
    points: Math.max(50, 12000 - i * 110 - (i % 5) * 35),
  }))
  raw.sort((a, b) => b.points - a.points)
  const entries: LeaderboardEntry[] = raw.map((entry, i) => ({
    rank: i + 1,
    address: entry.address,
    points: entry.points,
  }))
  return { entries, total: entries.length, updatedAt: Date.now() }
}

export async function fetchPointsForAddress(address: string): Promise<PointsBreakdown> {
  const apiResponse = await safeFetch<PointsApiResponse>(
    `${POINTS_API_BASE}/points/${address.toLowerCase()}`,
  )
  if (apiResponse) {
    return apiResponse
  }
  return mockPoints(address)
}

export async function fetchLeaderboard(): Promise<LeaderboardData> {
  const apiResponse = await safeFetch<LeaderboardApiResponse>(
    `${POINTS_API_BASE}/points/leaderboard`,
  )
  if (apiResponse) {
    return {
      entries: apiResponse.entries,
      total: apiResponse.entries.length,
      updatedAt: apiResponse.updatedAt,
    }
  }
  return mockLeaderboard()
}
