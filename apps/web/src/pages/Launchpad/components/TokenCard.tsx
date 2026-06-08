import { useBondingCurveToken } from 'hooks/useBondingCurveToken'
import { useLaunchpadTokenPrice } from 'hooks/useLaunchpadTokenPrice'
import { type LaunchpadToken } from 'hooks/useLaunchpadTokens'
import { TokenLogo } from 'pages/Launchpad/components/TokenLogo'
import {
  Card,
  GraduatedBadge,
  ProgressBar,
  ProgressFill,
  StatRow,
  getProgressGradient,
} from 'pages/Launchpad/components/shared'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Flex, Text, styled } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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
  numberOfLines: 1,
})

const TokenSymbol = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
  numberOfLines: 1,
})

const Divider = styled(Flex, {
  height: 1,
  backgroundColor: '$surface3',
})

const StatLabel = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

const StatValue = styled(Text, {
  variant: 'body3',
  color: '$neutral1',
  fontWeight: '600',
})

interface TokenCardProps {
  token: LaunchpadToken
}

export function TokenCard({ token }: TokenCardProps) {
  const navigate = useNavigate()
  const chainId = token.chainId as UniverseChainId

  // Fetch real-time progress from contract for accurate bonding curve state
  const { progress, reserves } = useBondingCurveToken(token.address, chainId)

  // Use unified price hook for graduated/non-graduated tokens
  const { marketCapFormatted: marketCap } = useLaunchpadTokenPrice({
    tokenAddress: token.address,
    graduated: token.graduated,
    v2Pair: token.v2Pair ?? undefined,
    baseAsset: token.baseAsset,
    bondingCurveReserves: reserves,
    chainId,
  })

  const handleClick = useCallback(() => {
    navigate(`/launchpad/${token.address}`)
  }, [navigate, token.address])

  // Format volume from indexed data (uses bigint string from API)
  const volume = useMemo(() => {
    const value = Number(formatUnits(BigInt(token.totalVolumeBase), 18))
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }, [token.totalVolumeBase])

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

  const totalTrades = token.totalBuys + token.totalSells
  const pct = token.graduated ? 100 : progress

  return (
    <Card interactive graduated={token.graduated} onPress={handleClick} gap="$spacing16">
      <TokenHeader>
        <TokenLogo metadataURI={token.metadataURI} symbol={token.symbol} size={44} />
        <Flex flex={1} gap="$spacing2" minWidth={0}>
          <TokenName>{token.name || 'Unknown Token'}</TokenName>
          <TokenSymbol>${token.symbol || '???'}</TokenSymbol>
        </Flex>
        <Flex alignItems="flex-end" gap="$spacing2" flexShrink={0}>
          <Text variant="subheading2" color="$neutral1" fontWeight="700">
            ${marketCap}
          </Text>
          <StatLabel variant="body4" color="$neutral3">
            Market cap
          </StatLabel>
        </Flex>
      </TokenHeader>

      <Flex gap="$spacing8">
        <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
          <Flex flexDirection="row" alignItems="center" gap="$spacing6">
            <Text variant="body3" color="$neutral2">
              {token.graduated ? 'Graduated to V2' : 'Bonding curve'}
            </Text>
            {token.canGraduate && !token.graduated && (
              <GraduatedBadge backgroundColor="$accent2" size="sm">
                <Text variant="body4" color="$accent1" fontWeight="700">
                  Ready
                </Text>
              </GraduatedBadge>
            )}
          </Flex>
          <Text variant="body2" color={token.graduated ? '$statusSuccess' : '$accent1'} fontWeight="700">
            {pct.toFixed(1)}%
          </Text>
        </Flex>
        <ProgressBar size="md">
          <ProgressFill
            size="md"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: getProgressGradient(pct),
            }}
          />
        </ProgressBar>
      </Flex>

      <Divider />

      <Flex gap="$spacing8">
        <StatRow>
          <StatLabel>Volume</StatLabel>
          <StatValue>${volume}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Trades</StatLabel>
          <StatValue>{totalTrades.toLocaleString()}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Creator</StatLabel>
          <StatValue>{creatorShort}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>Created</StatLabel>
          <StatValue>{timeAgo}</StatValue>
        </StatRow>
      </Flex>
    </Card>
  )
}
