import { useAccount } from 'hooks/useAccount'
import { useCreateToken, useUploadTokenMetadata } from 'hooks/useLaunchpadActions'
import { useTokenFactory } from 'hooks/useTokenFactory'
import styledComponents from 'lib/styled-components'
import { BackButton, StatLabel, StatRow, StatValue } from 'pages/Launchpad/components/shared'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTransactionAdder } from 'state/transactions/hooks'
import { Flex, Text, styled } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
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
  maxWidth: 600,
  width: '100%',
  alignSelf: 'center',
  gap: '$spacing24',
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

const OptionalLabel = styled(Text, {
  variant: 'body4',
  color: '$neutral3',
})

const InputHint = styled(Text, {
  variant: 'body4',
  color: '$neutral3',
})

const StyledInput = styledComponents.input`
  width: 100%;
  height: 48px;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
  padding-left: 16px;
  padding-right: 16px;
  font-size: 16px;
  color: ${({ theme }) => theme.neutral1};
  outline: none;
  &:focus {
    border-color: ${({ theme }) => theme.accent1};
  }
`

const StyledTextarea = styledComponents.textarea`
  width: 100%;
  min-height: 100px;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  color: ${({ theme }) => theme.neutral1};
  outline: none;
  resize: vertical;
  font-family: inherit;
  &:focus {
    border-color: ${({ theme }) => theme.accent1};
  }
`

const FileUploadArea = styled(Flex, {
  borderWidth: 2,
  borderStyle: 'dashed',
  borderColor: '$surface3',
  borderRadius: '$rounded12',
  padding: '$spacing20',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  minHeight: 120,
  hoverStyle: {
    borderColor: '$accent1',
    backgroundColor: '$surface1',
  },
  variants: {
    hasFile: {
      true: {
        borderColor: '$accent1',
        borderStyle: 'solid',
      },
    },
  } as const,
})

const HiddenFileInput = styledComponents.input`
  display: none;
`

const ImagePreview = styledComponents.img`
  max-width: 100px;
  max-height: 100px;
  border-radius: 8px;
  object-fit: cover;
`

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

const ErrorText = styled(Text, {
  variant: 'body3',
  color: '$statusCritical',
})

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

export default function CreateToken() {
  const navigate = useNavigate()
  const account = useAccount()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createToken = useCreateToken()
  const uploadMetadata = useUploadTokenMetadata()
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

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    setError(null)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Invalid image type. Allowed: PNG, JPG, GIF, WebP, SVG')
      return
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image too large. Maximum size is 5MB')
      return
    }

    setImageFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleWebsiteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setWebsite(e.target.value)
    setError(null)
  }, [])

  const handleTwitterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTwitter(e.target.value)
    setError(null)
  }, [])

  const handleTelegramChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTelegram(e.target.value)
    setError(null)
  }, [])

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim()
    const trimmedSymbol = symbol.trim()
    const trimmedDescription = description.trim()
    const trimmedWebsite = website.trim()
    const trimmedTwitter = twitter.trim()
    const trimmedTelegram = telegram.trim()

    // Validation
    if (!trimmedName) {
      setError('Token name is required')
      return
    }
    if (trimmedName.length > 100) {
      setError('Name must be 100 characters or less')
      return
    }
    if (!trimmedSymbol) {
      setError('Token symbol is required')
      return
    }
    if (trimmedSymbol.length > 20) {
      setError('Symbol must be 20 characters or less')
      return
    }
    if (!/^[A-Z0-9]+$/.test(trimmedSymbol)) {
      setError('Symbol must be uppercase alphanumeric (A-Z, 0-9)')
      return
    }
    if (!trimmedDescription) {
      setError('Description is required')
      return
    }
    if (trimmedDescription.length > 500) {
      setError('Description must be 500 characters or less')
      return
    }
    if (!imageFile) {
      setError('Logo image is required')
      return
    }
    if (trimmedWebsite && !trimmedWebsite.startsWith('http://') && !trimmedWebsite.startsWith('https://')) {
      setError('Website must be a valid URL starting with http:// or https://')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Upload metadata to IPFS
      setLoadingStatus('Uploading image and metadata to IPFS...')
      const metadataURI = await uploadMetadata({
        name: trimmedName,
        description: trimmedDescription,
        image: imageFile,
        website: trimmedWebsite || undefined,
        twitter: trimmedTwitter || undefined,
        telegram: trimmedTelegram || undefined,
      })

      // Step 2: Create token on-chain
      setLoadingStatus('Creating token on-chain...')
      const { tx, tokenAddress } = await createToken({
        name: trimmedName,
        symbol: trimmedSymbol,
        metadataURI,
      })

      addTransaction(tx, {
        type: TransactionType.LaunchpadCreateToken,
        tokenAddress: tokenAddress as `0x${string}` | undefined,
        dappInfo: { name: `Created ${trimmedSymbol} token` },
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
      setLoadingStatus('')
    }
  }, [
    name,
    symbol,
    description,
    imageFile,
    website,
    twitter,
    telegram,
    uploadMetadata,
    createToken,
    navigate,
    addTransaction,
  ])

  const isButtonDisabled =
    !account.address || isLoading || !name.trim() || !symbol.trim() || !description.trim() || !imageFile

  const buttonText = !account.address ? 'Connect Wallet' : isLoading ? loadingStatus || 'Creating...' : 'Create Token'

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
            <Text variant="body2" color="$neutral2">
              Back to Launchpad
            </Text>
          </BackButton>

          <HeaderSection>
            <MainTitle>Create Token</MainTitle>
            <Subtitle>Launch your token on the bonding curve. No upfront liquidity required.</Subtitle>
          </HeaderSection>

          <FormCard>
            <InputGroup>
              <InputLabel>Token Name</InputLabel>
              <StyledInput
                type="text"
                placeholder="My Awesome Token"
                value={name}
                onChange={handleNameChange}
                maxLength={100}
              />
              <InputHint>
                The full name of your token (e.g., &quot;Dogecoin&quot;). {name.length}/100 characters.
              </InputHint>
            </InputGroup>

            <InputGroup>
              <InputLabel>Token Symbol</InputLabel>
              <StyledInput
                type="text"
                placeholder="TOKEN"
                value={symbol}
                onChange={handleSymbolChange}
                maxLength={20}
              />
              <InputHint>The trading symbol (e.g., &quot;DOGE&quot;). Uppercase letters and numbers only.</InputHint>
            </InputGroup>

            <InputGroup>
              <InputLabel>Description</InputLabel>
              <StyledTextarea
                placeholder="Describe your token project..."
                value={description}
                onChange={handleDescriptionChange}
                maxLength={500}
              />
              <InputHint>{description.length}/500 characters</InputHint>
            </InputGroup>

            <InputGroup>
              <InputLabel>Logo Image</InputLabel>
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={handleFileSelect}
              />
              <FileUploadArea hasFile={!!imageFile} onPress={handleFileUploadClick}>
                {imagePreview ? (
                  <Flex alignItems="center" gap="$spacing12">
                    <ImagePreview src={imagePreview} alt="Token logo preview" />
                    <Flex>
                      <Text variant="body3" color="$neutral1">
                        {imageFile?.name}
                      </Text>
                      <Text variant="body4" color="$neutral3">
                        Click to change
                      </Text>
                    </Flex>
                  </Flex>
                ) : (
                  <Flex alignItems="center" gap="$spacing8">
                    <Text variant="body2" color="$neutral2">
                      Click to upload logo
                    </Text>
                    <Text variant="body4" color="$neutral3">
                      PNG, JPG, GIF, WebP, SVG (max 5MB)
                    </Text>
                  </Flex>
                )}
              </FileUploadArea>
            </InputGroup>

            <InputGroup>
              <Flex flexDirection="row" alignItems="center" gap="$spacing8">
                <InputLabel>Website</InputLabel>
                <OptionalLabel>(optional)</OptionalLabel>
              </Flex>
              <StyledInput
                type="text"
                placeholder="https://mytoken.com"
                value={website}
                onChange={handleWebsiteChange}
              />
            </InputGroup>

            <InputGroup>
              <Flex flexDirection="row" alignItems="center" gap="$spacing8">
                <InputLabel>Twitter</InputLabel>
                <OptionalLabel>(optional)</OptionalLabel>
              </Flex>
              <StyledInput
                type="text"
                placeholder="@mytoken"
                value={twitter}
                onChange={handleTwitterChange}
                maxLength={100}
              />
            </InputGroup>

            <InputGroup>
              <Flex flexDirection="row" alignItems="center" gap="$spacing8">
                <InputLabel>Telegram</InputLabel>
                <OptionalLabel>(optional)</OptionalLabel>
              </Flex>
              <StyledInput
                type="text"
                placeholder="@mytoken"
                value={telegram}
                onChange={handleTelegramChange}
                maxLength={100}
              />
            </InputGroup>

            {error && <ErrorText>{error}</ErrorText>}

            <CreateButton disabled={isButtonDisabled} onPress={isButtonDisabled ? undefined : handleCreate}>
              <Text variant="buttonLabel2" color="$white">
                {buttonText}
              </Text>
            </CreateButton>
          </FormCard>

          <InfoCard>
            <Text variant="body2" color="$neutral1" fontWeight="600">
              Token Economics
            </Text>
            <StatRow>
              <StatLabel variant="body3">Total Supply</StatLabel>
              <StatValue variant="body3">1,000,000,000</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel variant="body3">Available on Curve</StatLabel>
              <StatValue variant="body3">793,100,000 (79.31%)</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel variant="body3">Reserved for DEX</StatLabel>
              <StatValue variant="body3">206,900,000 (20.69%)</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel variant="body3">Initial Virtual Liquidity</StatLabel>
              <StatValue variant="body3">{initialLiquidity} JUSD</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel variant="body3">Trading Fee</StatLabel>
              <StatValue variant="body3">1%</StatValue>
            </StatRow>
          </InfoCard>

          <Flex gap="$spacing8" backgroundColor="$surface2" padding="$spacing16" borderRadius="$rounded12">
            <Text variant="body2" color="$neutral1" fontWeight="600">
              How it works
            </Text>
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
