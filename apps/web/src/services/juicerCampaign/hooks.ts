import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { JUICER_NFT_ABI, juicerCampaignAPI } from 'services/juicerCampaign/api'
import { JuicerProgress } from 'services/juicerCampaign/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isValidHexString } from 'uniswap/src/utils/hex'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

const JUICER_CAMPAIGN_UPDATED_EVENT = 'juicer-campaign-updated'

// Must match the deployed contract window.
const CAMPAIGN_START_ISO = '2026-04-24T00:00:00.000Z'
const CAMPAIGN_END_ISO = '2026-05-08T23:59:59.000Z'

function formatClaimError(err: unknown, fallback: string): string {
  if (didUserReject(err)) {
    return 'You rejected the request in your wallet. Please try again.'
  }
  if (
    err !== null &&
    typeof err === 'object' &&
    'shortMessage' in err &&
    typeof err.shortMessage === 'string' &&
    err.shortMessage.length > 0
  ) {
    return err.shortMessage
  }
  if (err instanceof Error && err.message) {
    const firstLine = err.message.split('\n')[0].trim()
    if (firstLine) {
      return firstLine
    }
  }
  return fallback
}

/** Read the wallet's Juicer progress (JP balance, eligibility, mint state). */
export function useJuicerProgress() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const [progress, setProgress] = useState<JuicerProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    if (!account.address || defaultChainId !== UniverseChainId.CitreaMainnet) {
      setProgress(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await juicerCampaignAPI.getProgress(account.address, defaultChainId)
      setProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Juicer progress')
    } finally {
      setLoading(false)
    }
  }, [account.address, defaultChainId])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  useEffect(() => {
    const handler = () => fetchProgress()
    window.addEventListener(JUICER_CAMPAIGN_UPDATED_EVENT, handler)
    return () => window.removeEventListener(JUICER_CAMPAIGN_UPDATED_EVENT, handler)
  }, [fetchProgress])

  return { progress, loading, error, refetch: fetchProgress }
}

function useUrlJuicerOverride(): boolean {
  const [overrideActive, setOverrideActive] = useState(
    () => localStorage.getItem('juicerOverride') === 'true',
  )

  useEffect(() => {
    const checkUrlParams = () => {
      const params = new URLSearchParams(window.location.search)
      const flag = params.get('juicer')
      if (flag === 'true') {
        localStorage.setItem('juicerOverride', 'true')
        window.location.href = window.location.pathname
      } else if (flag === 'false') {
        localStorage.removeItem('juicerOverride')
        window.location.href = window.location.pathname
      }
    }
    checkUrlParams()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'juicerOverride') {
        setOverrideActive(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('popstate', checkUrlParams)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('popstate', checkUrlParams)
    }
  }, [])

  return overrideActive
}

function useIsJuicerTimeActive(): boolean {
  const hasUrlOverride = useUrlJuicerOverride()
  return useMemo(() => {
    if (hasUrlOverride) {
      return true
    }
    const start = new Date(CAMPAIGN_START_ISO).getTime()
    const end = new Date(CAMPAIGN_END_ISO).getTime()
    const now = Date.now()
    return now >= start && now <= end
  }, [hasUrlOverride])
}

export function useIsJuicerCampaignEnded(): boolean {
  return useMemo(() => Date.now() > new Date(CAMPAIGN_END_ISO).getTime(), [])
}

export function useIsJuicerCampaignVisible(): boolean {
  const { defaultChainId } = useEnabledChains()
  const isCampaignTimeActive = useIsJuicerTimeActive()
  return isCampaignTimeActive && defaultChainId === UniverseChainId.CitreaMainnet
}

// eslint-disable-next-line import/no-unused-modules
export function useIsJuicerCampaignAvailable(): boolean {
  const account = useAccount()
  const isVisible = useIsJuicerCampaignVisible()
  return isVisible && account.isConnected
}

interface UseSpendAndClaimResult {
  /** Trades JP for mint rights and submits the on-chain claim. */
  spendAndClaim: () => Promise<boolean>
  reset: () => void
  isWorking: boolean
  error: string | null
  result: { txHash?: string; tokenId?: string } | null
}

/**
 * Combined "trade JP -> claim NFT" flow:
 *   1) POST /v1/campaigns/juicer/spend  (deduct JUICER_JP_COST, get signature)
 *   2) JuicerNFT.claim(signature)        (on-chain mint via wagmi)
 *
 * The API records the spend BEFORE returning the signature. If the wallet
 * later rejects the on-chain claim, the JP is still spent — the backend
 * issues each wallet at most one valid signature.
 */
export function useSpendAndClaimJuicerNFT(contractAddress?: string): UseSpendAndClaimResult {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const { writeContractAsync } = useWriteContract()
  const selectChain = useSelectChain()

  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [result, setResult] = useState<{ txHash?: string; tokenId?: string } | null>(null)

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTxError,
    error: txError,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash: pendingTxHash })

  useEffect(() => {
    if (!receipt) {
      return
    }
    let tokenId: string | undefined
    try {
      const transferTopic =
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      const log = receipt.logs.find((l) => l.topics[0] === transferTopic)
      if (log && log.topics[3]) {
        tokenId = BigInt(log.topics[3]).toString()
      }
    } catch {
      // ignore - tokenId stays undefined
    }
    setResult({ txHash: pendingTxHash, tokenId })
    setPendingTxHash(undefined)
    setIsWorking(false)
    window.dispatchEvent(new CustomEvent(JUICER_CAMPAIGN_UPDATED_EVENT))
  }, [receipt, pendingTxHash])

  useEffect(() => {
    if (isTxError && pendingTxHash) {
      setError(formatClaimError(txError, 'Juicer NFT claim transaction failed'))
      setPendingTxHash(undefined)
      setIsWorking(false)
    }
  }, [isTxError, txError, pendingTxHash])

  const spendAndClaim = useCallback(async (): Promise<boolean> => {
    if (!account.address) {
      setError('Please connect your wallet first')
      return false
    }
    if (!contractAddress || !isValidHexString(contractAddress) || contractAddress.length !== 42) {
      setError('Juicer NFT contract address is not configured yet')
      return false
    }

    setIsWorking(true)
    setError(null)
    setResult(null)
    setPendingTxHash(undefined)

    if (account.chainId !== UniverseChainId.CitreaMainnet) {
      const ok = await selectChain(UniverseChainId.CitreaMainnet)
      if (!ok) {
        setError('Please switch to Citrea Mainnet to claim your Juicer NFT')
        setIsWorking(false)
        return false
      }
    }

    try {
      const { signature } = await juicerCampaignAPI.spendJpForMint(
        account.address,
        defaultChainId,
      )
      if (!isValidHexString(signature) || signature.length !== 132) {
        throw new Error('Invalid signature from API')
      }
      const tx = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: JUICER_NFT_ABI,
        functionName: 'claim',
        args: [signature as `0x${string}`],
        chainId: UniverseChainId.CitreaMainnet,
      })
      if (!isValidHexString(tx)) {
        throw new Error('Invalid transaction hash')
      }
      setPendingTxHash(tx)
      window.dispatchEvent(new CustomEvent(JUICER_CAMPAIGN_UPDATED_EVENT))
      return true
    } catch (err) {
      setError(formatClaimError(err, 'Juicer NFT claim failed'))
      setIsWorking(false)
      setPendingTxHash(undefined)
      return false
    }
  }, [account.address, account.chainId, contractAddress, defaultChainId, selectChain, writeContractAsync])

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
    setPendingTxHash(undefined)
  }, [])

  return {
    spendAndClaim,
    reset,
    isWorking: isWorking || isConfirming,
    error,
    result: isConfirmed ? result : result,
  }
}
