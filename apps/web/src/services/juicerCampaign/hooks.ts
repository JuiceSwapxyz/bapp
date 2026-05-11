import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  JUICER_NFT_ABI,
  JuicerCampaignNotReadyError,
  buildEmptyJuicerProgress,
  juicerCampaignAPI,
} from 'services/juicerCampaign/api'
import { JuicerProgress } from 'services/juicerCampaign/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isValidHexString } from 'uniswap/src/utils/hex'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

const JUICER_CAMPAIGN_UPDATED_EVENT = 'juicer-campaign-updated'

const TWITTER_FOLLOW_INTENT_URL = 'https://x.com/intent/follow?screen_name=JuiceSwap_com'

// Must match the deployed contract window.
const CAMPAIGN_START_ISO = '2026-04-24T00:00:00.000Z'
const CAMPAIGN_END_ISO = '2026-05-08T23:59:59.000Z'

function dispatchUpdate(): void {
  window.dispatchEvent(new CustomEvent(JUICER_CAMPAIGN_UPDATED_EVENT))
}

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

/** Read the wallet's Juicer progress (JP economics + social verification). */
export function useJuicerProgress() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const [progress, setProgress] = useState<JuicerProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    if (!account.address || defaultChainId !== UniverseChainId.CitreaMainnet) {
      setProgress(buildEmptyJuicerProgress(account.address ?? '', defaultChainId))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await juicerCampaignAPI.getProgress(account.address, defaultChainId)
      setProgress(data)
    } catch (err) {
      // Backend has not enabled the campaign yet — show the empty preview
      // instead of a scary error. The user can still see what's required.
      if (err instanceof JuicerCampaignNotReadyError) {
        setProgress(buildEmptyJuicerProgress(account.address, defaultChainId))
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch Juicer progress')
      }
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
  const [overrideActive, setOverrideActive] = useState(() => localStorage.getItem('juicerOverride') === 'true')

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

/**
 * Mirrors `WebFeatureFlags.JUICE_POINTS_PROGRAM` introduced in #747. We read
 * the env var directly so this module stays compilable independent of merge
 * order — once #747 lands, this can be swapped to import `WebFeatureFlags`.
 * Default OFF (must be explicitly enabled per environment).
 */
export function isJuicePointsProgramEnabled(): boolean {
  return process.env.REACT_APP_JUICE_POINTS_PROGRAM === 'true'
}

export function useIsJuicerCampaignVisible(): boolean {
  const { defaultChainId } = useEnabledChains()
  const isCampaignTimeActive = useIsJuicerTimeActive()
  // The Juicer NFT depends on the JP program (10,000 JP cost + 500 JP
  // meme-token bonus). If the JP program is dark in this environment the
  // Juicer flow stays hidden too.
  return isJuicePointsProgramEnabled() && isCampaignTimeActive && defaultChainId === UniverseChainId.CitreaMainnet
}

// eslint-disable-next-line import/no-unused-modules
export function useIsJuicerCampaignAvailable(): boolean {
  const account = useAccount()
  const isVisible = useIsJuicerCampaignVisible()
  return isVisible && account.isConnected
}

/**
 * Step 1 — atomic JP spend.
 * The deduction is recorded server-side BEFORE this resolves. A retried
 * call returns the same record without double-spending.
 */
export function useSpendJp() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const spend = useCallback(async (): Promise<boolean> => {
    if (!account.address) {
      setError('Please connect your wallet first')
      return false
    }
    if (defaultChainId !== UniverseChainId.CitreaMainnet) {
      setError('Switch to Citrea Mainnet to trade Juice Points')
      return false
    }
    setError(null)
    setIsLoading(true)
    try {
      await juicerCampaignAPI.spendJp(account.address, defaultChainId)
      dispatchUpdate()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trade Juice Points')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [account.address, defaultChainId])

  return { spend, isLoading, error }
}

/**
 * Step 2 — Twitter follow (honor-system).
 * Opens the X follow intent in a new tab, then asks the backend to mark
 * the wallet as verified. window.open must run synchronously inside the
 * click handler so the popup isn't blocked.
 */
export function useTwitterFollow() {
  const account = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startFollow = useCallback(async () => {
    if (!account.address) {
      setError('Please connect your wallet first')
      return
    }
    setError(null)
    setIsLoading(true)
    window.open(TWITTER_FOLLOW_INTENT_URL, '_blank', 'noopener,noreferrer')
    try {
      await juicerCampaignAPI.markTwitterFollowed(account.address)
      dispatchUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record Twitter follow')
    } finally {
      setIsLoading(false)
    }
  }, [account.address])

  return { startFollow, isLoading, error }
}

/** Step 3 — Discord OAuth (same-tab redirect). */
export function useDiscordOAuth() {
  const account = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startOAuth = useCallback(async () => {
    if (!account.address) {
      setError('Please connect your wallet first')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const { authUrl } = await juicerCampaignAPI.startDiscordOAuth(account.address)
      window.location.href = authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Discord verification')
      setIsLoading(false)
    }
  }, [account.address])

  return { startOAuth, isLoading, error }
}

interface UseClaimResult {
  claim: () => Promise<boolean>
  reset: () => void
  isClaiming: boolean
  error: string | null
  result: { txHash?: string; tokenId?: string } | null
}

/**
 * Final step — fetch backend signature (only issued when all 4 conditions
 * are met) and submit JuicerNFT.claim(signature) on Citrea Mainnet.
 */
export function useClaimJuicerNFT(): UseClaimResult {
  const account = useAccount()
  const { writeContractAsync } = useWriteContract()
  const selectChain = useSelectChain()

  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [result, setResult] = useState<{ txHash?: string; tokenId?: string } | null>(null)

  const {
    isLoading: isConfirming,
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
      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      const log = receipt.logs.find((l) => l.topics[0] === transferTopic)
      if (log && log.topics[3]) {
        tokenId = BigInt(log.topics[3]).toString()
      }
    } catch {
      // ignore
    }
    setResult({ txHash: pendingTxHash, tokenId })
    setPendingTxHash(undefined)
    setIsClaiming(false)
    dispatchUpdate()
  }, [receipt, pendingTxHash])

  useEffect(() => {
    if (isTxError && pendingTxHash) {
      setError(formatClaimError(txError, 'Juicer NFT claim transaction failed'))
      setPendingTxHash(undefined)
      setIsClaiming(false)
    }
  }, [isTxError, txError, pendingTxHash])

  const claim = useCallback(async (): Promise<boolean> => {
    if (!account.address) {
      setError('Please connect your wallet first')
      return false
    }
    setIsClaiming(true)
    setError(null)
    setResult(null)
    setPendingTxHash(undefined)

    if (account.chainId !== UniverseChainId.CitreaMainnet) {
      const ok = await selectChain(UniverseChainId.CitreaMainnet)
      if (!ok) {
        setError('Please switch to Citrea Mainnet to claim your Juicer NFT')
        setIsClaiming(false)
        return false
      }
    }

    try {
      const { signature, contractAddress } = await juicerCampaignAPI.getNftSignature(account.address)
      if (!isValidHexString(contractAddress) || contractAddress.length !== 42) {
        throw new Error('Invalid contract address from API')
      }
      if (!isValidHexString(signature) || signature.length !== 132) {
        throw new Error('Invalid signature from API')
      }
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: JUICER_NFT_ABI,
        functionName: 'claim',
        args: [signature],
        chainId: UniverseChainId.CitreaMainnet,
      })
      if (!isValidHexString(tx)) {
        throw new Error('Invalid transaction hash')
      }
      setPendingTxHash(tx)
      dispatchUpdate()
      return true
    } catch (err) {
      setError(formatClaimError(err, 'Juicer NFT claim failed'))
      setIsClaiming(false)
      return false
    }
  }, [account.address, account.chainId, selectChain, writeContractAsync])

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
    setPendingTxHash(undefined)
  }, [])

  return {
    claim,
    reset,
    isClaiming: isClaiming || isConfirming,
    error,
    result,
  }
}
