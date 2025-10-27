import styled from 'lib/styled-components'
import { Body } from 'pages/App/Body'
import { Header } from 'pages/App/Header'
import { GRID_AREAS } from 'pages/App/utils/shared'
import { Footer } from 'pages/Landing/sections/Footer'
import { breakpoints } from 'ui/src/theme'

const AppContainer = styled.div`
  min-height: 100vh;
  max-width: 100vw;

  // grid container settings
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: '${GRID_AREAS.HEADER}' '${GRID_AREAS.MAIN}' 'footer';
`
const AppBody = styled.div`
  grid-area: ${GRID_AREAS.MAIN};
  width: 100vw;
  min-height: 100%;
  max-width: ${({ theme }) => `${theme.maxWidth}px`};
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  flex: 1;
  position: relative;
  margin: auto;

  @media screen and (max-width: ${breakpoints.md}px) {
    padding-left: 10px;
    padding-right: 10px;
  }
`

const FooterContainer = styled.div`
  grid-area: footer;
  width: 100%;
  display: flex;
  justify-content: center;
  background: ${({ theme }) => theme.surface1};
`

export function AppLayout() {
  return (
    <AppContainer>
      <Header />
      <AppBody>
        <Body />
      </AppBody>
      <FooterContainer>
        <Footer />
      </FooterContainer>
    </AppContainer>
  )
}
