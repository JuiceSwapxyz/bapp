import { act, renderHook } from '@testing-library/react-hooks'
import { useCompensationClaim } from 'components/CompensationClaim/useCompensationClaim'
import { useAccount } from 'hooks/useAccount'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { COMPENSATION_CLAIM_CHAIN_ID } from 'components/CompensationClaim/constants'

vi.mock('hooks/useAccount', () => ({
  useAccount: vi.fn(),
}))

vi.mock('wagmi', async () => {
  const wagmi = await vi.importActual('wagmi')
  return {
    ...wagmi,
    useReadContract: vi.fn(),
    useWriteContract: vi.fn(),
    useWaitForTransactionReceipt: vi.fn(),
  }
})

// Mock the logger to prevent console errors
vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

// Address that exists in merkle-proofs.json
const ELIGIBLE_ADDRESS = '0x01fa0053a24c799ecf6183e194b9befe591b6dde'
// Random address that doesn't exist in merkle tree
const NON_ELIGIBLE_ADDRESS = '0x1234567890123456789012345678901234567890'

const mockWriteContract = vi.fn()

function setupMocks({
  address,
  chainId = COMPENSATION_CLAIM_CHAIN_ID,
  isConnected = true,
  hasClaimed = false,
  claimDeadline = BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day from now
}: {
  address?: string
  chainId?: UniverseChainId
  isConnected?: boolean
  hasClaimed?: boolean
  claimDeadline?: bigint
}) {
  vi.mocked(useAccount).mockReturnValue({
    address: address as `0x${string}` | undefined,
    chainId,
    isConnected,
    isConnecting: false,
    isDisconnected: !isConnected,
    isReconnecting: false,
    status: isConnected ? 'connected' : 'disconnected',
    addresses: address ? [address as `0x${string}`] : undefined,
    chain: undefined,
    connector: undefined,
  } as unknown as ReturnType<typeof useAccount>)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useReadContract).mockImplementation((config: any) => {
    if (config?.functionName === 'hasClaimed') {
      return { data: hasClaimed, isLoading: false } as ReturnType<typeof useReadContract>
    }
    if (config?.functionName === 'claimDeadline') {
      return { data: claimDeadline } as ReturnType<typeof useReadContract>
    }
    return { data: undefined, isLoading: false } as ReturnType<typeof useReadContract>
  })

  vi.mocked(useWriteContract).mockReturnValue({
    writeContract: mockWriteContract,
    data: undefined,
    isPending: false,
    error: null,
    reset: vi.fn(),
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isIdle: true,
    isPaused: false,
    isSuccess: false,
    status: 'idle',
    submittedAt: 0,
    variables: undefined,
    writeContractAsync: vi.fn(),
  } as unknown as ReturnType<typeof useWriteContract>)

  vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
    isLoading: false,
    isSuccess: false,
  } as ReturnType<typeof useWaitForTransactionReceipt>)
}

describe('useCompensationClaim', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns isEligible: false when user address is not in merkle tree', () => {
    setupMocks({ address: NON_ELIGIBLE_ADDRESS })

    const { result } = renderHook(() => useCompensationClaim())

    expect(result.current.isEligible).toBe(false)
    expect(result.current.canClaim).toBe(false)
  })

  it('returns isEligible: true when user address is in merkle tree', () => {
    setupMocks({ address: ELIGIBLE_ADDRESS })

    const { result } = renderHook(() => useCompensationClaim())

    expect(result.current.isEligible).toBe(true)
  })

  it('returns canClaim: false when user has already claimed', () => {
    setupMocks({ address: ELIGIBLE_ADDRESS, hasClaimed: true })

    const { result } = renderHook(() => useCompensationClaim())

    expect(result.current.isEligible).toBe(true)
    expect(result.current.hasClaimed).toBe(true)
    expect(result.current.canClaim).toBe(false)
  })

  it('returns canClaim: false when deadline has passed', () => {
    const pastDeadline = BigInt(Math.floor(Date.now() / 1000) - 86400) // 1 day ago
    setupMocks({ address: ELIGIBLE_ADDRESS, claimDeadline: pastDeadline })

    const { result } = renderHook(() => useCompensationClaim())

    expect(result.current.isEligible).toBe(true)
    expect(result.current.isDeadlinePassed).toBe(true)
    expect(result.current.canClaim).toBe(false)
  })

  it('returns canClaim: false when on wrong network', () => {
    // Use a different chain ID than COMPENSATION_CLAIM_CHAIN_ID
    const wrongChainId = UniverseChainId.Mainnet
    setupMocks({ address: ELIGIBLE_ADDRESS, chainId: wrongChainId })

    const { result } = renderHook(() => useCompensationClaim())

    expect(result.current.isEligible).toBe(true)
    expect(result.current.isWrongNetwork).toBe(true)
    expect(result.current.canClaim).toBe(false)
  })

  it('returns canClaim: true when all conditions are met', () => {
    setupMocks({
      address: ELIGIBLE_ADDRESS,
      hasClaimed: false,
      claimDeadline: BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day from now
      chainId: COMPENSATION_CLAIM_CHAIN_ID,
    })

    const { result } = renderHook(() => useCompensationClaim())

    expect(result.current.isEligible).toBe(true)
    expect(result.current.hasClaimed).toBe(false)
    expect(result.current.isDeadlinePassed).toBe(false)
    expect(result.current.isWrongNetwork).toBe(false)
    expect(result.current.canClaim).toBe(true)
  })

  it('claim() calls writeContract with correct parameters', () => {
    setupMocks({ address: ELIGIBLE_ADDRESS })

    const { result } = renderHook(() => useCompensationClaim())

    act(() => {
      result.current.claim()
    })

    expect(mockWriteContract).toHaveBeenCalledTimes(1)
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'claim',
        chainId: COMPENSATION_CLAIM_CHAIN_ID,
        args: expect.arrayContaining([expect.any(Array)]), // the proof array
      }),
    )
  })
})
