import { Flex, styled } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

import { FAQ } from './sections/FAQ'
import { Governance } from './sections/Governance'
import { Hero } from './sections/Hero'
import { Overview } from './sections/Overview'
import { RisksEconomics } from './sections/RisksEconomics'
import { TechDetails } from './sections/TechDetails'
import { Tokenomics } from './sections/Tokenomics'
import { UseCases } from './sections/UseCases'

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
