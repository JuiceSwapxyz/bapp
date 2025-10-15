import { useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { useClaimNFT } from 'services/firstSqueezerCampaign/hooks'
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

const TransactionLink = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  cursor: 'pointer',
  hoverStyle: {
    opacity: 0.7,
  },
})

interface NFTClaimSectionProps {
  isEligible: boolean
  walletAddress?: string
}

export function NFTClaimSection({ isEligible, walletAddress }: NFTClaimSectionProps) {
  const { claim, isClaiming, error, claimResult, isRabbyWallet } = useClaimNFT()
  const [showConfetti, setShowConfetti] = useState(false)
  const { width, height } = useWindowSize()

  const handleClaim = async () => {
    const success = await claim()
    if (success) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 8000)
    }
  }

  const handleViewTransaction = () => {
    if (claimResult?.txHash) {
      // Open Citrea testnet explorer
      window.open(`https://explorer.testnet.citrea.xyz/tx/${claimResult.txHash}`, '_blank', 'noopener,noreferrer')
    }
  }

  if (claimResult) {
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
                🎉 NFT Claimed Successfully!
              </Text>
              <Text variant="body2" color="$neutral2">
                Congratulations! Your First Squeezer NFT has been minted and sent to your wallet.
              </Text>
              {claimResult.tokenId && (
                <Text variant="body3" color="$neutral2">
                  Token ID: #{claimResult.tokenId}
                </Text>
              )}
            </Flex>

            {claimResult.txHash && (
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

  return (
    <ClaimContainer>
      <Flex gap="$spacing8">
        <ClaimTitle>🍋 Claim Your First Squeezer NFT</ClaimTitle>
        <ClaimDescription>
          {isEligible
            ? "You've completed all conditions! Click the button below to mint your exclusive First Squeezer NFT."
            : 'Complete all 3 conditions above to unlock the claim button.'}
        </ClaimDescription>
      </Flex>

      {error && (
        <ErrorContainer>
          <Text variant="body3" color="$statusCritical">
            {error}
          </Text>
        </ErrorContainer>
      )}

      <ClaimButton onPress={handleClaim} disabled={!isEligible || isClaiming}>
        {isClaiming ? (
          <Flex row gap="$spacing8" alignItems="center">
            <SpinningLoader size={20} />
            <Text variant="buttonLabel3" color="$white">
              Minting NFT...
            </Text>
          </Flex>
        ) : (
          <Text variant="buttonLabel3" color="$white">
            {isEligible ? 'Claim NFT' : 'Complete All Conditions First'}
          </Text>
        )}
      </ClaimButton>

      {walletAddress && (
        <Text variant="body4" color="$neutral3" textAlign="center">
          NFT will be minted to: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          {isRabbyWallet && ' (use MetaMask for auto-import)'}
        </Text>
      )}
    </ClaimContainer>
  )
}
