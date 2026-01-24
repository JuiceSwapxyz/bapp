import { useTranslation } from 'react-i18next'
import { Flex, styled } from 'ui/src'

import { Accordion } from '../components/Accordion'
import { SectionHeader } from '../components/SectionHeader'

const Section = styled(Flex, {
  flexDirection: 'column',
  gap: '$spacing32',
  paddingVertical: '$spacing32',
  paddingBottom: '$spacing60',
})

export function FAQ() {
  const { t } = useTranslation()

  const faqItems = [
    {
      question: t('juice.faq.howToGet.q'),
      answer: t('juice.faq.howToGet.a'),
    },
    {
      question: t('juice.faq.fees.q'),
      answer: t('juice.faq.fees.a'),
    },
    {
      question: t('juice.faq.voting.q'),
      answer: t('juice.faq.voting.a'),
    },
    {
      question: t('juice.faq.difference.q'),
      answer: t('juice.faq.difference.a'),
    },
    {
      question: t('juice.faq.risk.q'),
      answer: t('juice.faq.risk.a'),
    },
    {
      question: t('juice.faq.flashLoan.q'),
      answer: t('juice.faq.flashLoan.a'),
    },
    {
      question: 'What is the "Kamikaze" mechanism?',
      answer:
        "In extreme cases where a malicious actor accumulates significant voting power, honest holders can sacrifice their own voting power to neutralize the threat. This is a last-resort defense mechanism that destroys both the attacker's and defender's voting power.",
    },
    {
      question: 'Is JUICE on multiple chains?',
      answer:
        'Currently, JUICE is deployed on Citrea (Bitcoin L2, Chain ID: 5115) testnet. Mainnet and potential multi-chain deployments will be announced.',
    },
    {
      question: 'How is JUICE different from other governance tokens?',
      answer:
        'JUICE uses veto-based governance (not approval-based), time-weighted voting power, and directly ties token value to protocol equity. This creates stronger alignment between holders and protocol health.',
    },
    {
      question: 'Can I use JUICE directly in JuiceSwap?',
      answer:
        'JUICE cannot be used directly as swap input in JuiceSwap due to flash loan protection. To sell JUICE, you must first redeem it via JUICE.redeem() to get JUSD, then swap the JUSD. However, you CAN receive JUICE as swap output.',
    },
  ]

  return (
    <Section id="faq">
      <SectionHeader title={t('juice.faq.title')} />
      <Accordion items={faqItems} />
    </Section>
  )
}
