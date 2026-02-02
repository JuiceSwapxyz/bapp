import { useBondingCurveToken } from 'hooks/useBondingCurveToken'
import { type LaunchpadToken } from 'hooks/useLaunchpadTokens'
import { TokenLogo } from 'pages/Launchpad/components/TokenLogo'
import {
  Card,
  GraduatedBadge,
  ProgressBar,
  ProgressFill,
  StatLabel,
  StatRow,
  StatValue,
  getProgressGradient,
} from 'pages/Launchpad/components/shared'
import { formatMarketCap } from 'pages/Launchpad/utils'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Flex, Text, styled } from 'ui/src'
import { formatUnits } from 'viem'

const TokenHeader = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing12',
})

const TokenName = styled(Text, {
  variant: 'body1',
  color: '$neutral1',
  fontWeight: '600',
})

const TokenSymbol = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

const GraduatedText = styled(Text, {
  variant: 'body4',
  color: '$statusSuccess',
  fontWeight: '600',
})

interface TokenCardProps {
  token: LaunchpadToken
}

export function TokenCard({ token }: TokenCardProps) {
  const navigate = useNavigate()

  // Fetch real-time progress from contract for accurate bonding curve state
  const { progress, reserves } = useBondingCurveToken(token.address)

  const handleClick = useCallback(() => {
    navigate(`/launchpad/${token.address}`)
  }, [navigate, token.address])

  // Format volume from indexed data (uses bigint string from API)
  const volume = useMemo(() => {
    const value = Number(formatUnits(BigInt(token.totalVolumeBase), 18))
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }, [token.totalVolumeBase])

  // Calculate market cap from reserves (price × total supply)
  const marketCap = useMemo(() => formatMarketCap(reserves), [reserves])

  // Format creator address
  const creatorShort = useMemo(() => {
    return `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}`
  }, [token.creator])

  // Format time ago from indexed timestamp
  const timeAgo = useMemo(() => {
    const timestamp = Number(token.createdAt)
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp
    if (diff < 60) {
      return 'Just now'
    }
    if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`
    }
    if (diff < 86400) {
      return `${Math.floor(diff / 3600)}h ago`
    }
    return `${Math.floor(diff / 86400)}d ago`
  }, [token.createdAt])

  // Total trades from indexed data
  const totalTrades = token.totalBuys + token.totalSells

  return (
    <Card interactive graduated={token.graduated} onPress={handleClick}>
      <TokenHeader>
        <TokenLogo metadataURI={token.metadataURI} symbol={token.symbol} size={48} />
        <Flex flex={1} gap="$spacing2">
          <Flex flexDirection="row" alignItems="center" gap="$spacing8">
            <TokenName>{token.name || 'Unknown Token'}</TokenName>
            {token.canGraduate && !token.graduated && (
              <GraduatedBadge style={{ backgroundColor: '$accent2' }}>
                <GraduatedText style={{ color: '$accent1' }}>Ready!</GraduatedText>
              </GraduatedBadge>
            )}
          </Flex>
          <TokenSymbol>${token.symbol || '???'}</TokenSymbol>
        </Flex>
      </TokenHeader>

      <Flex gap="$spacing4">
        <StatRow>
          <StatLabel variant="body3">{token.graduated ? 'Graduated' : 'Progress to graduation'}</StatLabel>
          <StatValue variant="body3">{token.graduated ? '100%' : `${progress.toFixed(1)}%`}</StatValue>
        </StatRow>
        <ProgressBar>
          <ProgressFill
            style={{
              width: `${token.graduated ? 100 : Math.min(progress, 100)}%`,
              background: getProgressGradient(token.graduated ? 100 : progress),
            }}
          />
        </ProgressBar>
      </Flex>

      <StatRow>
        <StatLabel variant="body3">Market Cap</StatLabel>
        <StatValue variant="body3">{marketCap} JUSD</StatValue>
      </StatRow>

      <StatRow>
        <StatLabel variant="body3">Volume</StatLabel>
        <StatValue variant="body3">{volume} JUSD</StatValue>
      </StatRow>

      <StatRow>
        <StatLabel variant="body3">Trades</StatLabel>
        <StatValue variant="body3">{totalTrades}</StatValue>
      </StatRow>

      <StatRow>
        <StatLabel variant="body3">Creator</StatLabel>
        <StatValue variant="body3">{creatorShort}</StatValue>
      </StatRow>

      <StatRow>
        <StatLabel variant="body3">Created</StatLabel>
        <StatValue variant="body3">{timeAgo}</StatValue>
      </StatRow>
    </Card>
  )
}
