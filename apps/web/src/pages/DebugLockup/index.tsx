import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useState, useMemo } from 'react'
import { Button, Flex, Input, Text } from 'ui/src'
import { AlertTriangle } from 'ui/src/components/icons/AlertTriangle'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { styled } from 'ui/src'
import { buildErc20LockupTx, buildEvmLockupTx, checkErc20Allowance, approveErc20ForLdsBridge } from 'uniswap/src/features/lds-bridge/transactions/evm'
import { logger } from 'utilities/src/logger/logger'
import { getConnectorClient, switchChain } from 'wagmi/actions'
import { parseUnits } from 'viem'
import { getLdsBridgeManager } from 'uniswap/src/features/lds-bridge/LdsBridgeManager'
window.ldsBridgeManager = getLdsBridgeManager
const PageWrapper = styled(Flex, {
  width: '100%',
  maxWidth: 720,
  mx: 'auto',
  p: '$spacing24',
  gap: '$spacing24',
})

const Card = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  padding: '$spacing20',
  gap: '$spacing16',
  borderWidth: 1,
  borderColor: '$surface3',
})

const FieldGroup = styled(Flex, {
  gap: '$spacing8',
})

const StyledInput = styled(Input, {
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
  padding: '$spacing12',
  fontSize: 14,
  color: '$neutral1',
  borderWidth: 1,
  borderColor: '$surface3',
  fontFamily: '$mono',
  focusStyle: {
    borderColor: '$accent1',
    outlineWidth: 0,
  },
})

const SubmitButton = styled(Button, {
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
  padding: '$spacing16',
  hoverStyle: {
    opacity: 0.9,
  },
  pressStyle: {
    opacity: 0.8,
  },
  disabledStyle: {
    opacity: 0.5,
    backgroundColor: '$surface3',
  },
})

const WarningBanner = styled(Flex, {
  backgroundColor: '$DEP_accentWarning',
  borderRadius: '$rounded12',
  padding: '$spacing16',
  gap: '$spacing12',
  flexDirection: 'row',
  alignItems: 'center',
  opacity: 0.15,
})

const SuccessBanner = styled(Flex, {
  backgroundColor: '$statusSuccess',
  borderRadius: '$rounded12',
  padding: '$spacing16',
  gap: '$spacing12',
  flexDirection: 'row',
  alignItems: 'center',
  opacity: 0.15,
})

// Contract addresses for lockups (lowercase to avoid checksum issues)
const CONTRACT_ADDRESSES: Record<number, { coinSwap?: string; erc20Swap: string }> = {
  4114: {
    // Citrea Mainnet
    coinSwap: '0xfd92f846fe6e7d08d28d6a88676bb875e5d906ab',
    erc20Swap: '0x7397f25f230f7d5a83c18e1b68b32511bf35f860',
  },
  137: {
    // Polygon Mainnet
    erc20Swap: '0x2e21f58da58c391f110467c7484edfa849c1cb9b',
  },
  1: {
    // Ethereum Mainnet
    erc20Swap: '0x2e21f58da58c391f110467c7484edfa849c1cb9b',
  },
}

interface TokenInfo {
  symbol: string
  name: string
  address: string
  decimals: number
  chainId: number
}

const SUPPORTED_TOKENS: TokenInfo[] = [
  // Citrea Mainnet - Native token
  {
    symbol: 'cBTC',
    name: 'Citrea Bitcoin (Native)',
    address: '',
    decimals: 8,
    chainId: 4114,
  },
  // Ethereum - JUSD
  {
    symbol: 'JUSD',
    name: 'Juice Dollar',
    address: '0x0987d3720d38847ac6dbb9d025b9de892a3ca35c',
    decimals: 18,
    chainId: 4114,
  },
  // Ethereum - USDT
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
    chainId: 1,
  },
  // Polygon Mainnet - USDT
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    decimals: 6,
    chainId: 137,
  },
]

const CHAINS = [
  { id: 4114, name: 'Citrea Mainnet' },
  { id: 1, name: 'Ethereum' },
  { id: 137, name: 'Polygon' },
]

interface LockupFormData {
  chainId: number
  selectedToken: string // Format: "chainId-tokenAddress" or "chainId-native"
  preimageHash: string
  claimAddress: string
  timelock: string
  amount: string
}

export default function DebugLockup(): JSX.Element {
  const account = useAccount()
  const [formData, setFormData] = useState<LockupFormData>({
    chainId: 4114,
    selectedToken: '5115-native',
    preimageHash: '',
    claimAddress: '',
    timelock: '',
    amount: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Get available tokens for selected chain
  const availableTokens = useMemo(() => {
    return SUPPORTED_TOKENS.filter((token) => token.chainId === formData.chainId)
  }, [formData.chainId])

  // Get selected token info
  const selectedTokenInfo = useMemo(() => {
    return SUPPORTED_TOKENS.find((token) => {
      const tokenKey = token.address ? `${token.chainId}-${token.address}` : `${token.chainId}-native`
      return tokenKey === formData.selectedToken
    })
  }, [formData.selectedToken])

  const isNativeToken = selectedTokenInfo?.address === ''

  const handleInputChange = (field: keyof LockupFormData, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      
      // When chain changes, reset token selection to first available token
      if (field === 'chainId') {
        const chainTokens = SUPPORTED_TOKENS.filter((t) => t.chainId === value)
        if (chainTokens.length > 0) {
          const firstToken = chainTokens[0]
          updated.selectedToken = firstToken.address ? `${firstToken.chainId}-${firstToken.address}` : `${firstToken.chainId}-native`
        }
      }
      
      return updated
    })
    setError('')
    setTxHash('')
  }

  const handleSubmit = useCallback(async () => {
    const validateForm = (): string | null => {
      if (!account.address) {
        return 'Please connect your wallet'
      }
      if (!formData.chainId) {
        return 'Chain is required'
      }
      if (!formData.selectedToken || !selectedTokenInfo) {
        return 'Token is required'
      }
      if (!formData.preimageHash || !/^(0x)?[0-9a-fA-F]{64}$/.test(formData.preimageHash)) {
        return 'Preimage hash must be 64 hex characters (32 bytes)'
      }
      if (!formData.claimAddress || !/^0x[0-9a-fA-F]{40}$/.test(formData.claimAddress)) {
        return 'Invalid claim address'
      }
      if (!formData.timelock || isNaN(Number(formData.timelock)) || Number(formData.timelock) <= 0) {
        return 'Timelock block must be a positive number'
      }
      if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
        return 'Amount must be a positive number'
      }
      return null
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!selectedTokenInfo) {
      setError('Token information not found')
      return
    }

    setIsSubmitting(true)
    setError('')
    setTxHash('')

    try {
      const chainId = formData.chainId
      const contractAddresses = CONTRACT_ADDRESSES[chainId] as { coinSwap?: string; erc20Swap: string } | undefined

      if (!contractAddresses) {
        throw new Error(`Chain ID ${chainId} is not supported`)
      }

      // Validate amount before proceeding
      if (!formData.amount || formData.amount.trim() === '') {
        throw new Error('Amount is required')
      }

      // Parse amount with proper decimals
      let amountWei: bigint
      try {
        amountWei = parseUnits(formData.amount.trim(), selectedTokenInfo.decimals)
      } catch (err) {
        throw new Error(`Invalid amount: ${formData.amount}. Please enter a valid number.`)
      }

      if (amountWei <= 0n) {
        throw new Error('Amount must be greater than 0')
      }

      // Switch chain if necessary
      if (account.chainId !== chainId) {
        await switchChain(wagmiConfig, { chainId })
      }

      const connectorClient = await getConnectorClient(wagmiConfig, { chainId })
      const provider = clientToProvider(connectorClient, chainId)

      if (!provider) {
        throw new Error('Failed to get provider')
      }

      const signer = provider.getSigner()

      // Ensure preimageHash has 0x prefix
      const preimageHash = formData.preimageHash.startsWith('0x')
        ? formData.preimageHash
        : `0x${formData.preimageHash}`

      if (isNativeToken) {
        // Native token (cBTC) lockup
        if (!contractAddresses.coinSwap) {
          throw new Error(`Native token swaps not supported on chain ${chainId}`)
        }

        // For cBTC, convert to satoshis (8 decimals)
        // BigInt to Number conversion - safe for amounts up to ~9 billion BTC
        const amountSatoshis = Number(amountWei)
        
        if (!Number.isFinite(amountSatoshis) || amountSatoshis <= 0) {
          throw new Error(`Invalid amount for native token: ${amountSatoshis}`)
        }

        const result = await buildEvmLockupTx({
          signer,
          contractAddress: contractAddresses.coinSwap,
          preimageHash,
          claimAddress: formData.claimAddress,
          timeoutBlockHeight: Number(formData.timelock),
          amountSatoshis,
        })

        setTxHash(result.hash)
        logger.info('DebugLockup', 'handleSubmit', `Native lockup created: ${result.hash}`)
      } else {
        // ERC20 token lockup
        // Check and approve if needed
        const allowanceCheck = await checkErc20Allowance({
          signer,
          contractAddress: contractAddresses.erc20Swap,
          tokenAddress: selectedTokenInfo.address,
          amount: amountWei,
        })

        if (allowanceCheck.needsApproval) {
          logger.info('DebugLockup', 'handleSubmit', 'Approval needed, requesting approval...')
          const approvalResult = await approveErc20ForLdsBridge({
            signer,
            contractAddress: contractAddresses.erc20Swap,
            tokenAddress: selectedTokenInfo.address,
            amount: amountWei,
          })
          
          logger.info('DebugLockup', 'handleSubmit', `Approval tx: ${approvalResult.hash}`)
          // Wait for approval to be mined
          await approvalResult.tx.wait()
        }

        const result = await buildErc20LockupTx({
          signer,
          contractAddress: contractAddresses.erc20Swap,
          tokenAddress: selectedTokenInfo.address,
          preimageHash,
          amount: amountWei,
          claimAddress: formData.claimAddress,
          timelock: Number(formData.timelock),
        })

        setTxHash(result.hash)
        logger.info('DebugLockup', 'handleSubmit', `ERC20 lockup created: ${result.hash}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      logger.error(err, { tags: { file: 'DebugLockup', function: 'handleSubmit' } })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, account, selectedTokenInfo, isNativeToken])

  const getExplorerUrl = (hash: string): string => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      4114: 'https://explorer.citrea.xyz',
    }
    const baseUrl = explorers[formData.chainId] || 'https://etherscan.io'
    return `${baseUrl}/tx/${hash}`
  }

  const SelectButton = styled(Button, {
    backgroundColor: '$surface3',
    borderRadius: '$rounded8',
    paddingHorizontal: '$spacing12',
    paddingVertical: '$spacing8',
    minWidth: 120,
    hoverStyle: {
      backgroundColor: '$surface2',
    },
    variants: {
      selected: {
        true: {
          backgroundColor: '$accent1',
        },
      },
    } as const,
  })

  return (
    <PageWrapper>
      <Flex gap="$spacing12">
        <Text variant="heading1" color="$neutral1">
          Debug: Create Lockup
        </Text>
        <Text variant="body2" color="$neutral2">
          Manually create a lockup transaction for testing purposes. Use with caution.
        </Text>
      </Flex>

      <WarningBanner>
        <AlertTriangle color="$statusCritical" size="$icon.24" />
        <Flex gap="$spacing4" flex={1}>
          <Text variant="body3" color="$neutral1" fontWeight="600">
            Debug Tool - Use with Caution
          </Text>
          <Text variant="body4" color="$neutral2">
            This tool creates real lockup transactions on-chain. Make sure you understand what you&apos;re doing.
          </Text>
        </Flex>
      </WarningBanner>

      <Card>
        <Text variant="heading3" color="$neutral1">
          Lockup Details
        </Text>

        <FieldGroup>
          <Text variant="body3" color="$neutral2">
            Chain
          </Text>
          <Flex flexDirection="row" gap="$spacing8" flexWrap="wrap">
            {CHAINS.map((chain) => (
              <SelectButton
                key={chain.id}
                selected={formData.chainId === chain.id}
                onPress={() => handleInputChange('chainId', chain.id)}
              >
                <Text variant="body4" color="$neutral1" fontSize={12}>
                  {chain.name}
                </Text>
              </SelectButton>
            ))}
          </Flex>
        </FieldGroup>

        <FieldGroup>
          <Text variant="body3" color="$neutral2">
            Token
          </Text>
          <Flex flexDirection="row" gap="$spacing8" flexWrap="wrap">
            {availableTokens.map((token) => {
              const tokenKey = token.address ? `${token.chainId}-${token.address}` : `${token.chainId}-native`
              return (
                <SelectButton
                  key={tokenKey}
                  selected={formData.selectedToken === tokenKey}
                  onPress={() => handleInputChange('selectedToken', tokenKey)}
                >
                  <Text variant="body4" color="$neutral1" fontSize={12}>
                    {token.symbol}
                  </Text>
                </SelectButton>
              )
            })}
          </Flex>
          {selectedTokenInfo && (
            <Text variant="body4" color="$neutral3" fontSize={11}>
              {selectedTokenInfo.name} • {selectedTokenInfo.decimals} decimals
              {selectedTokenInfo.address && ` • ${selectedTokenInfo.address.slice(0, 10)}...`}
            </Text>
          )}
        </FieldGroup>

        <FieldGroup>
          <Text variant="body3" color="$neutral2">
            Preimage Hash (32 bytes)
          </Text>
          <StyledInput
            value={formData.preimageHash}
            onChangeText={(value: string) => handleInputChange('preimageHash', value)}
            placeholder="0x1234567890abcdef..."
          />
          <Text variant="body4" color="$neutral3" fontSize={11}>
            64 hex characters (with or without 0x prefix)
          </Text>
        </FieldGroup>

        <FieldGroup>
          <Text variant="body3" color="$neutral2">
            Claim Address
          </Text>
          <StyledInput
            value={formData.claimAddress}
            onChangeText={(value: string) => handleInputChange('claimAddress', value)}
            placeholder="0x..."
          />
        </FieldGroup>

        <FieldGroup>
          <Text variant="body3" color="$neutral2">
            Timelock (Block Height)
          </Text>
          <StyledInput
            value={formData.timelock}
            onChangeText={(value: string) => handleInputChange('timelock', value)}
            placeholder="12345678"
          />
          <Text variant="body4" color="$neutral3" fontSize={11}>
            The block number when the lockup expires
          </Text>
        </FieldGroup>

        <FieldGroup>
          <Text variant="body3" color="$neutral2">
            Amount {selectedTokenInfo && `(${selectedTokenInfo.symbol})`}
          </Text>
          <StyledInput
            value={formData.amount}
            onChangeText={(value: string) => handleInputChange('amount', value)}
            placeholder={
              selectedTokenInfo?.decimals === 8
                ? '0.001'
                : selectedTokenInfo?.decimals === 6
                  ? '10.0'
                  : '1.0'
            }
            inputMode="decimal"
          />
          <Text variant="body4" color="$neutral3" fontSize={11}>
            {selectedTokenInfo ? (
              <>
                Enter amount in {selectedTokenInfo.symbol}. Examples:{' '}
                {selectedTokenInfo.decimals === 8
                  ? '0.001 (100,000 sats)'
                  : selectedTokenInfo.decimals === 6
                    ? '10.0 (10,000,000 units)'
                    : '1.0 (1e18 wei)'}
              </>
            ) : (
              'Select a token first'
            )}
          </Text>
        </FieldGroup>

        <SubmitButton onPress={handleSubmit} disabled={isSubmitting || !account.address}>
          <Text variant="buttonLabel2" color="$white">
            {isSubmitting ? 'Creating Lockup...' : account.address ? 'Create Lockup' : 'Connect Wallet'}
          </Text>
        </SubmitButton>
      </Card>

      {error && (
        <WarningBanner>
          <AlertTriangle color="$statusCritical" size="$icon.20" />
          <Text variant="body3" color="$statusCritical">
            {error}
          </Text>
        </WarningBanner>
      )}

      {txHash && (
        <SuccessBanner>
          <CheckCircleFilled color="$statusSuccess" size="$icon.20" />
          <Flex gap="$spacing4" flex={1}>
            <Text variant="body3" color="$statusSuccess" fontWeight="600">
              Lockup Created Successfully!
            </Text>
            <Text variant="body4" color="$neutral2" fontFamily="$mono" fontSize={11}>
              TX: {txHash}
            </Text>
            <Button
              onPress={() => window.open(getExplorerUrl(txHash), '_blank')}
              backgroundColor="transparent"
              padding="$none"
            >
              <Text variant="body4" color="$accent1" fontSize={11}>
                View on Explorer →
              </Text>
            </Button>
          </Flex>
        </SuccessBanner>
      )}
    </PageWrapper>
  )
}
