import { Flex, styled } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

import { FAQ } from 'pages/Jusd/sections/FAQ'
import { Hero } from 'pages/Jusd/sections/Hero'
import { HowItWorks } from 'pages/Jusd/sections/HowItWorks'
import { Overview } from 'pages/Jusd/sections/Overview'
import { Savings } from 'pages/Jusd/sections/Savings'
import { TechDetails } from 'pages/Jusd/sections/TechDetails'
import { UseCases } from 'pages/Jusd/sections/UseCases'

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

export default function JusdPage() {
  return (
    <Trace logImpression page={InterfacePageName.JusdPage}>
      <PageContainer>
        <ContentWrapper>
          <Hero />
          <Overview />
          <HowItWorks />
          <UseCases />
          <Savings />
          <TechDetails />
          <FAQ />
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
