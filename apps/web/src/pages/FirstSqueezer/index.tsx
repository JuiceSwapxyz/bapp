import { useAccount } from 'hooks/useAccount'
import FirstSqueezerContent from 'pages/FirstSqueezer/FirstSqueezerContent'
import { Flex, Text, styled } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

const PageContainer = styled(Flex, {
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '$surface1',
  paddingTop: '$spacing20',
  paddingBottom: '$spacing60',
  paddingHorizontal: '$spacing20',
})

const ContentWrapper = styled(Flex, {
  maxWidth: 1200,
  width: '100%',
  alignSelf: 'center',
  gap: '$spacing32',
})

const HeaderSection = styled(Flex, {
  gap: '$spacing16',
  alignItems: 'center',
  paddingBottom: '$spacing24',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
})

const TitleSection = styled(Flex, {
  gap: '$spacing12',
  flex: 1,
  minWidth: 0,
  alignItems: 'center',
})

const NFTIcon = styled(Text, {
  fontSize: 48,
  lineHeight: 48,
})

const MainTitle = styled(Text, {
  variant: 'heading2',
  color: '$neutral1',
  fontWeight: 'bold',
})

const Subtitle = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
  maxWidth: 600,
})

export default function FirstSqueezer() {
  const account = useAccount()

  return (
    <Trace logImpression page={InterfacePageName.LandingPage}>
      <PageContainer>
        <ContentWrapper>
          <HeaderSection>
            <TitleSection>
              <Flex row gap="$spacing16" alignItems="center">
                <NFTIcon>🍋</NFTIcon>
                <Flex gap="$spacing8">
                  <MainTitle>First Squeezer NFT</MainTitle>
                  <Subtitle>
                    Complete 3 simple tasks to earn your exclusive First Squeezer NFT on Citrea Testnet
                  </Subtitle>
                </Flex>
              </Flex>
            </TitleSection>
          </HeaderSection>

          <FirstSqueezerContent account={account} />
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
