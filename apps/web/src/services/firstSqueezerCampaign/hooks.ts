import { useCallback, useEffect, useMemo, useState } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { FIRST_SQUEEZER_NFT_ABI, firstSqueezerCampaignAPI } from 'services/firstSqueezerCampaign/api'
import { FirstSqueezerProgress, NFTClaimRequest } from 'services/firstSqueezerCampaign/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isValidHexString } from 'uniswap/src/utils/hex'

/**
 * Hook to fetch and manage First Squeezer campaign progress
 */
export function useFirstSqueezerProgress() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()

  const [progress, setProgress] = useState<FirstSqueezerProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch campaign progress
  const fetchProgress = useCallback(async () => {
    if (!account.address || defaultChainId !== UniverseChainId.CitreaMainnet) {
      setProgress(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // API fetches everything - no need for manual merging
      const data = await firstSqueezerCampaignAPI.getProgress(account.address, defaultChainId)
      setProgress(data)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? `Failed to fetch campaign progress: ${err.message}` : 'Failed to fetch campaign progress'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [account.address, defaultChainId])

  // Fetch progress on mount and when dependencies change
  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Listen for campaign update events
  useEffect(() => {
    const handleCampaignUpdate = () => {
      fetchProgress()
    }

    window.addEventListener('first-squeezer-campaign-updated', handleCampaignUpdate)
    return () => {
      window.removeEventListener('first-squeezer-campaign-updated', handleCampaignUpdate)
    }
  }, [fetchProgress])

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
  }
}

/**
 * Hook to handle URL-based campaign override
 * Detects ?first-squeezer=true/false and manages localStorage
 * @internal
 */
function useUrlFirstSqueezerOverride(): boolean {
  const [overrideActive, setOverrideActive] = useState(() => {
    return localStorage.getItem('firstSqueezerOverride') === 'true'
  })

  useEffect(() => {
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const firstSqueezerParam = urlParams.get('first-squeezer')

      if (firstSqueezerParam === 'true') {
        localStorage.setItem('firstSqueezerOverride', 'true')
        // Hard refresh to ensure all components re-render with new state
        window.location.href = window.location.pathname
        return
      }

      if (firstSqueezerParam === 'false') {
        localStorage.removeItem('firstSqueezerOverride')
        // Hard refresh to ensure all components re-render with new state
        window.location.href = window.location.pathname
        return
      }
    }

    // Check on mount
    checkUrlParams()

    // Listen for manual localStorage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'firstSqueezerOverride') {
        setOverrideActive(e.newValue === 'true')
      }
    }

    // Listen for URL changes (navigation)
    const handlePopState = () => {
      checkUrlParams()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return overrideActive
}

// Must match the deployed contract window.
const CAMPAIGN_START_ISO = '2026-04-24T00:00:00.000Z'
const CAMPAIGN_END_ISO = '2026-05-08T23:59:59.000Z'

/**
 * Hook to check if campaign is currently active (time-based only)
 * @internal
 */
function useIsFirstSqueezerTimeActive(): boolean {
  const hasUrlOverride = useUrlFirstSqueezerOverride()

  return useMemo(() => {
    // URL Override has priority - if active, campaign is always on
    if (hasUrlOverride) {
      return true
    }

    // Normal time-based logic
    const campaignStartTime = new Date(CAMPAIGN_START_ISO).getTime()
    const campaignEndTime = new Date(CAMPAIGN_END_ISO).getTime()
    const now = Date.now()
    return now >= campaignStartTime && now <= campaignEndTime
  }, [hasUrlOverride])
}

/**
 * Hook to check if campaign has ended
 * Note: This always returns true after end date, even with URL override
 */
export function useIsFirstSqueezerCampaignEnded(): boolean {
  return useMemo(() => {
    const campaignEndTime = new Date(CAMPAIGN_END_ISO).getTime()
    const now = Date.now()
    return now > campaignEndTime
  }, [])
}

/**
 * Hook to check if campaign is currently visible (banner and navigation)
 */
export function useIsFirstSqueezerCampaignVisible(): boolean {
  const { defaultChainId } = useEnabledChains()
  const isCampaignTimeActive = useIsFirstSqueezerTimeActive()

  const isCorrectChain = defaultChainId === UniverseChainId.CitreaMainnet

  return isCampaignTimeActive && isCorrectChain
}

/**
 * Hook to check if campaign is available for user interaction (requires wallet)
 */
// eslint-disable-next-line import/no-unused-modules
export function useIsFirstSqueezerCampaignAvailable(): boolean {
  const account = useAccount()
  const isCampaignVisible = useIsFirstSqueezerCampaignVisible()

  return isCampaignVisible && account.isConnected
}

const TWITTER_FOLLOW_INTENT_URL = 'https://x.com/intent/follow?screen_name=JuiceSwap_com'

/**
 * Hook to handle the Twitter follow condition.
 * Honor-system flow: opens the X follow intent in a new tab, then asks the
 * backend to mark the wallet as verified. No OAuth, no API follow-check.
 *
 * IMPORTANT: window.open must run synchronously in the click handler (before
 * any await) so the browser keeps the user-gesture context and doesn't block
 * the popup.
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

    // Open the follow intent *synchronously* — still inside the click handler's
    // user-gesture context, so the popup isn't blocked.
    window.open(TWITTER_FOLLOW_INTENT_URL, '_blank', 'noopener,noreferrer')

    try {
      await firstSqueezerCampaignAPI.markTwitterFollowed(account.address)
      // Refresh campaign progress so the condition flips to completed.
      window.dispatchEvent(new CustomEvent('first-squeezer-campaign-updated'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record Twitter follow')
    } finally {
      setIsLoading(false)
    }
  }, [account.address])

  return {
    startFollow,
    isLoading,
    error,
  }
}

/**
 * Hook to handle Discord OAuth verification
 * Uses same-tab redirect (no popup)
 */
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

    // Clear any existing discord_error param from URL
    const currentUrl = new URL(window.location.href)
    if (currentUrl.searchParams.has('discord_error')) {
      currentUrl.searchParams.delete('discord_error')
      window.history.replaceState({}, '', currentUrl.toString())
    }

    try {
      // Get OAuth URL from backend
      const { authUrl } = await firstSqueezerCampaignAPI.startDiscordOAuth(account.address)

      // Navigate to Discord OAuth in same tab (page will unload, no need to set isLoading false)
      window.location.href = authUrl
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start Discord verification'
      setError(errorMsg)
      setIsLoading(false)
    }
  }, [account.address])

  return {
    startOAuth,
    isLoading,
    error,
  }
}

/**
 * Hook to handle NFT claiming
 */
export function useClaimNFT() {
  const account = useAccount()
  const { defaultChainId } = useEnabledChains()
  const { writeContractAsync } = useWriteContract()
  const selectChain = useSelectChain()
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [claimResult, setClaimResult] = useState<{ txHash?: string; tokenId?: string } | null>(null)
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [isRabbyWallet, setIsRabbyWallet] = useState(false)

  useEffect(() => {
    if (window.ethereum?.isRabby === true) {
      setIsRabbyWallet(true)
    }
  }, [])

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTransactionError,
    error: transactionError,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  // Handle successful confirmation
  useEffect(() => {
    if (receipt) {
      // Extract token ID from Transfer event logs
      let tokenId: string | undefined
      try {
        // ERC-721 Transfer event signature: Transfer(address,address,uint256)
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        const transferLog = receipt.logs.find((log) => log.topics[0] === transferTopic)
        if (transferLog && transferLog.topics[3]) {
          // Token ID is the 4th topic (index 3) in ERC-721 Transfer events
          tokenId = BigInt(transferLog.topics[3]).toString()
        }
      } catch (err) {
        // Failed to extract token ID from receipt
      }

      setClaimResult({
        txHash: pendingTxHash,
        tokenId,
      })
      setPendingTxHash(undefined)
      setIsClaiming(false)

      // Automatically add NFT to wallet (skip Rabby Wallet)
      if (contractAddress && tokenId && window.ethereum && !isRabbyWallet) {
        const provider = window.ethereum as any
        provider
          .request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC721',
              options: {
                address: contractAddress,
                tokenId,
              },
            },
          })
          .then(() => {
            // NFT added to wallet successfully
          })
          .catch(() => {
            // Failed to add NFT to wallet
          })
      }

      // Dispatch event to trigger progress refresh
      window.dispatchEvent(new CustomEvent('first-squeezer-campaign-updated'))
    }
  }, [isConfirmed, pendingTxHash, receipt, contractAddress, isRabbyWallet])

  // Handle transaction errors (reverted, rejected, etc.)
  useEffect(() => {
    if (isTransactionError && pendingTxHash) {
      const errorMsg = transactionError.message || 'Transaction failed'
      setError(`NFT claim transaction failed: ${errorMsg}`)
      setPendingTxHash(undefined)
      setIsClaiming(false)
    }
  }, [isTransactionError, transactionError, pendingTxHash])

  // Handle transaction timeout (2 minutes)
  useEffect(() => {
    if (!pendingTxHash) {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setError('Transaction is taking longer than expected. Please check your wallet or try again.')
      setPendingTxHash(undefined)
      setIsClaiming(false)
    }, 120000) // 2 minutes

    return () => {
      clearTimeout(timeoutId)
    }
  }, [pendingTxHash])

  const claim = useCallback(async () => {
    if (!account.address) {
      setError('Please connect your wallet first')
      return false
    }

    setIsClaiming(true)
    setError(null)
    setClaimResult(null)
    setPendingTxHash(undefined)
    setContractAddress(null)

    // Switch to Citrea Mainnet if needed
    if (account.chainId !== UniverseChainId.CitreaMainnet) {
      const correctChain = await selectChain(UniverseChainId.CitreaMainnet)
      if (!correctChain) {
        setError('Please switch to Citrea Mainnet to claim your NFT')
        setIsClaiming(false)
        return false
      }
    }

    try {
      const request: NFTClaimRequest = {
        walletAddress: account.address,
        chainId: defaultChainId,
      }

      // Call API with wagmi contract interaction callback
      const result = await firstSqueezerCampaignAPI.claimNFT(request, async (signature, contractAddr) => {
        // Validate address format (must be exactly 20 bytes = 40 hex chars + 0x prefix)
        if (!isValidHexString(contractAddr) || contractAddr.length !== 42) {
          throw new Error('Invalid contract address received from API')
        }
        // Validate signature format (must be exactly 65 bytes = 130 hex chars + 0x prefix)
        if (!isValidHexString(signature) || signature.length !== 132) {
          throw new Error('Invalid signature received from API')
        }

        // Store contract address for later use (NFT import)
        setContractAddress(contractAddr)

        // Actual contract interaction via wagmi
        const tx = await writeContractAsync({
          address: contractAddr,
          abi: FIRST_SQUEEZER_NFT_ABI,
          functionName: 'claim',
          args: [signature],
          chainId: UniverseChainId.CitreaMainnet,
        })
        return tx
      })

      if (result.success && result.txHash) {
        // Set pending tx hash to trigger confirmation waiting
        if (!isValidHexString(result.txHash)) {
          throw new Error('Invalid transaction hash received')
        }
        setPendingTxHash(result.txHash)
        // Note: isClaiming stays true until confirmation completes
        return true
      } else {
        setError(result.error || 'NFT claim failed')
        setIsClaiming(false)
        return false
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'NFT claim transaction failed'
      setError(errorMsg)
      setIsClaiming(false)
      setPendingTxHash(undefined)
      return false
    }
  }, [account.address, account.chainId, selectChain, defaultChainId, writeContractAsync])

  const reset = useCallback(() => {
    setError(null)
    setClaimResult(null)
    setPendingTxHash(undefined)
    setContractAddress(null)
    setIsRabbyWallet(false)
  }, [])

  return {
    claim,
    reset,
    isClaiming: isClaiming || isConfirming, // Claiming includes confirmation wait
    error,
    claimResult,
    isRabbyWallet,
  }
}

/**
 * Hook to check eligibility for NFT claim
 */
// eslint-disable-next-line import/no-unused-modules
export function useIsEligibleForNFT(): boolean {
  const { progress } = useFirstSqueezerProgress()

  return useMemo(() => {
    if (!progress) {
      return false
    }
    return progress.isEligibleForNFT
  }, [progress])
}

/**
 * Hook to check if NFT has been minted
 */
// eslint-disable-next-line import/no-unused-modules
export function useHasClaimedNFT(): boolean {
  const { progress } = useFirstSqueezerProgress()

  return useMemo(() => {
    if (!progress) {
      return false
    }
    return progress.nftMinted
  }, [progress])
}
