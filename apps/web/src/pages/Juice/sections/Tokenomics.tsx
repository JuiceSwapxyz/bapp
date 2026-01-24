import { useTranslation } from 'react-i18next'
import { Flex, Text, styled } from 'ui/src'

import { InfoBox } from '../components/InfoBox'
import { MetricCard } from '../components/MetricCard'
import { SectionHeader } from '../components/SectionHeader'

const Section = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing32',
  paddingVertical: '$spacing32',
})

const MetricsContainer = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing16',
  flexWrap: 'wrap',
  justifyContent: 'center',
})

const ExplanationBox = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing24',
  padding: '$spacing24',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
})

const ExplanationItem = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing8',
})

const CodeBlock = styled(Flex, {
  padding: '$spacing16',
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
})

export function Tokenomics() {
  const { t } = useTranslation()

  return (
    <Section id="tokenomics">
      <SectionHeader title={t('juice.tokenomics.title')} subtitle={t('juice.tokenomics.description')} />

      <MetricsContainer>
        <MetricCard value="10x" label={t('juice.tokenomics.valuationFactor.label')} />
        <MetricCard value="2%" label={t('juice.tokenomics.fee.label')} />
        <MetricCard value="1,000" label={t('juice.tokenomics.proposalFee.label')} />
        <MetricCard value="2%" label={t('juice.tokenomics.vetoQuorum.label')} />
      </MetricsContainer>

      <ExplanationBox>
        <ExplanationItem>
          <Text variant="subheading1" color="$neutral1" fontWeight="bold">
            Valuation Factor (10x)
          </Text>
          <Text variant="body2" color="$neutral2">
            {t('juice.tokenomics.valuationFactor.description')} This means 1M JUSD in equity = 10M JUSD market cap for
            JUICE.
          </Text>
          <CodeBlock>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              JUICE Price = (10 x Equity x 10^18) / Total Supply
            </Text>
          </CodeBlock>
        </ExplanationItem>

        <ExplanationItem>
          <Text variant="subheading1" color="$neutral1" fontWeight="bold">
            Investment/Redemption Fee (2%)
          </Text>
          <Text variant="body2" color="$neutral2">
            {t('juice.tokenomics.fee.description')} This fee discourages short-term speculation.
          </Text>
          <CodeBlock>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              Formula: (amount * 980) / 1000 (2% deducted)
            </Text>
          </CodeBlock>
        </ExplanationItem>

        <ExplanationItem>
          <Text variant="subheading1" color="$neutral1" fontWeight="bold">
            Proposal Fee (1,000 JUSD)
          </Text>
          <Text variant="body2" color="$neutral2">
            {t('juice.tokenomics.proposalFee.description')} This prevents spam proposals and benefits existing JUICE
            holders.
          </Text>
        </ExplanationItem>

        <ExplanationItem>
          <Text variant="subheading1" color="$neutral1" fontWeight="bold">
            {t('juice.tokenomics.flashLoanProtection.label')}
          </Text>
          <Text variant="body2" color="$neutral2">
            {t('juice.tokenomics.flashLoanProtection.description')}
          </Text>
          <InfoBox type="info">
            Implemented via `notSameBlock` modifier in Equity.sol - tracks when tokens were received via
            `lastInboundBlock`.
          </InfoBox>
        </ExplanationItem>
      </ExplanationBox>

      <ExplanationBox>
        <Text variant="subheading1" color="$neutral1" fontWeight="bold">
          Supply Model
        </Text>
        <Text variant="body2" color="$neutral2">
          JUICE has no maximum supply cap. New tokens are minted when users invest JUSD and burned when users redeem for
          JUSD. Supply naturally adjusts based on demand.
        </Text>
        <CodeBlock>
          <Flex flexDirection="column" gap="$spacing8">
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              New Shares = Total Shares x (1 + (Investment - Fees) / (Capital - Investment))^(1/10)
            </Text>
            <Text variant="body3" color="$neutral2" fontFamily="monospace">
              Redemption = Capital x (1 - (Shares - Fees) / Total Shares)^10
            </Text>
          </Flex>
        </CodeBlock>
      </ExplanationBox>
    </Section>
  )
}
