import { Flex, styled } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

import { FAQ } from 'pages/Juice/sections/FAQ'
import { Governance } from 'pages/Juice/sections/Governance'
import { Hero } from 'pages/Juice/sections/Hero'
import { Overview } from 'pages/Juice/sections/Overview'
import { RisksEconomics } from 'pages/Juice/sections/RisksEconomics'
import { TechDetails } from 'pages/Juice/sections/TechDetails'
import { Tokenomics } from 'pages/Juice/sections/Tokenomics'
import { UseCases } from 'pages/Juice/sections/UseCases'

const PageContainer = styled(Flex, {
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '$surface1',
  paddingBottom: '$spacing60',
})

const ContentWrapper = styled(Flex, {
  maxWidth: 1200,
  width: '100%',
  alignSelf: 'center',
  paddingHorizontal: '$spacing20',
})

export default function JuicePage() {
  return (
    <Trace logImpression page={InterfacePageName.JuicePage}>
      <PageContainer>
        <ContentWrapper>
          <Hero />
          <Overview />
          <Tokenomics />
          <Governance />
          <UseCases />
          <RisksEconomics />
          <TechDetails />
          <FAQ />
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
