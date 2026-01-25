import { useTranslation } from 'react-i18next'
import { Flex, Text, styled } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'

import { DataTable } from 'pages/Juice/components/DataTable'
import { SectionHeader } from 'pages/Juice/components/SectionHeader'

const Section = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing32',
  paddingVertical: '$spacing32',
})

const SubSection = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing16',
})

const CodeBlock = styled(Flex, {
  padding: '$spacing16',
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
})

const AddressLink = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  cursor: 'pointer',

  hoverStyle: {
    opacity: 0.8,
  },
})

const EXPLORER_BASE = 'https://explorer.testnet.citrea.xyz/address/'

function ContractAddress({ address }: { address: string }) {
  const handleClick = () => {
    window.open(`${EXPLORER_BASE}${address}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <AddressLink onPress={handleClick}>
      <Text variant="body3" color="$accent1" fontFamily="monospace">
        {address.slice(0, 10)}...{address.slice(-8)}
      </Text>
      <ExternalLink size="$icon.12" color="$accent1" />
    </AddressLink>
  )
}

export function TechDetails() {
  const { t } = useTranslation()

  const chainHeaders = ['Property', 'Value']
  const chainRows = [
    ['Network', 'Citrea (Bitcoin L2)'],
    ['Chain ID', '5115'],
    ['Status', 'Testnet'],
    ['Consensus', 'Bitcoin-secured'],
  ]

  const tokenHeaders = ['Property', 'Value']
  const tokenRows = [
    ['Name', 'JuiceDollar'],
    ['Symbol', 'JUSD'],
    ['Decimals', '18'],
    ['Standard', 'ERC-20 + ERC-2612 (Permit) + ERC-3009'],
    ['Peg', 'US Dollar (soft peg)'],
    ['Supply', 'Dynamic (Minting/Burning)'],
  ]

  const contracts = [
    { name: 'JUSD', address: '0xFdB0a83d94CD65151148a131167Eb499Cb85d015', desc: 'Main Stablecoin Token' },
    { name: 'JUICE (Equity)', address: '0x7b2A560bf72B0Dd2EAbE3271F829C2597c8420d5', desc: 'Governance & Pool Shares' },
    { name: 'svJUSD', address: '0x9580498224551E3f2e3A04330a684BF025111C53', desc: 'ERC-4626 Savings Vault' },
    { name: 'MintingHubGateway', address: '0x372368ca530B4d55622c24E28F0347e26caDc64A', desc: 'Position Management' },
    { name: 'PositionFactory', address: '0xB22a0701237a226d17aE0C4FE8263Edf5Be5f20d', desc: 'Position Creation' },
    { name: 'PositionRoller', address: '0x09d24251654e5B89d5fcd35d087f0CB4163471aC', desc: 'Position Rollover' },
    { name: 'SavingsGateway', address: '0xbfE44EE0471D0cF4759B97A458240f26c2D340Ca', desc: 'Savings with Rewards' },
    { name: 'FrontendGateway', address: '0x3EB394f950abf90aC78127C0f4c78545E0eD3DFe', desc: 'Frontend Rewards' },
    { name: 'StartUSD Bridge', address: '0x25F8599Be1D25501212b20bD72DF1caA97b496b1', desc: 'Bootstrap Bridge' },
    { name: 'StartUSD', address: '0xDFa3153E1eDa84F966BD01bc4C6D9A4FF36AcAeA', desc: 'Genesis Stablecoin' },
  ]

  const constantsHeaders = ['Constant', 'Value', 'Description']
  const constantsRows = [
    ['MIN_APPLICATION_PERIOD', '14 days', 'Minimum time for new minters'],
    ['MIN_APPLICATION_FEE', '1,000 JUSD', 'Minimum proposal fee'],
    ['CHALLENGER_REWARD', '2%', 'Reward for successful liquidations'],
    ['RESERVE_RATIO', '~20%', 'Typical reserve held for positions'],
    ['EMERGENCY_QUORUM', '10%', 'Voting power needed to stop a bridge'],
  ]

  return (
    <Section id="tech-details">
      <SectionHeader title={t('jusd.tech.title')} />

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.tech.chain.title')}
        </Text>
        <DataTable headers={chainHeaders} rows={chainRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.tech.token.title')}
        </Text>
        <DataTable headers={tokenHeaders} rows={tokenRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.tech.contracts.title')} (Testnet)
        </Text>
        <Flex flexDirection="column" gap="$spacing8">
          {contracts.map((contract) => (
            <Flex
              key={contract.address}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              padding="$spacing12"
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              flexWrap="wrap"
              gap="$spacing8"
            >
              <Flex flexDirection="column" gap="$spacing2">
                <Text variant="body2" color="$neutral1" fontWeight="600">
                  {contract.name}
                </Text>
                <Text variant="body3" color="$neutral2">
                  {contract.desc}
                </Text>
              </Flex>
              <ContractAddress address={contract.address} />
            </Flex>
          ))}
        </Flex>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Key Functions
        </Text>
        <CodeBlock>
          <Flex flexDirection="column" gap="$spacing12">
            <Flex flexDirection="column" gap="$spacing4">
              {/* eslint-disable-next-line react/jsx-no-comment-textnodes */}
              <Text variant="body3" color="$accent1" fontFamily="monospace">
                // Stablecoin Bridge
              </Text>
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                function mint(uint256 amount) external
              </Text>
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                function burn(uint256 amount) external
              </Text>
            </Flex>
            <Flex flexDirection="column" gap="$spacing4">
              {/* eslint-disable-next-line react/jsx-no-comment-textnodes */}
              <Text variant="body3" color="$accent1" fontFamily="monospace">
                // Collateralized Minting
              </Text>
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                function clone(address position, uint256 amount, ...) external
              </Text>
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                function repay(uint256 amount) external
              </Text>
            </Flex>
            <Flex flexDirection="column" gap="$spacing4">
              {/* eslint-disable-next-line react/jsx-no-comment-textnodes */}
              <Text variant="body3" color="$accent1" fontFamily="monospace">
                // Savings
              </Text>
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                function save(uint192 amount) external
              </Text>
              <Text variant="body3" color="$neutral2" fontFamily="monospace">
                function withdraw(address target, uint192 amount) external
              </Text>
            </Flex>
          </Flex>
        </CodeBlock>
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Protocol Constants
        </Text>
        <DataTable headers={constantsHeaders} rows={constantsRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Security Features
        </Text>
        <Flex flexDirection="column" gap="$spacing12">
          <Flex flexDirection="column" gap="$spacing4">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              Immutability
            </Text>
            <Text variant="body2" color="$neutral2">
              No admin keys, no upgradeable proxies, code is law.
            </Text>
          </Flex>
          <Flex flexDirection="column" gap="$spacing4">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              Oracle-Free Design
            </Text>
            <Text variant="body2" color="$neutral2">
              Dutch auctions determine fair prices - no reliance on external price feeds.
            </Text>
          </Flex>
          <Flex flexDirection="column" gap="$spacing4">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              Reserve System
            </Text>
            <Text variant="body2" color="$neutral2">
              Three layers of protection: borrower reserve, equity pool, general borrower pool.
            </Text>
          </Flex>
          <Flex flexDirection="column" gap="$spacing4">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              Governance Timelocks
            </Text>
            <Text variant="body2" color="$neutral2">
              7-14 day delays for critical changes, 2% minority veto protection.
            </Text>
          </Flex>
        </Flex>
      </SubSection>
    </Section>
  )
}
