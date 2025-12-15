import { useNavigate } from 'react-router'
import { useCallback, useState } from 'react'
import { Flex, Text, styled } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { useAccount } from 'hooks/useAccount'
import { useCreateToken } from 'hooks/useLaunchpadActions'
import { useTokenFactory } from 'hooks/useTokenFactory'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { formatUnits } from 'viem'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'

const PageContainer = styled(Flex, {
  width: '100%',
  minHeight: '100vh',
  backgroundColor: '$surface1',
  paddingTop: '$spacing20',
  paddingBottom: '$spacing60',
  paddingHorizontal: '$spacing20',
})

const ContentWrapper = styled(Flex, {
  maxWidth: 600,
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
  gap: '$spacing8',
  paddingBottom: '$spacing24',
  borderBottomWidth: 1,
  borderBottomColor: '$surface3',
})

const MainTitle = styled(Text, {
  variant: 'heading2',
  color: '$neutral1',
  fontWeight: 'bold',
})

const Subtitle = styled(Text, {
  variant: 'body2',
  color: '$neutral2',
})

const FormCard = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
  padding: '$spacing24',
  gap: '$spacing20',
})

const InputGroup = styled(Flex, {
  gap: '$spacing8',
})

const InputLabel = styled(Text, {
  variant: 'body2',
  color: '$neutral1',
  fontWeight: '500',
})

const InputHint = styled(Text, {
  variant: 'body4',
  color: '$neutral3',
})

const StyledInput = styled('input', {
  width: '100%',
  height: 48,
  backgroundColor: '$surface1',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded12',
  paddingLeft: 16,
  paddingRight: 16,
  fontSize: 16,
  color: '$neutral1',
  outline: 'none',
  focusStyle: {
    borderColor: '$accent1',
  },
})

const CreateButton = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: '$spacing16',
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  hoverStyle: {
    backgroundColor: '$accent2',
  },
  variants: {
    disabled: {
      true: {
        backgroundColor: '$surface3',
        cursor: 'not-allowed',
      },
    },
  } as const,
})

const InfoCard = styled(Flex, {
  backgroundColor: '$accent2',
  borderRadius: '$rounded12',
  padding: '$spacing16',
  gap: '$spacing12',
})

const StatRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})

const StatLabel = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

const StatValue = styled(Text, {
  variant: 'body3',
  color: '$neutral1',
  fontWeight: '500',
})

const ErrorText = styled(Text, {
  variant: 'body3',
  color: '$statusCritical',
})

export default function CreateToken() {
  const navigate = useNavigate()
  const account = useAccount()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createToken = useCreateToken()
  const { initialVirtualBaseReserves } = useTokenFactory()
  const addTransaction = useTransactionAdder()

  const handleBack = useCallback(() => {
    navigate('/launchpad')
  }, [navigate])

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setError(null)
  }, [])

  const handleSymbolChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value.toUpperCase())
    setError(null)
  }, [])

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim()
    const trimmedSymbol = symbol.trim()

    if (!trimmedName) {
      setError('Token name is required')
      return
    }
    if (trimmedName.length > 32) {
      setError('Name must be 32 characters or less')
      return
    }
    if (!trimmedSymbol) {
      setError('Token symbol is required')
      return
    }
    if (trimmedSymbol.length > 10) {
      setError('Symbol must be 10 characters or less')
      return
    }
    if (!/^[A-Z0-9]+$/i.test(trimmedSymbol)) {
      setError('Symbol must be alphanumeric')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { tx, tokenAddress } = await createToken({ name: trimmedName, symbol: trimmedSymbol })
      addTransaction(tx, {
        type: TransactionType.Custom,
        summary: `Created ${trimmedSymbol} token`,
      })
      if (tokenAddress) {
        navigate(`/launchpad/${tokenAddress}`)
      } else {
        navigate('/launchpad')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create token'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [name, symbol, createToken, navigate, addTransaction])

  const isButtonDisabled = !account.address || isLoading || !name.trim() || !symbol.trim()

  const buttonText = !account.address
    ? 'Connect Wallet'
    : isLoading
    ? 'Creating...'
    : 'Create Token'

  // Format initial liquidity
  const initialLiquidity = initialVirtualBaseReserves
    ? Number(formatUnits(initialVirtualBaseReserves, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : '4,500'

  return (
    <Trace logImpression page={InterfacePageName.LaunchpadCreatePage}>
      <PageContainer>
        <ContentWrapper>
          <BackButton onPress={handleBack}>
            <BackArrow size="$icon.20" color="$neutral2" />
            <Text variant="body2" color="$neutral2">Back to Launchpad</Text>
          </BackButton>

          <HeaderSection>
            <MainTitle>Create Token</MainTitle>
            <Subtitle>
              Launch your token on the bonding curve. No upfront liquidity required.
            </Subtitle>
          </HeaderSection>

          <FormCard>
            <InputGroup>
              <InputLabel>Token Name</InputLabel>
              <StyledInput
                type="text"
                placeholder="My Awesome Token"
                value={name}
                onChange={handleNameChange}
                maxLength={50}
              />
              <InputHint>The full name of your token (e.g., "Dogecoin")</InputHint>
            </InputGroup>

            <InputGroup>
              <InputLabel>Token Symbol</InputLabel>
              <StyledInput
                type="text"
                placeholder="TOKEN"
                value={symbol}
                onChange={handleSymbolChange}
                maxLength={10}
              />
              <InputHint>The trading symbol (e.g., "DOGE"). Max 10 characters.</InputHint>
            </InputGroup>

            {error && <ErrorText>{error}</ErrorText>}

            <CreateButton disabled={isButtonDisabled} onPress={isButtonDisabled ? undefined : handleCreate}>
              <Text variant="buttonLabel2" color="$white">
                {buttonText}
              </Text>
            </CreateButton>
          </FormCard>

          <InfoCard>
            <Text variant="body2" color="$neutral1" fontWeight="600">Token Economics</Text>
            <StatRow>
              <StatLabel>Total Supply</StatLabel>
              <StatValue>1,000,000,000</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Available on Curve</StatLabel>
              <StatValue>793,100,000 (79.31%)</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Reserved for DEX</StatLabel>
              <StatValue>206,900,000 (20.69%)</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Initial Virtual Liquidity</StatLabel>
              <StatValue>{initialLiquidity} JUSD</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Trading Fee</StatLabel>
              <StatValue>1%</StatValue>
            </StatRow>
          </InfoCard>

          <Flex gap="$spacing8" backgroundColor="$surface2" padding="$spacing16" borderRadius="$rounded12">
            <Text variant="body2" color="$neutral1" fontWeight="600">How it works</Text>
            <Text variant="body3" color="$neutral2">
              1. Your token launches on a bonding curve with virtual liquidity
            </Text>
            <Text variant="body3" color="$neutral2">
              2. Anyone can buy tokens - price increases with each purchase
            </Text>
            <Text variant="body3" color="$neutral2">
              3. When all tokens are sold, the token graduates to JuiceSwap V2
            </Text>
            <Text variant="body3" color="$neutral2">
              4. LP tokens are burned forever - liquidity is permanently locked
            </Text>
          </Flex>
        </ContentWrapper>
      </PageContainer>
    </Trace>
  )
}
