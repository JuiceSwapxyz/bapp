import { useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { useSpendAndClaimJuicerNFT } from 'services/juicerCampaign/hooks'
import { JUICER_JP_COST } from 'services/juicerCampaign/types'
import { Button, Flex, SpinningLoader, Text, styled } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'

interface NFTClaimSectionProps {
  /** Wallet's currently available JP (= total earned - already spent). */
  availableJp: number
  /** True once the API has confirmed the wallet already minted. */
  alreadyMinted: boolean
  /** JuicerNFT contract address on Citrea Mainnet. Undefined until product wires it. */
  contractAddress?: string
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

export function NFTClaimSection({
  availableJp,
  alreadyMinted,
  contractAddress,
}: NFTClaimSectionProps) {
  const { width, height } = useWindowSize()
  const [showConfetti, setShowConfetti] = useState(false)
  const { spendAndClaim, isWorking, error, result } = useSpendAndClaimJuicerNFT(contractAddress)

  const eligible = availableJp >= JUICER_JP_COST
  const claimed = alreadyMinted || !!result?.txHash

  const onClaim = async () => {
    const ok = await spendAndClaim()
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
      {showConfetti && (
        <Confetti width={width} height={height} numberOfPieces={250} recycle={false} />
      )}
      <Flex gap="$spacing4">
        <Text variant="heading3" color="$neutral1" fontWeight="600">
          Trade {JUICER_JP_COST.toLocaleString()} JP for the Juicer NFT
        </Text>
        <Text variant="body2" color="$neutral2">
          {JUICER_JP_COST.toLocaleString()} Juice Points are deducted from your balance the moment
          the trade is confirmed by the backend. After that you mint the NFT to your wallet.
        </Text>
      </Flex>

      <Flex row alignItems="center" gap="$spacing12">
        <Flex flex={1} gap="$spacing2">
          <Text variant="body4" color="$neutral2">
            Your available JP
          </Text>
          <Text variant="heading3" color={eligible ? '$accent1' : '$neutral2'}>
            {availableJp.toLocaleString()} JP
          </Text>
        </Flex>
        <PrimaryButton
          isDisabled={!eligible || isWorking || !contractAddress}
          onPress={onClaim}
          opacity={!eligible || !contractAddress ? 0.5 : 1}
        >
          {isWorking ? (
            <Flex row alignItems="center" gap="$spacing8">
              <SpinningLoader size={20} color="$white" />
              <Text variant="buttonLabel2" color="$white">
                Working…
              </Text>
            </Flex>
          ) : (
            <Text variant="buttonLabel2" color="$white">
              Trade {JUICER_JP_COST.toLocaleString()} JP
            </Text>
          )}
        </PrimaryButton>
      </Flex>

      {!eligible && (
        <Text variant="body3" color="$neutral2">
          You need {(JUICER_JP_COST - availableJp).toLocaleString()} more JP. Earn more by swapping
          on JuiceSwap.
        </Text>
      )}
      {!contractAddress && (
        <Text variant="body3" color="$statusWarning">
          The Juicer NFT contract has not been deployed yet — claim is disabled until it is wired in.
        </Text>
      )}
      {error && (
        <Text variant="body3" color="$statusCritical">
          {error}
        </Text>
      )}
    </ClaimContainer>
  )
}
