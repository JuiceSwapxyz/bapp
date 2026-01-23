import { CurrencyAmount, Token } from '@juiceswapxyz/sdk-core'
import { useQueryClient } from '@tanstack/react-query'
import { ToastRegularSimple } from 'components/Popups/ToastRegularSimple'
import { useAccount } from 'hooks/useAccount'
import { useBondingCurveBalance, useCalculateBuy, useCalculateSell } from 'hooks/useBondingCurveToken'
import { calculateMinOutput, useBuy, useSell } from 'hooks/useLaunchpadActions'
import { useTokenAllowance, useUpdateTokenAllowance } from 'hooks/useTokenAllowance'
import styledComponents from 'lib/styled-components'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useTransactionAdder } from 'state/transactions/hooks'
import { Flex, Text, styled } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { formatUnits, parseUnits } from 'viem'
import { useBalance } from 'wagmi'

const PanelContainer = styled(Flex, {
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  borderWidth: 1,
  borderColor: '$surface3',
  padding: '$spacing20',
  gap: '$spacing16',
})

const TabContainer = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing8',
  padding: '$spacing4',
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
})

const Tab = styled(Flex, {
  flex: 1,
  paddingVertical: '$spacing12',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '$rounded8',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        backgroundColor: '$accent1',
      },
    },
  } as const,
})

const InputContainer = styled(Flex, {
  gap: '$spacing8',
})

const InputLabel = styled(Text, {
  variant: 'body3',
  color: '$neutral2',
})

const InputWrapper = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '$surface1',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  paddingHorizontal: '$spacing16',
  paddingVertical: '$spacing16',
  gap: '$spacing12',
})

const StyledInput = styledComponents.input`
  flex: 1;
  background-color: transparent;
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.neutral1};
  padding: 0;
  -webkit-appearance: textfield;

  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`

const MaxButton = styled(Flex, {
  paddingHorizontal: '$spacing12',
  paddingVertical: '$spacing6',
  backgroundColor: '$accent2',
  borderRadius: '$rounded8',
  cursor: 'pointer',
  hoverStyle: {
    backgroundColor: '$accent1',
  },
})

const OutputCard = styled(Flex, {
  backgroundColor: '$surface3',
  borderRadius: '$rounded12',
  padding: '$spacing12',
  gap: '$spacing8',
})

const OutputRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})

const ActionButton = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: '$spacing16',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  variants: {
    variant: {
      buy: {
        backgroundColor: '$statusSuccess',
        hoverStyle: { opacity: 0.9 },
      },
      sell: {
        backgroundColor: '$statusCritical',
        hoverStyle: { opacity: 0.9 },
      },
      disabled: {
        backgroundColor: '$surface3',
        cursor: 'not-allowed',
      },
    },
  } as const,
})

const BalanceRow = styled(Flex, {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
})

const TradeOnSwapButton = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: '$spacing16',
  backgroundColor: '$accent1',
  borderRadius: '$rounded12',
  cursor: 'pointer',
  marginTop: '$spacing8',
  hoverStyle: {
    opacity: 0.9,
  },
})

interface BuySellPanelProps {
  tokenAddress: string
  tokenSymbol: string
  baseAsset: string
  graduated: boolean
  onTransactionComplete?: () => void
}

export function BuySellPanel({
  tokenAddress,
  tokenSymbol,
  baseAsset,
  graduated,
  onTransactionComplete,
}: BuySellPanelProps) {
  const [isBuy, setIsBuy] = useState(true)
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const account = useAccount()
  const chainId = UniverseChainId.CitreaTestnet
  const addTransaction = useTransactionAdder()
  const queryClient = useQueryClient()

  // Parse input amount
  const parsedAmount = useMemo(() => {
    if (!amount || isNaN(Number(amount))) {
      return undefined
    }
    try {
      return parseUnits(amount, 18)
    } catch {
      return undefined
    }
  }, [amount])

  // Get quotes
  const { tokensOut, isLoading: buyQuoteLoading } = useCalculateBuy(
    tokenAddress,
    isBuy ? parsedAmount : undefined,
    chainId,
  )
  const { baseOut, isLoading: sellQuoteLoading } = useCalculateSell(
    tokenAddress,
    !isBuy ? parsedAmount : undefined,
    chainId,
  )

  // Get balances
  const { balance: tokenBalance, refetch: refetchTokenBalance } = useBondingCurveBalance(
    tokenAddress,
    account.address,
    chainId,
  )

  // Get base asset (JUSD) balance
  const { data: baseBalance, refetch: refetchBaseBalance } = useBalance({
    address: account.address as `0x${string}` | undefined,
    token: baseAsset as `0x${string}` | undefined,
    chainId,
    query: { enabled: !!account.address && !!baseAsset },
  })

  // Create Token objects for allowance hook
  const baseToken = useMemo(() => {
    if (!baseAsset) {
      return undefined
    }
    return new Token(chainId, baseAsset as `0x${string}`, 18, 'JUSD', 'Juice Dollar')
  }, [baseAsset, chainId])

  const launchpadToken = useMemo(() => {
    if (!tokenAddress) {
      return undefined
    }
    return new Token(chainId, tokenAddress as `0x${string}`, 18, tokenSymbol, tokenSymbol)
  }, [tokenAddress, tokenSymbol, chainId])

  // Check allowance for base asset (for buying)
  const { tokenAllowance: baseAllowance } = useTokenAllowance({
    token: baseToken,
    owner: account.address,
    spender: tokenAddress,
  })

  // Check allowance for token (for selling)
  const { tokenAllowance: tokenAllowance } = useTokenAllowance({
    token: launchpadToken,
    owner: account.address,
    spender: tokenAddress,
  })

  // Approval functions
  const baseApproveAmount = useMemo(() => {
    if (!baseToken || !parsedAmount) {
      return undefined
    }
    return CurrencyAmount.fromRawAmount(baseToken, parsedAmount.toString())
  }, [baseToken, parsedAmount])

  const tokenApproveAmount = useMemo(() => {
    if (!launchpadToken || !parsedAmount) {
      return undefined
    }
    return CurrencyAmount.fromRawAmount(launchpadToken, parsedAmount.toString())
  }, [launchpadToken, parsedAmount])

  const approveBase = useUpdateTokenAllowance(baseApproveAmount, tokenAddress)
  const approveToken = useUpdateTokenAllowance(tokenApproveAmount, tokenAddress)

  // Check if approval needed
  const needsBaseApproval = useMemo(() => {
    if (!isBuy || !baseAllowance || !parsedAmount) {
      return false
    }
    return BigInt(baseAllowance.quotient.toString()) < parsedAmount
  }, [isBuy, baseAllowance, parsedAmount])

  const needsTokenApproval = useMemo(() => {
    if (isBuy || !tokenAllowance || !parsedAmount) {
      return false
    }
    return BigInt(tokenAllowance.quotient.toString()) < parsedAmount
  }, [isBuy, tokenAllowance, parsedAmount])

  // Action hooks
  const buy = useBuy(tokenAddress, chainId)
  const sell = useSell(tokenAddress, chainId)

  // Format output
  const outputAmount = useMemo(() => {
    if (isBuy && tokensOut) {
      return formatUnits(tokensOut, 18)
    }
    if (!isBuy && baseOut) {
      return formatUnits(baseOut, 18)
    }
    return '0'
  }, [isBuy, tokensOut, baseOut])

  // Format balances
  const formattedTokenBalance = useMemo(() => {
    if (!tokenBalance) {
      return '0'
    }
    return Number(formatUnits(tokenBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })
  }, [tokenBalance])

  const formattedBaseBalance = useMemo(() => {
    if (!baseBalance) {
      return '0'
    }
    return Number(formatUnits(baseBalance.value, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })
  }, [baseBalance])

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError(null)
    }
  }, [])

  const handleMaxClick = useCallback(() => {
    if (isBuy && baseBalance) {
      setAmount(formatUnits(baseBalance.value, 18))
    } else if (!isBuy && tokenBalance) {
      setAmount(formatUnits(tokenBalance, 18))
    }
  }, [isBuy, baseBalance, tokenBalance])

  const handleAction = useCallback(async () => {
    if (!parsedAmount || parsedAmount === 0n || !account.address) {
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      if (isBuy) {
        if (needsBaseApproval) {
          const { response: approvalTx, info: approvalInfo } = await approveBase()
          addTransaction(approvalTx, approvalInfo)
          await approvalTx.wait()
        }
        const minOut = tokensOut ? calculateMinOutput(tokensOut) : 0n
        const tx = await buy({ baseIn: parsedAmount, minTokensOut: minOut })
        const formattedAmount = Number(formatUnits(tokensOut || 0n, 18)).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
        addTransaction(tx, {
          type: TransactionType.LaunchpadBuy,
          tokenAddress: tokenAddress as `0x${string}`,
          dappInfo: { name: `Bought ${formattedAmount} ${tokenSymbol}` },
        })
        // Wait for confirmation before showing success toast
        await tx.wait()
        // Show success toast
        toast(
          <ToastRegularSimple
            icon={<CheckCircleFilled color="$statusSuccess" size="$icon.28" />}
            text={
              <Flex gap="$gap4" flexWrap="wrap" flex={1}>
                <Text variant="body2" color="$neutral1">
                  Bought
                </Text>
                <Text variant="body3" color="$neutral2">
                  {formattedAmount} {tokenSymbol}
                </Text>
              </Flex>
            }
            onDismiss={() => toast.dismiss()}
          />,
          { duration: 5000 },
        )
      } else {
        if (needsTokenApproval) {
          const { response: approvalTx, info: approvalInfo } = await approveToken()
          addTransaction(approvalTx, approvalInfo)
          await approvalTx.wait()
        }
        const minOut = baseOut ? calculateMinOutput(baseOut) : 0n
        const tx = await sell({ tokensIn: parsedAmount, minBaseOut: minOut })
        const formattedAmount = Number(formatUnits(parsedAmount, 18)).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
        addTransaction(tx, {
          type: TransactionType.LaunchpadSell,
          tokenAddress: tokenAddress as `0x${string}`,
          dappInfo: { name: `Sold ${formattedAmount} ${tokenSymbol}` },
        })
        // Wait for confirmation before showing success toast
        await tx.wait()
        // Show success toast
        toast(
          <ToastRegularSimple
            icon={<CheckCircleFilled color="$statusSuccess" size="$icon.28" />}
            text={
              <Flex gap="$gap4" flexWrap="wrap" flex={1}>
                <Text variant="body2" color="$neutral1">
                  Sold
                </Text>
                <Text variant="body3" color="$neutral2">
                  {formattedAmount} {tokenSymbol}
                </Text>
              </Flex>
            }
            onDismiss={() => toast.dismiss()}
          />,
          { duration: 5000 },
        )
      }
      setAmount('')
      refetchTokenBalance()
      refetchBaseBalance()
      onTransactionComplete?.()
      // Invalidate launchpad queries to update progress bars
      queryClient.invalidateQueries({ queryKey: ['launchpad-tokens'] })
      queryClient.invalidateQueries({ queryKey: ['launchpad-token', tokenAddress] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [
    parsedAmount,
    account.address,
    isBuy,
    needsBaseApproval,
    needsTokenApproval,
    approveBase,
    approveToken,
    tokensOut,
    baseOut,
    buy,
    sell,
    refetchTokenBalance,
    refetchBaseBalance,
    onTransactionComplete,
    addTransaction,
    tokenSymbol,
    tokenAddress,
    queryClient,
  ])

  const buttonText = useMemo(() => {
    if (!account.address) {
      return 'Connect Wallet'
    }
    if (isLoading) {
      return 'Processing...'
    }
    if (!parsedAmount || parsedAmount === 0n) {
      return 'Enter amount'
    }
    if (isBuy && needsBaseApproval) {
      return 'Approve JUSD'
    }
    if (!isBuy && needsTokenApproval) {
      return `Approve ${tokenSymbol}`
    }
    return isBuy ? 'Buy' : 'Sell'
  }, [account.address, isLoading, parsedAmount, isBuy, needsBaseApproval, needsTokenApproval, tokenSymbol])

  const isButtonDisabled = !account.address || isLoading || !parsedAmount || parsedAmount === 0n

  if (graduated) {
    return (
      <PanelContainer>
        <Text variant="body1" color="$neutral1" textAlign="center">
          This token has graduated to JuiceSwap V2
        </Text>
        <Text variant="body2" color="$neutral2" textAlign="center">
          Trade on the main DEX instead
        </Text>
        <TradeOnSwapButton onPress={() => navigate(`/swap?outputCurrency=${tokenAddress}`)}>
          <Text variant="buttonLabel2" color="$white">
            Trade on Swap
          </Text>
        </TradeOnSwapButton>
      </PanelContainer>
    )
  }

  return (
    <PanelContainer>
      <TabContainer>
        <Tab active={isBuy} onPress={() => setIsBuy(true)}>
          <Text variant="buttonLabel3" color={isBuy ? '$white' : '$neutral2'}>
            Buy
          </Text>
        </Tab>
        <Tab active={!isBuy} onPress={() => setIsBuy(false)}>
          <Text variant="buttonLabel3" color={!isBuy ? '$white' : '$neutral2'}>
            Sell
          </Text>
        </Tab>
      </TabContainer>

      <InputContainer>
        <InputLabel>{isBuy ? 'You pay (JUSD)' : `You sell (${tokenSymbol})`}</InputLabel>
        <InputWrapper>
          <StyledInput
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={handleAmountChange}
            autoComplete="off"
            autoCorrect="off"
          />
          <MaxButton onPress={handleMaxClick}>
            <Text variant="buttonLabel4" color="$accent1">
              MAX
            </Text>
          </MaxButton>
        </InputWrapper>
      </InputContainer>

      <OutputCard>
        <OutputRow>
          <Text variant="body2" color="$neutral2">
            {isBuy ? `You receive (${tokenSymbol})` : 'You receive (JUSD)'}
          </Text>
          <Text variant="body1" color="$neutral1" fontWeight="500">
            {buyQuoteLoading || sellQuoteLoading
              ? '...'
              : Number(outputAmount).toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </Text>
        </OutputRow>

        <BalanceRow>
          <Text variant="body3" color="$neutral2">
            Your JUSD balance
          </Text>
          <Text variant="body3" color="$neutral1">
            {formattedBaseBalance}
          </Text>
        </BalanceRow>

        <BalanceRow>
          <Text variant="body3" color="$neutral2">
            Your {tokenSymbol} balance
          </Text>
          <Text variant="body3" color="$neutral1">
            {formattedTokenBalance}
          </Text>
        </BalanceRow>
      </OutputCard>

      {error && (
        <Text variant="body3" color="$statusCritical" textAlign="center">
          {error}
        </Text>
      )}

      <ActionButton
        variant={isButtonDisabled ? 'disabled' : isBuy ? 'buy' : 'sell'}
        onPress={isButtonDisabled ? undefined : handleAction}
      >
        <Text variant="buttonLabel2" color="$white">
          {buttonText}
        </Text>
      </ActionButton>

      <Text variant="body4" color="$neutral3" textAlign="center">
        1% of all trade volume flows to JUICE governance token holders. Slippage tolerance: 1%
      </Text>
    </PanelContainer>
  )
}
