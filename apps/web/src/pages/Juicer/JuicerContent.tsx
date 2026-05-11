import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from 'hooks/useAccount'
import { ConditionCard } from 'pages/Juicer/ConditionCard'
import { NFTClaimSection } from 'pages/Juicer/NFTClaimSection'
import {
  useDiscordOAuth,
  useIsJuicerCampaignEnded,
  useJuicerProgress,
  useSpendJp,
  useTwitterFollow,
} from 'services/juicerCampaign/hooks'
import { ConditionType, JUICER_JP_COST } from 'services/juicerCampaign/types'
import { Button, Flex, SpinningLoader, Text, styled } from 'ui/src'

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

const ConditionList = styled(Flex, {
  gap: '$spacing12',
})

const ConnectBanner = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '$spacing16',
  padding: '$spacing20',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$accent1',
  $sm: { flexDirection: 'column', alignItems: 'flex-start' },
})

export default function JuicerContent() {
  const accountDrawer = useAccountDrawer()
  const account = useAccount()
  const { progress, loading, error } = useJuicerProgress()
  const isEnded = useIsJuicerCampaignEnded()
  const { spend: spendJp, isLoading: jpLoading, error: jpError } = useSpendJp()
  const { startFollow, isLoading: twitterLoading, error: twitterError } = useTwitterFollow()
  const { startOAuth: startDiscord, isLoading: discordLoading, error: discordError } = useDiscordOAuth()

  if (loading && !progress) {
    return (
      <Flex alignItems="center" padding="$spacing40">
        <SpinningLoader size={32} />
      </Flex>
    )
  }

  if (!progress) {
    return null
  }

  // Map each condition to its action handler / loading / error.
  const handlerFor = (type: ConditionType) => {
    switch (type) {
      case ConditionType.JP_BALANCE:
        return { onAction: spendJp, isLoading: jpLoading, error: jpError }
      case ConditionType.TWITTER_FOLLOW:
        return { onAction: startFollow, isLoading: twitterLoading, error: twitterError }
      case ConditionType.DISCORD_JOIN:
        return { onAction: startDiscord, isLoading: discordLoading, error: discordError }
      default:
        return { onAction: undefined, isLoading: false, error: null }
    }
  }

  return (
    <ContentContainer>
      {!account.isConnected && (
        <ConnectBanner>
          <Flex flex={1} gap="$spacing4" minWidth={0}>
            <Text variant="subheading2" color="$neutral1">
              Connect your wallet to track progress
            </Text>
            <Text variant="body3" color="$neutral2">
              {`The Juicer NFT requires ${JUICER_JP_COST.toLocaleString()} JP, a meme token launch, an X follow and Discord verification.`}
            </Text>
          </Flex>
          <Button
            onPress={() => accountDrawer.open()}
            backgroundColor="$accent1"
            paddingHorizontal="$spacing24"
            paddingVertical="$spacing12"
            borderRadius="$rounded12"
          >
            <Text variant="buttonLabel3" color="$white">
              Connect wallet
            </Text>
          </Button>
        </ConnectBanner>
      )}

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
          {`Cost to mint: ${progress.cost.toLocaleString()} JP. Launch a meme token (one-time +500 JP bonus), follow JuiceSwap on X and join the Discord to unlock the claim.`}
        </Text>
      </Section>

      <Section>
        <SectionTitle>Earn the Juicer NFT</SectionTitle>
        <Text variant="body3" color="$neutral2">
          {`${progress.completedConditions} of ${progress.totalConditions} steps complete · ${progress.progress}%`}
        </Text>
        <ConditionList>
          {progress.conditions.map((c) => {
            const handler = handlerFor(c.type)
            return (
              <ConditionCard
                key={c.id}
                condition={c}
                onAction={handler.onAction}
                isLoading={handler.isLoading}
                error={handler.error}
              />
            )
          })}
        </ConditionList>
        {error && (
          <Text variant="body3" color="$statusCritical">
            {error}
          </Text>
        )}
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
          isEligible={progress.isEligibleForNFT}
          alreadyMinted={progress.nftMinted}
          remainingSteps={progress.totalConditions - progress.completedConditions}
        />
      )}
    </ContentContainer>
  )
}
