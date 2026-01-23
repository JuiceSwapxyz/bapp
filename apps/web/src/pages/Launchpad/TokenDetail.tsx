import { ToastRegularSimple } from 'components/Popups/ToastRegularSimple'
import { useBondingCurveToken } from 'hooks/useBondingCurveToken'
import { useGraduate } from 'hooks/useLaunchpadActions'
import { useLaunchpadToken } from 'hooks/useLaunchpadTokens'
import { useTokenInfo } from 'hooks/useTokenFactory'
import { getSocialLink, useTokenMetadata } from 'hooks/useTokenMetadata'
import { BuySellPanel } from 'pages/Launchpad/components/BuySellPanel'
import { TokenLogo } from 'pages/Launchpad/components/TokenLogo'
import {
  BackButton,
  Card,
  GraduatedBadge,
  ProgressBar,
  ProgressFill,
  StatLabel,
  StatRow,
  StatValue,
} from 'pages/Launchpad/components/shared'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { useTransactionAdder } from 'state/transactions/hooks'
import { Flex, ModalCloseIcon, Text, styled } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { formatUnits } from 'viem'

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

const HeaderSection = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: '$spacing24',
  flexWrap: 'wrap',
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

const CardTitle = styled(Text, {
  variant: 'body1',
  color: '$neutral1',
  fontWeight: '600',
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
    refetch: refetchBondingCurve,
  } = useBondingCurveToken(tokenAddress)

  const { tokenInfo } = useTokenInfo(tokenAddress)
  const { data: launchpadData } = useLaunchpadToken(tokenAddress)
  const { data: metadata } = useTokenMetadata(launchpadData?.token?.metadataURI)
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
        type: TransactionType.LaunchpadGraduate,
        tokenAddress: tokenAddress as `0x${string}`,
        dappInfo: { name: `Graduated ${symbol} to JuiceSwap V2` },
      })
      // Wait for confirmation
      await tx.wait()
      // Show success toast
      toast(
        <ToastRegularSimple
          icon={<CheckCircleFilled color="$statusSuccess" size="$icon.28" />}
          text={
            <Flex gap="$gap4" flexWrap="wrap" flex={1}>
              <Text variant="body2" color="$neutral1">
                Graduated
              </Text>
              <Text variant="body3" color="$neutral2">
                {symbol} to JuiceSwap V2
              </Text>
            </Flex>
          }
          onDismiss={() => toast.dismiss()}
        />,
        { duration: 5000 },
      )
      // Refresh token data to show graduated state
      refetchBondingCurve()
    } catch (error) {
      console.error('Graduate failed:', error)
    } finally {
      setIsGraduating(false)
    }
  }, [graduate, addTransaction, symbol, tokenAddress, refetchBondingCurve])

  // Format values
  const liquidity = useMemo(() => {
    if (!reserves) {
      return '0'
    }
    return Number(formatUnits(reserves.realBase, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })
  }, [reserves])

  const tokensRemaining = useMemo(() => {
    if (!reserves) {
      return '0'
    }
    return Number(formatUnits(reserves.realToken, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
  }, [reserves])

  const currentPrice = useMemo(() => {
    if (!reserves || reserves.virtualToken === 0n) {
      return '0'
    }
    const price = Number(reserves.virtualBase) / Number(reserves.virtualToken)
    return price.toFixed(8)
  }, [reserves])

  const creatorShort = useMemo(() => {
    if (!tokenInfo?.creator) {
      return '...'
    }
    return `${tokenInfo.creator.slice(0, 6)}...${tokenInfo.creator.slice(-4)}`
  }, [tokenInfo])

  const createdDate = useMemo(() => {
    if (!tokenInfo?.timestamp) {
      return ''
    }
    return new Date(tokenInfo.timestamp * 1000).toLocaleDateString()
  }, [tokenInfo])

  if (isLoading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <Text variant="body1" color="$neutral2">
            Loading token...
          </Text>
        </ContentWrapper>
      </PageContainer>
    )
  }

  if (!tokenAddress) {
    return (
      <PageContainer>
        <ContentWrapper>
          <Text variant="body1" color="$neutral2">
            Token not found
          </Text>
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
            <Text variant="body2" color="$neutral2">
              Back to Launchpad
            </Text>
          </BackButton>

          <HeaderSection>
            <TokenLogo metadataURI={launchpadData?.token?.metadataURI} symbol={symbol || '?'} size={80} />
            <TokenInfo>
              <Flex flexDirection="row" alignItems="center" gap="$spacing12">
                <TokenName>{name || 'Unknown Token'}</TokenName>
                {graduated && (
                  <GraduatedBadge size="md">
                    <Text variant="body3" color="$statusSuccess" fontWeight="600">
                      Graduated
                    </Text>
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
              {(metadata?.external_url ||
                getSocialLink(metadata, 'Twitter') ||
                getSocialLink(metadata, 'Telegram')) && (
                <Flex flexDirection="row" gap="$spacing12" flexWrap="wrap" marginTop="$spacing4">
                  {metadata?.external_url && (
                    <AddressLink onPress={() => window.open(metadata.external_url, '_blank', 'noopener')}>
                      <Text variant="body3" color="$accent1">
                        Website
                      </Text>
                      <ExternalLink size="$icon.12" color="$accent1" />
                    </AddressLink>
                  )}
                  {getSocialLink(metadata, 'Twitter') && (
                    <AddressLink
                      onPress={() => {
                        const handle = getSocialLink(metadata, 'Twitter')?.replace('@', '')
                        window.open(`https://twitter.com/${handle}`, '_blank', 'noopener')
                      }}
                    >
                      <Text variant="body3" color="$accent1">
                        Twitter
                      </Text>
                      <ExternalLink size="$icon.12" color="$accent1" />
                    </AddressLink>
                  )}
                  {getSocialLink(metadata, 'Telegram') && (
                    <AddressLink
                      onPress={() => {
                        const handle = getSocialLink(metadata, 'Telegram')?.replace('@', '')
                        window.open(`https://t.me/${handle}`, '_blank', 'noopener')
                      }}
                    >
                      <Text variant="body3" color="$accent1">
                        Telegram
                      </Text>
                      <ExternalLink size="$icon.12" color="$accent1" />
                    </AddressLink>
                  )}
                </Flex>
              )}
            </TokenInfo>
          </HeaderSection>

          {metadata?.description && (
            <Card>
              <CardTitle>About</CardTitle>
              <Text variant="body2" color="$neutral2">
                {metadata.description}
              </Text>
            </Card>
          )}

          <MainContent>
            <LeftColumn>
              {!graduated && (
                <Card>
                  <CardTitle>Bonding Curve Progress</CardTitle>
                  <ProgressBar size="md">
                    <ProgressFill size="md" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </ProgressBar>
                  <Flex flexDirection="row" justifyContent="space-between">
                    <Text variant="body2" color="$neutral2">
                      {progress.toFixed(2)}% complete
                    </Text>
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
                <StatRow paddingVertical="$spacing4">
                  <StatLabel variant="body2">Current Price</StatLabel>
                  <StatValue variant="body2">{currentPrice} JUSD</StatValue>
                </StatRow>
                <StatRow paddingVertical="$spacing4">
                  <StatLabel variant="body2">Liquidity</StatLabel>
                  <StatValue variant="body2">{liquidity} JUSD</StatValue>
                </StatRow>
                <StatRow paddingVertical="$spacing4">
                  <StatLabel variant="body2">Total Supply</StatLabel>
                  <StatValue variant="body2">1,000,000,000</StatValue>
                </StatRow>
                <StatRow paddingVertical="$spacing4">
                  <StatLabel variant="body2">Creator</StatLabel>
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
                    <StatValue variant="body2">{creatorShort}</StatValue>
                    <ExternalLink size="$icon.16" color="$neutral2" />
                  </AddressLink>
                </StatRow>
                {createdDate && (
                  <StatRow paddingVertical="$spacing4">
                    <StatLabel variant="body2">Created</StatLabel>
                    <StatValue variant="body2">{createdDate}</StatValue>
                  </StatRow>
                )}
                {graduated && v2Pair && (
                  <StatRow paddingVertical="$spacing4">
                    <StatLabel variant="body2">V2 Pair</StatLabel>
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
                      <StatValue variant="body2">
                        {v2Pair.slice(0, 6)}...{v2Pair.slice(-4)}
                      </StatValue>
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
                  onTransactionComplete={refetchBondingCurve}
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
            Tokens start on a bonding curve where price increases as more tokens are purchased. When 100% of tokens are
            sold from the curve, the token graduates to JuiceSwap V2 with permanently locked liquidity.
          </Text>

          <Flex gap="$spacing8">
            <Text variant="body3" color="$neutral2">
              • 1% of all trade volume flows to JUICE governance token holders
            </Text>
            <Text variant="body3" color="$neutral2">
              • ~79.31% sold on bonding curve
            </Text>
            <Text variant="body3" color="$neutral2">
              • ~20.69% reserved for DEX liquidity
            </Text>
            <Text variant="body3" color="$neutral2">
              • LP tokens burned forever
            </Text>
          </Flex>
        </Flex>
      </Modal>
    </Trace>
  )
}
