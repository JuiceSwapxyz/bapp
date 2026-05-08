import { useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { useClaimJuicerNFT } from 'services/juicerCampaign/hooks'
import { Button, Flex, SpinningLoader, Text, styled } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'

interface NFTClaimSectionProps {
  /** True once all 3 conditions (JP spend + Twitter + Discord) are satisfied. */
  isEligible: boolean
  /** True once the API has confirmed the wallet already minted. */
  alreadyMinted: boolean
  /** Conditions still pending. Used to nudge the user toward the next step. */
  remainingSteps: number
}

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

const SuccessContainer = styled(Flex, {
  gap: '$spacing12',
  padding: '$spacing16',
  backgroundColor: 'rgba(76, 175, 80, 0.10)',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$statusSuccess',
})

const PrimaryButton = styled(Button, {
  gap: '$spacing8',
  paddingHorizontal: '$spacing24',
  paddingVertical: '$spacing16',
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
  minHeight: 56,
})

export function NFTClaimSection({ isEligible, alreadyMinted, remainingSteps }: NFTClaimSectionProps) {
  const { width, height } = useWindowSize()
  const [showConfetti, setShowConfetti] = useState(false)
  const { claim, isClaiming, error, result } = useClaimJuicerNFT()

  const claimed = alreadyMinted || !!result?.txHash

  const onClaim = async () => {
    const ok = await claim()
    if (ok) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5_000)
    }
  }

  if (claimed) {
    const txHash = result?.txHash
    const tokenId = result?.tokenId
    return (
      <SuccessContainer data-testid="juicer-claimed">
        <Text variant="heading3" color="$statusSuccess">
          Juicer NFT claimed
        </Text>
        <Text variant="body2" color="$neutral2">
          {tokenId
            ? `Token #${tokenId} is in your wallet on Citrea Mainnet.`
            : 'It is in your wallet on Citrea Mainnet.'}
        </Text>
        {txHash && (
          <a
            href={`https://citreascan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <Flex row alignItems="center" gap="$spacing4">
              <Text variant="body3" color="$accent1">
                View transaction
              </Text>
              <ExternalLink size={14} color="$accent1" />
            </Flex>
          </a>
        )}
      </SuccessContainer>
    )
  }

  return (
    <ClaimContainer>
      {showConfetti && <Confetti width={width} height={height} numberOfPieces={250} recycle={false} />}
      <Flex gap="$spacing4">
        <Text variant="heading3" color="$neutral1" fontWeight="600">
          Mint your Juicer NFT
        </Text>
        <Text variant="body2" color="$neutral2">
          {isEligible
            ? 'All conditions met. Submit the on-chain mint to add the Juicer NFT to your wallet.'
            : `Finish ${remainingSteps} more step${remainingSteps === 1 ? '' : 's'} above to unlock the mint.`}
        </Text>
      </Flex>

      <PrimaryButton isDisabled={!isEligible || isClaiming} onPress={onClaim} opacity={!isEligible ? 0.5 : 1}>
        {isClaiming ? (
          <Flex row alignItems="center" gap="$spacing8">
            <SpinningLoader size={20} color="$white" />
            <Text variant="buttonLabel2" color="$white">
              Minting…
            </Text>
          </Flex>
        ) : (
          <Text variant="buttonLabel2" color="$white">
            Mint Juicer NFT
          </Text>
        )}
      </PrimaryButton>

      {error && (
        <Text variant="body3" color="$statusCritical">
          {error}
        </Text>
      )}
    </ClaimContainer>
  )
}
