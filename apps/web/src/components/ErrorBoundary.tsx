// import { ErrorBoundary as DatadogErrorBoundary } from '@datadog/browser-rum-react' // Removed - Datadog disabled
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import styled from 'lib/styled-components'
import { Component, PropsWithChildren, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { CopyToClipboard } from 'theme/components/CopyHelper'
import { Button, Flex, TouchableArea } from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'

const Code = styled.code`
  font-weight: 485;
  font-size: 12px;
  line-height: 16px;
  word-wrap: break-word;
  width: 100%;
  color: ${({ theme }) => theme.neutral1};
  font-family: ${({ theme }) => theme.fonts.code};
  overflow: scroll;
  max-height: calc(100vh - 450px);
  -webkit-overflow-scrolling: touch;
`

const Separator = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
`

const Fallback = ({ error, eventId }: { error: Error; eventId: string | null }) => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const errorDetails = error.stack || error.message

  return (
    <Flex height="100%" width="100%" position="absolute" centered top={0} left={0} right={0} bottom={0}>
      <Flex
        gap="$gap24"
        width="100%"
        p={isMobile ? '$spacing16' : '$spacing1'}
        maxWidth={isMobile ? '100%' : 500}
        centered
      >
        <ErrorDetailsSection errorDetails={errorDetails} eventId={eventId} />
        <Flex width="100%" row gap="$gap12">
          <Flex row flexBasis={0} flexGrow={1}>
            <Button emphasis="primary" size="small" variant="branded" onPress={() => window.location.reload()}>
              {t('common.reload.label')}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

function ErrorDetailsSection({ errorDetails, eventId }: { errorDetails: string; eventId: string | null }): JSX.Element {
  const { t } = useTranslation()
  const [isExpanded, setExpanded] = useState(false)
  const isMobile = useIsMobile()

  // @todo: ThemedText components should be responsive by default
  const [Title, Description] = isMobile
    ? [ThemedText.HeadlineSmall, ThemedText.BodySmall]
    : [ThemedText.HeadlineLarge, ThemedText.BodySecondary]

  return (
    <>
      <Flex gap="$gap8">
        <Title textAlign="center">{t('common.card.error.description')}</Title>
        <Description textAlign="center" color="neutral2">
          {eventId ? t('error.request.provideId') : t('common.error.request')}
        </Description>
      </Flex>
      <Flex
        alignSelf="stretch"
        backgroundColor="$surface2"
        gap="$spacing8"
        p={isMobile ? '$spacing16' : '$spacing24'}
        borderRadius="$rounded24"
      >
        <Flex row gap="$gap16" alignItems="center" justifyContent="space-between">
          <ThemedText.SubHeader>
            {eventId ? t('error.id', { eventId }) : t('common.error.details')}
          </ThemedText.SubHeader>
          <CopyToClipboard toCopy={eventId ?? errorDetails}>
            <CopyAlt color="$neutral2" size="$icon.24" />
          </CopyToClipboard>
        </Flex>
        <Separator />
        <Flex my="spacing12" gap="$spacing8">
          <Code>{errorDetails.split('\n').slice(0, isExpanded ? undefined : 4)}</Code>
          <Separator />
        </Flex>
        <TouchableArea flexDirection="row" justifyContent="space-between" onPress={() => setExpanded((s) => !s)}>
          <ThemedText.Link color="neutral2">
            {isExpanded ? t('common.showLess.button') : t('common.showMore.button')}
          </ThemedText.Link>
          <RotatableChevron width="$icon.20" height="$icon.20" direction={isExpanded ? 'up' : 'down'} />
        </TouchableArea>
      </Flex>
    </>
  )
}

// Simple React error boundary to replace DatadogErrorBoundary
class SimpleErrorBoundary extends Component<
  PropsWithChildren & {
    fallback?: React.ComponentType<{
      error: Error
      resetError: () => void
    }>
  },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log errors to console for debugging (previously sent to Datadog)
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback ?? (({ error }) => <Fallback error={error} eventId={null} />)
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }
    return this.props.children
  }
}

export default function ErrorBoundary({
  children,
  fallback,
}: PropsWithChildren & {
  fallback?: React.ComponentType<{
    error: Error
    resetError: () => void
  }>
}): JSX.Element {
  return <SimpleErrorBoundary fallback={fallback}>{children}</SimpleErrorBoundary>
}
