import {
  COMPENSATION_CLAIM_ADDRESS,
  COMPENSATION_CLAIM_CHAIN_ID,
  JUSD_CLAIM_AMOUNT,
  TAPFREAK_CLAIM_AMOUNT,
} from 'components/CompensationClaim/constants'
import merkleProofsData from 'components/CompensationClaim/merkle-proofs.json'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useMemo } from 'react'
import CompensationClaimABI from 'uniswap/src/abis/CompensationClaim.json'
import { logger } from 'utilities/src/logger/logger'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

interface MerkleProofEntry {
  address: string
  proof: `0x${string}`[]
  leaf: string
}

interface MerkleProofsData {
  root: string
  totalAddresses: number
  generatedAt: string
  proofs: MerkleProofEntry[]
}

const proofs = merkleProofsData as MerkleProofsData

export function useCompensationClaim() {
  const account = useAccount()
  const userAddress = account.address?.toLowerCase()

  // Find user's proof from merkle data
  const userProofEntry = useMemo(() => {
    if (!userAddress) {
      return null
    }
    return proofs.proofs.find((p) => p.address.toLowerCase() === userAddress) ?? null
  }, [userAddress])

  const userProof = useMemo(() => userProofEntry?.proof ?? [], [userProofEntry])

  // Check if user is eligible (in merkle tree)
  const isEligible = !!userProofEntry

  // Read contract state
  const { data: hasClaimed, isLoading: isLoadingHasClaimed } = useReadContract({
    address: COMPENSATION_CLAIM_ADDRESS,
    abi: CompensationClaimABI,
    functionName: 'hasClaimed',
    args: userAddress ? [userAddress] : undefined,
    chainId: COMPENSATION_CLAIM_CHAIN_ID,
    query: {
      enabled: !!userAddress && isEligible,
    },
  })

  const { data: claimDeadline } = useReadContract({
    address: COMPENSATION_CLAIM_ADDRESS,
    abi: CompensationClaimABI,
    functionName: 'claimDeadline',
    chainId: COMPENSATION_CLAIM_CHAIN_ID,
  })

  // Check if deadline has passed
  const isDeadlinePassed = useMemo(() => {
    if (!claimDeadline) {
      return false
    }
    const deadline = Number(claimDeadline)
    if (deadline === 0) {
      return false
    }
    return Date.now() / 1000 > deadline
  }, [claimDeadline])

  // Format deadline for display
  const deadlineDate = useMemo(() => {
    if (!claimDeadline) {
      return null
    }
    const deadline = Number(claimDeadline)
    if (deadline === 0) {
      return null
    }
    return new Date(deadline * 1000)
  }, [claimDeadline])

  // Write contract - claim function
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract()

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Claim function
  const claim = useCallback(() => {
    if (!userProof.length) {
      logger.error(new Error('No proof available'), {
        tags: { file: 'useCompensationClaim', function: 'claim' },
      })
      return
    }

    writeContract({
      address: COMPENSATION_CLAIM_ADDRESS,
      abi: CompensationClaimABI,
      functionName: 'claim',
      args: [userProof],
      chainId: COMPENSATION_CLAIM_CHAIN_ID,
    })
  }, [userProof, writeContract])

  // Determine overall status
  const canClaim = isEligible && !hasClaimed && !isDeadlinePassed && !isLoadingHasClaimed

  return {
    // User state
    isConnected: account.isConnected,
    userAddress,
    chainId: account.chainId,

    // Eligibility
    isEligible,
    hasClaimed: !!hasClaimed,
    isDeadlinePassed,
    canClaim,
    deadlineDate,

    // Claim amounts
    jusdAmount: JUSD_CLAIM_AMOUNT,
    tapfreakAmount: TAPFREAK_CLAIM_AMOUNT,

    // Transaction state
    claim,
    isClaimPending: isWritePending || isConfirming,
    isClaimSuccess: isConfirmed,
    claimError: writeError,
    txHash,

    // Loading states
    isLoading: isLoadingHasClaimed,

    // Merkle data
    totalEligibleAddresses: proofs.totalAddresses,
  }
}
