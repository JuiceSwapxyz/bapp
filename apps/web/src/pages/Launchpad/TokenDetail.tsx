import { useParams, useNavigate } from 'react-router'
import { useCallback, useMemo, useState } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { ModalCloseIcon } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useBondingCurveToken } from 'hooks/useBondingCurveToken'
import { useTokenInfo } from 'hooks/useTokenFactory'
import { useGraduate } from 'hooks/useLaunchpadActions'
import { BuySellPanel } from 'pages/Launchpad/components/BuySellPanel'
import { formatUnits } from 'viem'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

const PageContainer = styled(Flex, {
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '$surface1',
  paddingTop: '$spacing20',
  paddingBottom: '$spacing60',
  paddingHorizontal: '$spacing20',
})

const ContentWrapper = styled(Flex, {
  maxWidth: 1200,
  width: '100%',
  alignSelf: 'center',
  gap: '$spacing24',
})

const BackButton = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  cursor: 'pointer',
  paddingVertical: '$spacing8',
  hoverStyle: {
    opacity: 0.7,
  },
})

const HeaderSection = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: '$spacing24',
  flexWrap: 'wrap',
})

const TokenLogo = styled(Flex, {
  width: 80,
  height: 80,
  borderRadius: '$roundedFull',
  backgroundColor: '$accent2',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

const TokenInfo = styled(Flex, {
  flex: 1,
  gap: '$spacing8',
  minWidth: 200,
})

const TokenName = styled(Text, {
  variant: 'heading2',
  color: '$neutral1',
  fontWeight: 'bold',
})

const TokenSymbol = styled(Text, {
  variant: 'body1',
  color: '$neutral2',
})

const MainContent = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing24',
  flexWrap: 'wrap',
})

const LeftColumn = styled(Flex, {
  flex: 2,
  minWidth: 300,
  gap: '$spacing24',
})

const RightColumn = styled(Flex, {
  flex: 1,
  minWidth: 320,
  gap: '$spacing24',
})

const Card = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
  padding: '$spacing16',
  gap: '$spacing12',
})

const CardTitle = styled(Text, {
  variant: 'body1',
  color: '$neutral1',
  fontWeight: '600',
})

const ProgressBar = styled(Flex, {
  height: 12,
  backgroundColor: '$surface3',
  borderRadius: '$rounded8',
  overflow: 'hidden',
})

const ProgressFill = styled(Flex, {
  height: '100%',
  backgroundColor: '$accent1',
  borderRadius: '$rounded8',
})

const StatRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: '$spacing4',
})

const StatLabel = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
})

const StatValue = styled(Text, {
  variant: 'body2',
  color: '$neutral1',
  fontWeight: '500',
})

const AddressRow = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
})

const AddressLink = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing4',
  cursor: 'pointer',
  hoverStyle: {
    opacity: 0.7,
  },
})

const GraduateButton = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: '$spacing16',
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  hoverStyle: {
    backgroundColor: '$accent2',
  },
})

const GraduatedBadge = styled(Flex, {
  backgroundColor: '$statusSuccess2',
  paddingHorizontal: '$spacing12',
  paddingVertical: '$spacing6',
  borderRadius: '$rounded8',
})

export default function TokenDetail() {
  const { tokenAddress } = useParams<{ tokenAddress: string }>()
  const navigate = useNavigate()

  const {
    name,
    symbol,
    graduated,
    canGraduate,
    progress,
    reserves,
    baseAsset,
    v2Pair,
    isLoading,
  } = useBondingCurveToken(tokenAddress)

  const { tokenInfo } = useTokenInfo(tokenAddress)
  const [showBondingModal, setShowBondingModal] = useState(false)
  const [isGraduating, setIsGraduating] = useState(false)

  const graduate = useGraduate(tokenAddress)
  const addTransaction = useTransactionAdder()

  const handleBack = useCallback(() => {
    navigate('/launchpad')
  }, [navigate])

  const handleCopyAddress = useCallback(() => {
    if (tokenAddress) {
      navigator.clipboard.writeText(tokenAddress)
    }
  }, [tokenAddress])

  const handleOpenExplorer = useCallback(() => {
    if (tokenAddress) {
      const url = getExplorerLink({
        chainId: UniverseChainId.CitreaTestnet,
        data: tokenAddress,
        type: ExplorerDataType.ADDRESS,
      })
      window.open(url, '_blank')
    }
  }, [tokenAddress])

  const handleGraduate = useCallback(async () => {
    setIsGraduating(true)
    try {
      const tx = await graduate()
      addTransaction(tx, {
        type: TransactionType.Unknown,
        tokenAddress: tokenAddress as `0x${string}`,
        dappInfo: { name: `Graduated ${symbol} to JuiceSwap V2` },
      })
    } catch (error) {
      console.error('Graduate failed:', error)
    } finally {
      setIsGraduating(false)
    }
  }, [graduate, addTransaction, symbol])

  // Format values
  const liquidity = useMemo(() => {
    if (!reserves) {return '0'}
    return Number(formatUnits(reserves.realBase, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })
  }, [reserves])

  const tokensRemaining = useMemo(() => {
    if (!reserves) {return '0'}
    return Number(formatUnits(reserves.realToken, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
  }, [reserves])

  const currentPrice = useMemo(() => {
    if (!reserves || reserves.virtualToken === 0n) {return '0'}
    const price = Number(reserves.virtualBase) / Number(reserves.virtualToken)
    return price.toFixed(8)
  }, [reserves])

  const creatorShort = useMemo(() => {
    if (!tokenInfo?.creator) {return '...'}
    return `${tokenInfo.creator.slice(0, 6)}...${tokenInfo.creator.slice(-4)}`
  }, [tokenInfo])

  const createdDate = useMemo(() => {
    if (!tokenInfo?.timestamp) {return ''}
    return new Date(tokenInfo.timestamp * 1000).toLocaleDateString()
  }, [tokenInfo])

  const logoLetter = useMemo(() => {
    return symbol?.charAt(0).toUpperCase() || '?'
  }, [symbol])

  if (isLoading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <Text variant="body1" color="$neutral2">Loading token...</Text>
        </ContentWrapper>
      </PageContainer>
    )
  }

  if (!tokenAddress) {
    return (
      <PageContainer>
        <ContentWrapper>
          <Text variant="body1" color="$neutral2">Token not found</Text>
        </ContentWrapper>
      </PageContainer>
    )
  }

  return (
    <Trace logImpression page={InterfacePageName.LaunchpadTokenDetailPage}>
      <PageContainer>
        <ContentWrapper>
          <BackButton onPress={handleBack}>
            <BackArrow size="$icon.20" color="$neutral2" />
            <Text variant="body2" color="$neutral2">Back to Launchpad</Text>
          </BackButton>

          <HeaderSection>
            <TokenLogo>
              <Text variant="heading1" color="$accent1">{logoLetter}</Text>
            </TokenLogo>
            <TokenInfo>
              <Flex flexDirection="row" alignItems="center" gap="$spacing12">
                <TokenName>{name || 'Unknown Token'}</TokenName>
                {graduated && (
                  <GraduatedBadge>
                    <Text variant="body3" color="$statusSuccess" fontWeight="600">Graduated</Text>
                  </GraduatedBadge>
                )}
              </Flex>
              <TokenSymbol>${symbol || '???'}</TokenSymbol>
              <AddressRow>
                <Text variant="body3" color="$neutral3">
                  {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-8)}
                </Text>
                <AddressLink onPress={handleCopyAddress}>
                  <CopyAlt size="$icon.16" color="$neutral3" />
                </AddressLink>
                <AddressLink onPress={handleOpenExplorer}>
                  <ExternalLink size="$icon.16" color="$neutral3" />
                </AddressLink>
              </AddressRow>
            </TokenInfo>
          </HeaderSection>

          <MainContent>
            <LeftColumn>
              {!graduated && (
                <Card>
                  <CardTitle>Bonding Curve Progress</CardTitle>
                  <ProgressBar>
                    <ProgressFill style={{ width: `${Math.min(progress, 100)}%` }} />
                  </ProgressBar>
                  <Flex flexDirection="row" justifyContent="space-between">
                    <Text variant="body2" color="$neutral2">{progress.toFixed(2)}% complete</Text>
                    <Text variant="body2" color="$neutral1">
                      {tokensRemaining} tokens remaining
                    </Text>
                  </Flex>

                  <Flex
                    flexDirection="row"
                    alignItems="center"
                    gap="$spacing6"
                    marginTop="$spacing4"
                    cursor="pointer"
                    onPress={() => setShowBondingModal(true)}
                    hoverStyle={{ opacity: 0.7 }}
                  >
                    <Text variant="body3" color="$neutral3">
                      Graduates to V2 at 100% · 1% fee
                    </Text>
                    <InfoCircle size={14} color="$neutral3" />
                  </Flex>

                  {canGraduate && !graduated && (
                    <GraduateButton
                      onPress={isGraduating ? undefined : handleGraduate}
                      opacity={isGraduating ? 0.6 : 1}
                      cursor={isGraduating ? 'not-allowed' : 'pointer'}
                    >
                      <Text variant="buttonLabel2" color="$white">
                        {isGraduating ? 'Graduating...' : 'Graduate to JuiceSwap V2'}
                      </Text>
                    </GraduateButton>
                  )}
                </Card>
              )}

              <Card>
                <CardTitle>Token Info</CardTitle>
                <StatRow>
                  <StatLabel>Current Price</StatLabel>
                  <StatValue>{currentPrice} JUSD</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Liquidity</StatLabel>
                  <StatValue>{liquidity} JUSD</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Total Supply</StatLabel>
                  <StatValue>1,000,000,000</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Creator</StatLabel>
                  <AddressLink
                    onPress={() => {
                      if (tokenInfo?.creator) {
                        const url = getExplorerLink({
                          chainId: UniverseChainId.CitreaTestnet,
                          data: tokenInfo.creator,
                          type: ExplorerDataType.ADDRESS,
                        })
                        window.open(url, '_blank')
                      }
                    }}
                  >
                    <StatValue>{creatorShort}</StatValue>
                    <ExternalLink size="$icon.16" color="$neutral2" />
                  </AddressLink>
                </StatRow>
                {createdDate && (
                  <StatRow>
                    <StatLabel>Created</StatLabel>
                    <StatValue>{createdDate}</StatValue>
                  </StatRow>
                )}
                {graduated && v2Pair && (
                  <StatRow>
                    <StatLabel>V2 Pair</StatLabel>
                    <AddressLink
                      onPress={() => {
                        const url = getExplorerLink({
                          chainId: UniverseChainId.CitreaTestnet,
                          data: v2Pair,
                          type: ExplorerDataType.ADDRESS,
                        })
                        window.open(url, '_blank')
                      }}
                    >
                      <StatValue>{v2Pair.slice(0, 6)}...{v2Pair.slice(-4)}</StatValue>
                      <ExternalLink size="$icon.16" color="$neutral2" />
                    </AddressLink>
                  </StatRow>
                )}
              </Card>
            </LeftColumn>

            <RightColumn>
              {baseAsset && (
                <BuySellPanel
                  tokenAddress={tokenAddress}
                  tokenSymbol={symbol || '???'}
                  baseAsset={baseAsset}
                  graduated={graduated}
                />
              )}
            </RightColumn>
          </MainContent>
        </ContentWrapper>
      </PageContainer>

      <Modal
        name={ModalName.AccountEdit}
        maxWidth={420}
        isModalOpen={showBondingModal}
        onClose={() => setShowBondingModal(false)}
        padding={0}
      >
        <Flex gap="$spacing16" padding="$spacing24">
          <Flex flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text variant="subheading1" color="$neutral1">
              About Bonding Curves
            </Text>
            <ModalCloseIcon onClose={() => setShowBondingModal(false)} />
          </Flex>

          <Text variant="body2" color="$neutral2">
            Tokens start on a bonding curve where price increases as more tokens are purchased.
            When 100% of tokens are sold from the curve, the token graduates to JuiceSwap V2
            with permanently locked liquidity.
          </Text>

          <Flex gap="$spacing8">
            <Text variant="body3" color="$neutral2">• 1% fee on all trades</Text>
            <Text variant="body3" color="$neutral2">• ~79.31% sold on bonding curve</Text>
            <Text variant="body3" color="$neutral2">• ~20.69% reserved for DEX liquidity</Text>
            <Text variant="body3" color="$neutral2">• LP tokens burned forever</Text>
          </Flex>
        </Flex>
      </Modal>
    </Trace>
  )
}
