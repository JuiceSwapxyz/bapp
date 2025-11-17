import { render } from '@testing-library/react'
import Bapps from 'pages/Bapps'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'

// Mock hooks
vi.mock('hooks/useAccount', () => ({
  useAccount: () => ({
    address: undefined,
    isConnected: false,
  }),
}))

vi.mock('@web3-react/core', () => ({
  useWeb3React: () => ({
    connector: {
      deactivate: vi.fn(),
      resetState: vi.fn(),
    },
  }),
}))

vi.mock('components/AccountDrawer/MiniPortfolio/hooks', () => ({
  useAccountDrawer: () => ({
    open: vi.fn(),
    isOpen: false,
  }),
}))

// Mock telemetry
vi.mock('uniswap/src/features/telemetry/Trace', () => {
  return {
    default: function MockTrace({ children }: { children: React.ReactNode }) {
      return <div data-testid="trace">{children}</div>
    },
  }
})

// Mock campaign progress query
vi.mock('uniswap/src/data/apiClients/ponderApi/PonderApi', () => ({
  useCampaignProgressQuery: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}))

describe('Bapps Page', () => {
  it('renders the page title and description', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Bapps />
      </MemoryRouter>,
    )

    expect(getByText('Citrea ₿apps Campaign')).toBeTruthy()
    expect(getByText('Complete swap tasks on Citrea Testnet to participate in the ₿apps campaign')).toBeTruthy()
  })

  it('renders the external link button', () => {
    const { getByText } = render(
      <MemoryRouter>
        <Bapps />
      </MemoryRouter>,
    )

    expect(getByText('Visit ₿apps.citrea.xyz')).toBeTruthy()
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
