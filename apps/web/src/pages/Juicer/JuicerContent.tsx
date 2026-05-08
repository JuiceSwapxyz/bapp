import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { NFTClaimSection } from 'pages/Juicer/NFTClaimSection'
import { useIsJuicerCampaignEnded, useJuicerProgress } from 'services/juicerCampaign/hooks'
import { JUICER_JP_COST } from 'services/juicerCampaign/types'
import { Button, Flex, SpinningLoader, Text, styled } from 'ui/src'

/**
 * Juicer NFT claim page — single-condition flow.
 * Eligibility: trade JUICER_JP_COST Juice Points for mint rights.
 */

const ContentContainer = styled(Flex, {
  gap: '$spacing24',
  width: '100%',
})

const Section = styled(Flex, {
  gap: '$spacing16',
  padding: '$spacing24',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
})

const SectionTitle = styled(Text, {
  variant: 'subheading1',
  color: '$neutral1',
})

const StatRow = styled(Flex, {
  row: true,
  gap: '$spacing16',
  $sm: { flexDirection: 'column' },
})

const Stat = styled(Flex, {
  flex: 1,
  gap: '$spacing4',
  padding: '$spacing16',
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
})

const ConnectPrompt = styled(Flex, {
  alignItems: 'center',
  gap: '$spacing16',
  padding: '$spacing32',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
})

interface JuicerContentProps {
  /** JuicerNFT contract address on Citrea Mainnet — undefined until wired by product. */
  contractAddress?: string
}

export default function JuicerContent({ contractAddress }: JuicerContentProps) {
  const accountDrawer = useAccountDrawer()
  const { progress, loading, error } = useJuicerProgress()
  const isEnded = useIsJuicerCampaignEnded()

  if (!progress && loading) {
    return (
      <Flex alignItems="center" padding="$spacing40">
        <SpinningLoader size={32} />
      </Flex>
    )
  }

  if (!progress) {
    return (
      <ConnectPrompt>
        <Text variant="heading3" color="$neutral1">
          Connect your wallet to start
        </Text>
        <Text variant="body2" color="$neutral2" textAlign="center">
          The Juicer NFT is claimed against your Juice Points balance on Citrea Mainnet.
        </Text>
        <Button onPress={() => accountDrawer.open()}>
          <Text variant="buttonLabel2">Connect wallet</Text>
        </Button>
        {error && (
          <Text variant="body3" color="$statusCritical">
            {error}
          </Text>
        )}
      </ConnectPrompt>
    )
  }

  return (
    <ContentContainer>
      <Section>
        <SectionTitle>Your Juice Points</SectionTitle>
        <StatRow>
          <Stat>
            <Text variant="body4" color="$neutral2">
              Available
            </Text>
            <Text variant="heading2" color="$accent1">
              {progress.availableJp.toLocaleString()} JP
            </Text>
          </Stat>
          <Stat>
            <Text variant="body4" color="$neutral2">
              Total earned
            </Text>
            <Text variant="heading3" color="$neutral1">
              {progress.totalEarnedJp.toLocaleString()} JP
            </Text>
          </Stat>
          <Stat>
            <Text variant="body4" color="$neutral2">
              Already spent
            </Text>
            <Text variant="heading3" color="$neutral2">
              {progress.spentJp.toLocaleString()} JP
            </Text>
          </Stat>
        </StatRow>
        <Text variant="body3" color="$neutral2">
          {`Cost to mint: ${progress.cost.toLocaleString()} JP (defaults to ${JUICER_JP_COST.toLocaleString()}).`}
        </Text>
      </Section>

      {isEnded ? (
        <Section>
          <Text variant="heading3" color="$neutral1">
            Campaign ended
          </Text>
          <Text variant="body2" color="$neutral2">
            New Juicer NFTs can no longer be minted. Wallets that already minted keep their NFT.
          </Text>
        </Section>
      ) : (
        <NFTClaimSection
          availableJp={progress.availableJp}
          alreadyMinted={progress.nftMinted}
          contractAddress={contractAddress}
        />
      )}
    </ContentContainer>
  )
}
