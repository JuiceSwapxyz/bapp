import { useBondingCurveToken } from 'hooks/useBondingCurveToken'
import { useLaunchpadTokenPrice } from 'hooks/useLaunchpadTokenPrice'
import { type LaunchpadToken } from 'hooks/useLaunchpadTokens'
import { TokenLogo } from 'pages/Launchpad/components/TokenLogo'
import {
  GraduatedBadge,
  PrimaryButton,
  ProgressBar,
  ProgressFill,
  SecondaryButton,
  getProgressGradient,
} from 'pages/Launchpad/components/shared'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { Flex, Text, styled } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { formatUnits } from 'viem'

const Panel = styled(Flex, {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '$rounded24',
  borderWidth: 1,
  borderColor: '$surface3',
  backgroundColor: '$surface2',
  padding: '$spacing24',
  gap: '$spacing20',
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  // warm citrus wash so the featured token reads as the page's centrepiece
  '$platform-web': {
    background:
      'radial-gradient(120% 140% at 0% 0%, rgba(247,145,26,0.10) 0%, rgba(255,179,71,0.03) 38%, rgba(255,255,255,0) 70%)',
  },
})

const Eyebrow = styled(Text, {
  variant: 'body4',
  color: '$accent1',
  fontWeight: '700',
  letterSpacing: 1.2,
})

const TokenTitle = styled(Text, {
  variant: 'heading3',
  color: '$neutral1',
  fontWeight: '700',
  numberOfLines: 1,
})

const Stat = styled(Flex, {
  gap: '$spacing2',
})

const StatLabel = styled(Text, {
  variant: 'body4',
  color: '$neutral3',
})

const StatValue = styled(Text, {
  variant: 'subheading2',
  color: '$neutral1',
  fontWeight: '700',
})

interface SpotlightCardProps {
  token: LaunchpadToken
}

export function SpotlightCard({ token }: SpotlightCardProps) {
  const navigate = useNavigate()
  const chainId = token.chainId as UniverseChainId

  const { progress, reserves } = useBondingCurveToken(token.address, chainId)
  const { marketCapFormatted: marketCap } = useLaunchpadTokenPrice({
    tokenAddress: token.address,
    graduated: token.graduated,
    v2Pair: token.v2Pair ?? undefined,
    baseAsset: token.baseAsset,
    bondingCurveReserves: reserves,
    chainId,
  })

  const goToToken = useCallback(() => {
    navigate(`/launchpad/${token.address}`)
  }, [navigate, token.address])

  const volume = useMemo(() => {
    const value = Number(formatUnits(BigInt(token.totalVolumeBase), 18))
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }, [token.totalVolumeBase])

  const totalTrades = token.totalBuys + token.totalSells
  const pct = token.graduated ? 100 : progress

  return (
    <Panel>
      <TokenLogo metadataURI={token.metadataURI} symbol={token.symbol} size={84} />

      <Flex flex={1} minWidth={260} gap="$spacing12">
        <Flex flexDirection="row" alignItems="center" gap="$spacing8" flexWrap="wrap">
          <Eyebrow>TRENDING NOW</Eyebrow>
          {token.canGraduate && !token.graduated && (
            <GraduatedBadge backgroundColor="$accent2" size="sm">
              <Text variant="body4" color="$accent1" fontWeight="700">
                Graduating
              </Text>
            </GraduatedBadge>
          )}
          {token.graduated && (
            <GraduatedBadge size="sm">
              <Text variant="body4" color="$statusSuccess" fontWeight="700">
                Graduated
              </Text>
            </GraduatedBadge>
          )}
        </Flex>

        <Flex flexDirection="row" alignItems="baseline" gap="$spacing8">
          <TokenTitle>{token.name || 'Unknown Token'}</TokenTitle>
          <Text variant="subheading2" color="$neutral2">
            ${token.symbol || '???'}
          </Text>
        </Flex>

        <Flex gap="$spacing6">
          <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="body3" color="$neutral2">
              {token.graduated ? 'Graduated to JuiceSwap V2' : 'Progress to graduation'}
            </Text>
            <Text variant="body1" color={token.graduated ? '$statusSuccess' : '$accent1'} fontWeight="700">
              {pct.toFixed(1)}%
            </Text>
          </Flex>
          <ProgressBar size="lg">
            <ProgressFill size="lg" style={{ width: `${Math.min(pct, 100)}%`, background: getProgressGradient(pct) }} />
          </ProgressBar>
        </Flex>

        <Flex flexDirection="row" gap="$spacing24" flexWrap="wrap">
          <Stat>
            <StatLabel>Market cap</StatLabel>
            <StatValue>${marketCap}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Volume</StatLabel>
            <StatValue>${volume}</StatValue>
          </Stat>
          <Stat>
            <StatLabel>Trades</StatLabel>
            <StatValue>{totalTrades.toLocaleString()}</StatValue>
          </Stat>
        </Flex>
      </Flex>

      <Flex gap="$spacing8" minWidth={170} $sm={{ width: '100%' }}>
        <PrimaryButton fill onPress={goToToken}>
          <Text variant="buttonLabel2" color="$white">
            {token.graduated ? 'Trade on Swap' : 'Buy'}
          </Text>
        </PrimaryButton>
        <SecondaryButton fill onPress={goToToken}>
          <Text variant="buttonLabel2" color="$accent1">
            View token
          </Text>
        </SecondaryButton>
      </Flex>
    </Panel>
  )
}
