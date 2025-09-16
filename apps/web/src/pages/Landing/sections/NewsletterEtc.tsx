import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Flex, Text, styled } from 'ui/src'
import { ArrowUpRight } from 'ui/src/components/icons/ArrowUpRight'
import { BookOpen } from 'ui/src/components/icons/BookOpen'
import { HelpCenter } from 'ui/src/components/icons/HelpCenter'
import { SpeechBubbles } from 'ui/src/components/icons/SpeechBubbles'
import { uniswapUrls } from 'uniswap/src/constants/urls'

const SectionLayout = styled(Flex, {
  width: '100%',
  maxWidth: 1360,
  alignItems: 'center',
  gap: 40,
  p: 40,

  $lg: {
    p: 48,
  },

  $sm: {
    p: 24,
  },
})

const RowContent = React.memo(function RowContent({
  icon,
  title,
  description,
  showArrow,
}: {
  icon: React.ReactNode
  title: string
  description: string | React.ReactNode
  showArrow: boolean
}) {
  return (
    <Flex
      row
      py="$gap32"
      borderTopWidth={1}
      borderTopColor="$surface3"
      alignItems="center"
      width="100%"
      $lg={{ alignItems: 'flex-start' }}
    >
      <Flex row gap="$gap24" alignItems="center" flex={1} $lg={{ alignItems: 'flex-start', gap: '$gap16' }}>
        <Flex flexShrink={0}>{icon}</Flex>
        <Flex row alignItems="center" flex={1} gap="$gap16" $lg={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Text
            variant="heading2"
            minWidth={220}
            $xl={{ minWidth: 180 }}
            $lg={{ flexBasis: 0 }}
            $md={{ variant: 'heading3', lineHeight: 36 }}
          >
            {title}
          </Text>
          <Text variant="heading3" $lg={{ ml: -48 }} $md={{ fontSize: 18, lineHeight: 24 }}>
            {description}
          </Text>
        </Flex>
      </Flex>
      {showArrow && (
        <Flex flexShrink={0}>
          <ArrowUpRight size="$icon.36" color="$neutral1" />
        </Flex>
      )}
    </Flex>
  )
})

RowContent.displayName = 'RowContent'

function UniverseRow({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string | React.ReactNode
  href?: string
}) {
  const showArrow = Boolean(href)

  if (href) {
    return (
      <Anchor
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        textDecorationLine="none"
        {...ClickableTamaguiStyle}
      >
        <RowContent icon={icon} title={title} description={description} showArrow={showArrow} />
      </Anchor>
    )
  }

  return <RowContent icon={icon} title={title} description={description} showArrow={showArrow} />
}

const SocialLink = styled(Anchor, {
  fontSize: 'inherit',
  lineHeight: 'inherit',
  fontWeight: 'inherit',
  color: '$neutral2',
  target: '_blank',
  rel: 'noopener noreferrer',
  ...ClickableTamaguiStyle,
  style: {
    textDecoration: 'none',
  },
})

interface FAQItemProps {
  question: string
  answer: string | React.ReactNode
  isInitiallyOpen?: boolean
  id: string
}

function CollapsibleFAQItem({ question, answer, isInitiallyOpen = false, id }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen)

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '')
      console.log('Checking hash:', hash, 'for FAQ id:', id)
      if (hash === id) {
        console.log('Hash matches! Opening FAQ:', id)
        setIsOpen(true)
        // Scroll to this FAQ item after a delay to ensure it's rendered
        setTimeout(() => {
          const element = document.getElementById(id)
          console.log('Found element:', element)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 500)
      }
    }

    // Check immediately
    checkHash()
    
    // Also listen for hash changes
    window.addEventListener('hashchange', checkHash)
    
    return () => {
      window.removeEventListener('hashchange', checkHash)
    }
  }, [id])

  return (
    <Flex id={id}>
      <Text
        variant="heading3"
        $md={{ fontSize: 18, lineHeight: 24 }}
        onPress={() => setIsOpen(!isOpen)}
        {...ClickableTamaguiStyle}
      >
        {question}
      </Text>
      {isOpen && (
        <Flex pt="$gap8">
          <Text variant="heading3" $md={{ fontSize: 18, lineHeight: 24 }} color="$neutral2">
            {answer}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

function FAQList() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const faqs = [
    {
      id: 'Is_there_a_juice_Token',
      question: t('faq.juiceToken.question'),
      answer: t('faq.juiceToken.answer'),
    },
    {
      id: 'When_will_new_questions_be_added_to_the_FAQ',
      question: t('faq.newQuestions.question'),
      answer: t('faq.newQuestions.answer'),
    },
  ]

  useEffect(() => {
    const faqParam = searchParams.get('faq')
    console.log('FAQ List mounted, checking faq param:', faqParam)
    if (faqParam) {
      let attempts = 0
      const maxAttempts = 10
      
      const scrollToFAQ = () => {
        attempts++
        const element = document.getElementById(faqParam)
        console.log(`Attempt ${attempts}: Looking for element with ID:`, faqParam, 'Found:', element)
        
        if (element) {
          // Get the element's position relative to the document
          const rect = element.getBoundingClientRect()
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const elementTop = rect.top + scrollTop
          const offsetPosition = elementTop - 100 // 100px offset from top
          
          console.log('Element rect:', rect, 'ScrollTop:', scrollTop, 'ElementTop:', elementTop, 'Will scroll to:', offsetPosition)
          
          // Force immediate scroll first, then smooth scroll
          window.scrollTo(0, offsetPosition)
          
          setTimeout(() => {
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            })
          }, 100)
        } else if (attempts < maxAttempts) {
          // If element not found and we haven't exceeded max attempts, try again
          console.log(`Element not found, retrying in 200ms (attempt ${attempts}/${maxAttempts})`)
          setTimeout(scrollToFAQ, 200)
        } else {
          console.log('Max attempts reached, element not found')
        }
      }
      
      // Multiple attempts with different delays to catch page at different loading stages
      setTimeout(scrollToFAQ, 1000)   // First try after 1 second
      setTimeout(scrollToFAQ, 2500)   // Second try after 2.5 seconds  
      setTimeout(scrollToFAQ, 4000)   // Third try after 4 seconds
      
      // Also try when page is fully loaded
      if (document.readyState === 'complete') {
        setTimeout(scrollToFAQ, 500)
      } else {
        window.addEventListener('load', () => {
          setTimeout(scrollToFAQ, 500)
        }, { once: true })
      }
    }
  }, [searchParams])

  return (
    <Flex>
      {faqs.map((faq, index) => {
        const faqParam = searchParams.get('faq')
        const isInitiallyOpen = faqParam === faq.id
        console.log('FAQ item:', faq.id, 'FAQ param:', faqParam, 'Initially open:', isInitiallyOpen)
        
        return (
          <Flex key={faq.id}>
            <CollapsibleFAQItem
              id={faq.id}
              question={faq.question}
              answer={faq.answer}
              isInitiallyOpen={isInitiallyOpen}
            />
            {index < faqs.length - 1 && <Flex borderTopWidth={1} borderTopColor="$surface3" my="$gap12" />}
          </Flex>
        )
      })}
    </Flex>
  )
}

export function NewsletterEtc() {
  const { t } = useTranslation()

  return (
    <SectionLayout>
      <Text variant="heading1" width="100%" $md={{ variant: 'heading2' }}>
        {t('landing.exploreUniverse')}
      </Text>
      <Flex width="100%">
        {/* <UniverseRow
          icon={<GraduationCap size="$icon.36" fill="$neutral1" />}
          title={t('common.helpCenter')}
          description={t('landing.helpCenter.body')}
          href={uniswapUrls.helpCenterUrl}
        /> */}
        <UniverseRow
          icon={<BookOpen size="$icon.36" fill="$neutral1" />}
          title={t('common.docs')}
          description={t('landing.docs.description')}
          href={uniswapUrls.docsUrl}
        />
        <UniverseRow
          icon={<SpeechBubbles size="$icon.36" color="$neutral1" />}
          title={t('common.socials')}
          description={
            <Trans
              i18nKey="landing.socials"
              components={{
                LinkX: <SocialLink href={uniswapUrls.social.x} />,
                LinkTelegram: <SocialLink href={uniswapUrls.social.telegram} />,
              }}
            />
          }
        />
        <UniverseRow
          icon={<HelpCenter size="$icon.36" fill="$neutral1" />}
          title={t('common.faq')}
          description={<FAQList />}
        />
      </Flex>
    </SectionLayout>
  )
}
