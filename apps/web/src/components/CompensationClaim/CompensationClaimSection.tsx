import { useCompensationClaim } from 'components/CompensationClaim/useCompensationClaim'
import { useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { Button, Flex, SpinningLoader, Text, styled } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'

const ClaimContainer = styled(Flex, {
  gap: '$spacing16',
  padding: '$spacing24',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 2,
  borderColor: '$accent1',
  position: 'relative',
  overflow: 'hidden',
  maxWidth: 500,
  width: '100%',
})

const ClaimTitle = styled(Text, {
  variant: 'heading3',
  color: '$neutral1',
  fontWeight: '600',
})

const ClaimDescription = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
})

const ClaimButton = styled(Button, {
  gap: '$spacing8',
  paddingHorizontal: '$spacing24',
  paddingVertical: '$spacing16',
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
  minHeight: 56,
  hoverStyle: {
    backgroundColor: '$accent2',
    transform: 'scale(1.02)',
  },
  pressStyle: {
    transform: 'scale(0.98)',
  },
  transition: 'all 0.2s ease',
})

const SuccessContainer = styled(Flex, {
  gap: '$spacing12',
  padding: '$spacing16',
  backgroundColor: 'rgba(76, 175, 80, 0.1)',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$statusSuccess',
})

const ErrorContainer = styled(Flex, {
  gap: '$spacing12',
  padding: '$spacing16',
  backgroundColor: 'rgba(255, 59, 48, 0.1)',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$statusCritical',
})

const InfoContainer = styled(Flex, {
  gap: '$spacing8',
  padding: '$spacing16',
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
})

const TokenAmount = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: '$spacing8',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
})

const TransactionLink = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  cursor: 'pointer',
  hoverStyle: {
    opacity: 0.7,
  },
})

export function CompensationClaimSection() {
  const {
    isConnected,
    userAddress,
    isEligible,
    hasClaimed,
    isDeadlinePassed,
    canClaim,
    deadlineDate,
    jusdAmount,
    tapfreakAmount,
    claim,
    isClaimPending,
    isClaimSuccess,
    claimError,
    txHash,
    isLoading,
  } = useCompensationClaim()

  const [showConfetti, setShowConfetti] = useState(false)
  const { width, height } = useWindowSize()

  const handleClaim = () => {
    claim()
  }

  // Show confetti on success
  if (isClaimSuccess && !showConfetti) {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 8000)
  }

  const handleViewTransaction = () => {
    if (txHash) {
      window.open(`https://citreascan.com/tx/${txHash}`, '_blank', 'noopener,noreferrer')
    }
  }

  // Not connected state
  if (!isConnected) {
    return (
      <ClaimContainer>
        <Flex gap="$spacing8">
          <ClaimTitle>Compensation Claim</ClaimTitle>
          <ClaimDescription>Connect your wallet to check if you are eligible for compensation.</ClaimDescription>
        </Flex>
        <InfoContainer>
          <Text variant="body3" color="$neutral2">
            Affected users from interchain swap issues can claim:
          </Text>
          <TokenAmount>
            <Text variant="body2" color="$neutral1">
              JUSD
            </Text>
            <Text variant="body2" color="$accent1" fontWeight="600">
              {jusdAmount}
            </Text>
          </TokenAmount>
          <TokenAmount style={{ borderBottomWidth: 0 }}>
            <Text variant="body2" color="$neutral1">
              TAPFREAK
            </Text>
            <Text variant="body2" color="$accent1" fontWeight="600">
              {tapfreakAmount}
            </Text>
          </TokenAmount>
        </InfoContainer>
      </ClaimContainer>
    )
  }

  // Already claimed state
  if (hasClaimed || isClaimSuccess) {
    return (
      <>
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            numberOfPieces={300}
            recycle={false}
            colors={['#FF6B35', '#4CAF50', '#2ABDFF', '#FC72FF', '#FFD700']}
            gravity={0.15}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}
          />
        )}
        <ClaimContainer>
          <SuccessContainer>
            <Flex gap="$spacing8">
              <Text variant="heading3" color="$statusSuccess">
                {isClaimSuccess ? '🎉 Tokens Claimed Successfully!' : '✓ Already Claimed'}
              </Text>
              <Text variant="body2" color="$neutral2">
                {isClaimSuccess
                  ? `You have successfully claimed ${jusdAmount} JUSD and ${tapfreakAmount} TAPFREAK!`
                  : 'You have already claimed your compensation tokens.'}
              </Text>
            </Flex>
            {txHash && (
              <TransactionLink onPress={handleViewTransaction}>
                <Text variant="buttonLabel4" color="$accent1">
                  View Transaction
                </Text>
                <ExternalLink size="$icon.16" color="$accent1" />
              </TransactionLink>
            )}
          </SuccessContainer>
        </ClaimContainer>
      </>
    )
  }

  // Not eligible state
  if (!isEligible) {
    return (
      <ClaimContainer>
        <Flex gap="$spacing8">
          <ClaimTitle>Compensation Claim</ClaimTitle>
          <ClaimDescription>Your wallet is not eligible for compensation.</ClaimDescription>
        </Flex>
        <InfoContainer>
          <Text variant="body3" color="$neutral2">
            Only wallets affected by interchain swap issues are eligible.
          </Text>
          <Text variant="body4" color="$neutral3">
            Connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
          </Text>
        </InfoContainer>
      </ClaimContainer>
    )
  }

  // Deadline passed state
  if (isDeadlinePassed) {
    return (
      <ClaimContainer>
        <Flex gap="$spacing8">
          <ClaimTitle>Claim Period Ended</ClaimTitle>
          <ClaimDescription>The compensation claim period has ended.</ClaimDescription>
        </Flex>
        {deadlineDate && (
          <Text variant="body4" color="$neutral3">
            Deadline was: {deadlineDate.toLocaleDateString()}
          </Text>
        )}
      </ClaimContainer>
    )
  }

  // Eligible and can claim
  return (
    <ClaimContainer>
      <Flex gap="$spacing8">
        <ClaimTitle>Claim Your Compensation</ClaimTitle>
        <ClaimDescription>You are eligible to claim compensation tokens for interchain swap issues.</ClaimDescription>
      </Flex>

      <InfoContainer>
        <Text variant="body3" color="$neutral2" fontWeight="500">
          You will receive:
        </Text>
        <TokenAmount>
          <Text variant="body2" color="$neutral1">
            JUSD
          </Text>
          <Text variant="body2" color="$accent1" fontWeight="600">
            {jusdAmount}
          </Text>
        </TokenAmount>
        <TokenAmount style={{ borderBottomWidth: 0 }}>
          <Text variant="body2" color="$neutral1">
            TAPFREAK
          </Text>
          <Text variant="body2" color="$accent1" fontWeight="600">
            {tapfreakAmount}
          </Text>
        </TokenAmount>
      </InfoContainer>

      {claimError && (
        <ErrorContainer>
          <Text variant="body3" color="$statusCritical">
            {claimError.message || 'Failed to claim. Please try again.'}
          </Text>
        </ErrorContainer>
      )}

      <ClaimButton onPress={handleClaim} disabled={!canClaim || isClaimPending || isLoading}>
        {isClaimPending ? (
          <Flex row gap="$spacing8" alignItems="center">
            <SpinningLoader size={20} />
            <Text variant="buttonLabel3" color="$white">
              Claiming...
            </Text>
          </Flex>
        ) : isLoading ? (
          <Flex row gap="$spacing8" alignItems="center">
            <SpinningLoader size={20} />
            <Text variant="buttonLabel3" color="$white">
              Loading...
            </Text>
          </Flex>
        ) : (
          <Text variant="buttonLabel3" color="$white">
            Claim Tokens
          </Text>
        )}
      </ClaimButton>

      {deadlineDate && (
        <Text variant="body4" color="$neutral3" textAlign="center">
          Claim deadline: {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString()}
        </Text>
      )}

      {userAddress && (
        <Text variant="body4" color="$neutral3" textAlign="center">
          Claiming to: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
        </Text>
      )}
    </ClaimContainer>
  )
}
