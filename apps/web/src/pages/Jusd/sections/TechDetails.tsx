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

  const chainHeaders = [t('jusd.tech.table.property'), t('jusd.tech.table.value')]
  const chainRows = [
    [t('jusd.tech.chain.network'), t('jusd.tech.chain.network.value')],
    [t('jusd.tech.chain.chainId'), t('jusd.tech.chain.chainId.value')],
    [t('jusd.tech.chain.status'), t('jusd.tech.chain.status.value')],
    [t('jusd.tech.chain.consensus'), t('jusd.tech.chain.consensus.value')],
  ]

  const tokenHeaders = [t('jusd.tech.table.property'), t('jusd.tech.table.value')]
  const tokenRows = [
    [t('jusd.tech.token.name'), t('jusd.tech.token.name.value')],
    [t('jusd.tech.token.symbol'), t('jusd.tech.token.symbol.value')],
    [t('jusd.tech.token.decimals'), t('jusd.tech.token.decimals.value')],
    [t('jusd.tech.token.standard'), t('jusd.tech.token.standard.value')],
    [t('jusd.tech.token.peg'), t('jusd.tech.token.peg.value')],
    [t('jusd.tech.token.supply'), t('jusd.tech.token.supply.value')],
  ]

  const contracts = [
    { name: 'JUSD', address: '0xFdB0a83d94CD65151148a131167Eb499Cb85d015', desc: t('jusd.tech.contracts.jusd.desc') },
    {
      name: 'JUICE (Equity)',
      address: '0x7b2A560bf72B0Dd2EAbE3271F829C2597c8420d5',
      desc: t('jusd.tech.contracts.juice.desc'),
    },
    {
      name: 'svJUSD',
      address: '0x9580498224551E3f2e3A04330a684BF025111C53',
      desc: t('jusd.tech.contracts.svjusd.desc'),
    },
    {
      name: 'MintingHubGateway',
      address: '0x372368ca530B4d55622c24E28F0347e26caDc64A',
      desc: t('jusd.tech.contracts.mintingHub.desc'),
    },
    {
      name: 'PositionFactory',
      address: '0xB22a0701237a226d17aE0C4FE8263Edf5Be5f20d',
      desc: t('jusd.tech.contracts.positionFactory.desc'),
    },
    {
      name: 'PositionRoller',
      address: '0x09d24251654e5B89d5fcd35d087f0CB4163471aC',
      desc: t('jusd.tech.contracts.positionRoller.desc'),
    },
    {
      name: 'SavingsGateway',
      address: '0xbfE44EE0471D0cF4759B97A458240f26c2D340Ca',
      desc: t('jusd.tech.contracts.savingsGateway.desc'),
    },
    {
      name: 'FrontendGateway',
      address: '0x3EB394f950abf90aC78127C0f4c78545E0eD3DFe',
      desc: t('jusd.tech.contracts.frontendGateway.desc'),
    },
    {
      name: 'StartUSD Bridge',
      address: '0x25F8599Be1D25501212b20bD72DF1caA97b496b1',
      desc: t('jusd.tech.contracts.startUsdBridge.desc'),
    },
    {
      name: 'StartUSD',
      address: '0xDFa3153E1eDa84F966BD01bc4C6D9A4FF36AcAeA',
      desc: t('jusd.tech.contracts.startUsd.desc'),
    },
  ]

  const constantsHeaders = [
    t('jusd.tech.constants.table.constant'),
    t('jusd.tech.constants.table.value'),
    t('jusd.tech.constants.table.description'),
  ]
  const constantsRows = [
    [
      t('jusd.tech.constants.minApplicationPeriod'),
      t('jusd.tech.constants.minApplicationPeriod.value'),
      t('jusd.tech.constants.minApplicationPeriod.desc'),
    ],
    [
      t('jusd.tech.constants.minApplicationFee'),
      t('jusd.tech.constants.minApplicationFee.value'),
      t('jusd.tech.constants.minApplicationFee.desc'),
    ],
    [
      t('jusd.tech.constants.challengerReward'),
      t('jusd.tech.constants.challengerReward.value'),
      t('jusd.tech.constants.challengerReward.desc'),
    ],
    [
      t('jusd.tech.constants.reserveRatio'),
      t('jusd.tech.constants.reserveRatio.value'),
      t('jusd.tech.constants.reserveRatio.desc'),
    ],
    [
      t('jusd.tech.constants.emergencyQuorum'),
      t('jusd.tech.constants.emergencyQuorum.value'),
      t('jusd.tech.constants.emergencyQuorum.desc'),
    ],
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
          {t('jusd.tech.functions.title')}
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
          {t('jusd.tech.constants.title')}
        </Text>
        <DataTable headers={constantsHeaders} rows={constantsRows} />
      </SubSection>

      <SubSection>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          {t('jusd.tech.security.title')}
        </Text>
        <Flex flexDirection="column" gap="$spacing12">
          <Flex flexDirection="column" gap="$spacing4">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              {t('jusd.tech.security.immutability')}
            </Text>
            <Text variant="body2" color="$neutral2">
              {t('jusd.tech.security.immutability.desc')}
            </Text>
          </Flex>
          <Flex flexDirection="column" gap="$spacing4">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              {t('jusd.tech.security.oracleFree')}
            </Text>
            <Text variant="body2" color="$neutral2">
              {t('jusd.tech.security.oracleFree.desc')}
            </Text>
          </Flex>
          <Flex flexDirection="column" gap="$spacing4">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              {t('jusd.tech.security.reserve')}
            </Text>
            <Text variant="body2" color="$neutral2">
              {t('jusd.tech.security.reserve.desc')}
            </Text>
          </Flex>
          <Flex flexDirection="column" gap="$spacing4">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              {t('jusd.tech.security.timelocks')}
            </Text>
            <Text variant="body2" color="$neutral2">
              {t('jusd.tech.security.timelocks.desc')}
            </Text>
          </Flex>
        </Flex>
      </SubSection>
    </Section>
  )
}
