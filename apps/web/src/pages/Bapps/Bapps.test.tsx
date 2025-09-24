import { render } from '@testing-library/react'
import Bapps from 'pages/Bapps'
import { MemoryRouter } from 'react-router'

// Mock hooks
jest.mock('hooks/useAccount', () => ({
  useAccount: () => ({
    address: undefined,
    isConnected: false,
  }),
}))

jest.mock('@web3-react/core', () => ({
  useWeb3React: () => ({
    connector: {
      deactivate: jest.fn(),
      resetState: jest.fn(),
    },
  }),
}))

jest.mock('components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: () => ({
    open: jest.fn(),
    isOpen: false,
  }),
}))

// Mock telemetry
jest.mock('uniswap/src/features/telemetry/Trace', () => {
  return function MockTrace({ children }: { children: React.ReactNode }) {
    return <div data-testid="trace">{children}</div>
  }
})

describe('Bapps Page', () => {
  it('renders the page title and description', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Bapps />
      </MemoryRouter>,
    )

    expect(getByText('Citrea ₿Apps Campaign')).toBeTruthy()
    expect(getByText('Complete swap tasks on Citrea Testnet to participate in the bApps campaign')).toBeTruthy()
  })

  it('renders the external link button', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Bapps />
      </MemoryRouter>,
    )

    expect(getByText('Visit bApps.citrea.xyz')).toBeTruthy()
  })

  it('renders connect wallet prompt when not connected', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Bapps />
      </MemoryRouter>,
    )

    expect(getByText('Connect Your Wallet')).toBeTruthy()
    expect(getByText('Connect Wallet')).toBeTruthy()
  })
})
