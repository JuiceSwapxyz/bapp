import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ConditionCard } from 'pages/FirstSqueezer/ConditionCard'
import { NFTClaimSection } from 'pages/FirstSqueezer/NFTClaimSection'
import { useFirstSqueezerProgress, useTwitterOAuth, useDiscordOAuth } from 'services/firstSqueezerCampaign/hooks'
import { ConditionType } from 'services/firstSqueezerCampaign/types'
import { Button, Flex, SpinningLoader, Text, styled } from 'ui/src'

const ContentContainer = styled(Flex, {
  gap: '$spacing32',
  width: '100%',
})

const Section = styled(Flex, {
  gap: '$spacing16',
  padding: '$spacing24',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
})

const SectionTitle = styled(Text, {
  variant: 'heading3',
  color: '$neutral1',
  fontWeight: '600',
})

const ProgressBar = styled(Flex, {
  height: 8,
  flex: 1,
  backgroundColor: '$surface3',
  borderRadius: '$rounded4',
  overflow: 'hidden',
})

const ProgressFill = styled(Flex, {
  height: '100%',
  background: 'linear-gradient(90deg, #FF6B35 0%, #4CAF50 100%)',
  borderRadius: '$rounded4',
})

const ProgressText = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
  fontWeight: '500',
})

interface FirstSqueezerContentProps {
  account: { address?: string; isConnected: boolean }
}

export default function FirstSqueezerContent({ account }: FirstSqueezerContentProps) {
  const accountDrawer = useAccountDrawer()
  const { progress, loading, error } = useFirstSqueezerProgress()
  const { startOAuth: startTwitterOAuth, isLoading: isTwitterAuthenticating, error: twitterOauthError } = useTwitterOAuth()
  const { startOAuth: startDiscordOAuth, isLoading: isDiscordAuthenticating, error: discordOauthError } = useDiscordOAuth()

  // Get OAuth callback error from URL (if redirected from OAuth callback with error)
  const params = new URLSearchParams(window.location.search)
  const oauthCallbackError = params.get('oauth_error')

  // Merge errors: callback error takes precedence over start error
  const twitterError = oauthCallbackError || twitterOauthError
  const discordError = oauthCallbackError || discordOauthError

  const handleConnectWallet = () => {
    accountDrawer.open()
  }

  if (!account.isConnected) {
    return (
      <ContentContainer>
        <Section>
          <SectionTitle>Connect Your Wallet</SectionTitle>
          <Text variant="body2" color="$neutral2">
            Connect your wallet to view your campaign progress and claim your First Squeezer NFT.
          </Text>
          <Button
            onPress={handleConnectWallet}
            backgroundColor="$accent1"
            paddingHorizontal="$spacing16"
            paddingVertical="$spacing12"
            borderRadius="$rounded12"
          >
            <Text variant="buttonLabel3" color="$white">
              Connect Wallet
            </Text>
          </Button>
        </Section>
      </ContentContainer>
    )
  }

  if (loading && !progress) {
    return (
      <ContentContainer>
        <Section>
          <Flex row gap="$spacing12" alignItems="center" justifyContent="center">
            <SpinningLoader size={24} />
            <Text variant="body2" color="$neutral2">
              Loading campaign progress...
            </Text>
          </Flex>
        </Section>
      </ContentContainer>
    )
  }

  if (error) {
    return (
      <ContentContainer>
        <Section>
          <SectionTitle>Error</SectionTitle>
          <Text variant="body2" color="$statusCritical">
            {error}
          </Text>
        </Section>
      </ContentContainer>
    )
  }

  const progressPercentage = progress?.progress || 0
  const completedConditions = progress?.completedConditions || 0
  const totalConditions = progress?.totalConditions || 3

  const handleConditionAction = (conditionType: ConditionType) => {
    if (conditionType === ConditionType.TWITTER_FOLLOW) {
      startTwitterOAuth()
    } else if (conditionType === ConditionType.DISCORD_JOIN) {
      startDiscordOAuth()
    }
  }

  return (
    <ContentContainer>
      {/* Progress Overview */}
      <Section>
        <SectionTitle>Your Progress</SectionTitle>
        <ProgressBar>
          <ProgressFill style={{ width: `${progressPercentage}%` }} />
        </ProgressBar>
        <ProgressText>
          {completedConditions} of {totalConditions} conditions completed ({progressPercentage.toFixed(0)}%)
        </ProgressText>
      </Section>

      {/* Conditions */}
      <Section>
        <SectionTitle>Campaign Conditions</SectionTitle>
        <Text variant="body2" color="$neutral2">
          Complete all three conditions to claim your First Squeezer NFT.
        </Text>

        <Flex gap="$spacing16" width="100%">
          {progress?.conditions.map((condition) => {
            const isTwitter = condition.type === ConditionType.TWITTER_FOLLOW
            const isDiscord = condition.type === ConditionType.DISCORD_JOIN

            return (
              <ConditionCard
                key={condition.id}
                condition={condition}
                onAction={
                  condition.type !== ConditionType.BAPPS_COMPLETED
                    ? () => handleConditionAction(condition.type)
                    : undefined
                }
                isLoading={isTwitter ? isTwitterAuthenticating : isDiscord ? isDiscordAuthenticating : false}
                error={isTwitter ? twitterError : isDiscord ? discordError : null}
              />
            )
          })}
        </Flex>
      </Section>

      {/* NFT Claim Section */}
      {(progress?.isEligibleForNFT || progress?.nftMinted) && (
        <NFTClaimSection isEligible={progress.isEligibleForNFT} walletAddress={account.address} />
      )}

      {/* How it Works */}
      <Section>
        <SectionTitle>How it Works</SectionTitle>
        <Flex gap="$spacing12">
          <Text variant="body2" color="$neutral2">
            1. Complete all 3 swap tasks in the Citrea ₿apps Campaign
          </Text>
          <Text variant="body2" color="$neutral2">
            2. Follow @JuiceSwap on X (Twitter)
          </Text>
          <Text variant="body2" color="$neutral2">
            3. Join the JuiceSwap Discord community
          </Text>
          <Text variant="body2" color="$neutral2">
            4. Claim your exclusive First Squeezer NFT (limited supply!)
          </Text>
        </Flex>
      </Section>
    </ContentContainer>
  )
}
