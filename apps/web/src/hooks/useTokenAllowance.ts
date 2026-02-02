import { Contract, ContractTransaction } from '@ethersproject/contracts'
import { CurrencyAmount, MaxUint256, Token } from '@juiceswapxyz/sdk-core'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { clientToProvider } from 'hooks/useEthersProvider'
import { useTriggerOnTransactionType } from 'hooks/useTriggerOnTransactionType'
import { useCallback, useMemo } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ApproveTransactionInfo, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { UserRejectedRequestError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { assume0xAddress } from 'utils/wagmi'
import { erc20Abi } from 'viem'
import { useReadContract } from 'wagmi'
import { getConnectorClient } from 'wagmi/actions'

const MAX_ALLOWANCE = MaxUint256.toString()

export function useTokenAllowance({ token, owner, spender }: { token?: Token; owner?: string; spender?: string }): {
  tokenAllowance?: CurrencyAmount<Token>
  isSyncing: boolean
} {
  const queryEnabled = !!owner && !!spender
  const {
    data: rawAmount,
    isFetching,
    refetch: refetchAllowance,
  } = useReadContract({
    address: assume0xAddress(token?.address),
    chainId: token?.chainId,
    abi: erc20Abi,
    functionName: 'allowance',
    args: queryEnabled ? [assume0xAddress(owner), assume0xAddress(spender)] : undefined,
    query: { enabled: queryEnabled },
  })

  // Refetch when any approval transactions confirm
  useTriggerOnTransactionType(TransactionType.Approve, refetchAllowance)

  const allowance = useMemo(
    () => (token && rawAmount !== undefined ? CurrencyAmount.fromRawAmount(token, rawAmount.toString()) : undefined),
    [token, rawAmount],
  )

  return useMemo(() => ({ tokenAllowance: allowance, isSyncing: isFetching }), [allowance, isFetching])
}

/**
 * Get a fresh signer for the wallet's current chain.
 * This follows the same pattern as the swap page (utils.ts getSigner).
 */
async function getFreshSigner(account: string) {
  const client = await getConnectorClient(wagmiConfig)
  const provider = clientToProvider(client)

  if (!provider) {
    throw new Error('Failed to get provider - wallet may not be connected')
  }

  return provider.getSigner(account)
}

export function useUpdateTokenAllowance(
  amount: CurrencyAmount<Token> | undefined,
  spender: string,
): () => Promise<{ response: ContractTransaction; info: ApproveTransactionInfo }> {
  const analyticsTrace = useTrace()

  // Store token info for use in callback (these don't change after chain switch)
  const tokenAddress = amount?.currency.address
  const tokenChainId = amount?.currency.chainId
  const tokenSymbol = amount?.currency.symbol

  return useCallback(async () => {
    try {
      if (!amount) {
        throw new Error('missing amount')
      }
      if (!tokenAddress) {
        throw new Error('missing token address')
      }
      if (!spender) {
        throw new Error('missing spender')
      }

      // Get a FRESH signer at transaction time - this is the key fix!
      // After chain switch, this will return a signer for the correct chain.
      const client = await getConnectorClient(wagmiConfig)
      const signerAddress = client.account.address
      const signer = await getFreshSigner(signerAddress)

      // Verify we're on the correct chain
      const signerChainId = await signer.getChainId()
      if (signerChainId !== tokenChainId) {
        throw new Error(
          `Wallet is on chain ${signerChainId} but token is on chain ${tokenChainId}. Please switch networks.`,
        )
      }

      // Create contract with fresh signer
      const contract = new Contract(tokenAddress, ERC20_ABI, signer)

      const allowance = amount.equalTo(0) ? '0' : MAX_ALLOWANCE

      try {
        const response = await contract.approve(spender, allowance)

        sendAnalyticsEvent(InterfaceEventName.ApproveTokenTxnSubmitted, {
          chain_id: tokenChainId,
          token_symbol: tokenSymbol,
          token_address: tokenAddress,
          ...analyticsTrace,
        })

        return {
          response,
          info: {
            type: TransactionType.Approve,
            tokenAddress: assume0xAddress(tokenAddress),
            spender,
            amount: allowance,
          },
        }
      } catch (error) {
        if (didUserReject(error)) {
          const symbol = tokenSymbol ?? 'Token'
          throw new UserRejectedRequestError(`${symbol} token allowance failed: User rejected`)
        }
        throw error
      }
    } catch (error: unknown) {
      logger.error(error, {
        tags: { file: 'useTokenAllowance', function: 'useUpdateTokenAllowance' },
        extra: {
          errorType: error?.constructor?.name,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      })

      if (error instanceof UserRejectedRequestError) {
        throw error
      } else {
        const symbol = tokenSymbol ?? 'Token'
        const errorString = String(error)
        if (errorString.includes('Not enough funds for L1 fee') || errorString.includes('insufficient funds for gas')) {
          throw new Error('Insufficient cBTC for gas fees')
        }
        // Improve error message extraction
        let errorMessage: string
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String((error as { message: unknown }).message)
        } else if (error && typeof error === 'object' && 'reason' in error) {
          errorMessage = String((error as { reason: unknown }).reason)
        } else {
          errorMessage = JSON.stringify(error)
        }
        throw new Error(`${symbol} token allowance failed: ${errorMessage}`)
      }
    }
  }, [amount, spender, analyticsTrace, tokenAddress, tokenChainId, tokenSymbol])
}

export function useRevokeTokenAllowance(
  token: Token | undefined,
  spender: string,
): () => Promise<{ response: ContractTransaction; info: ApproveTransactionInfo }> {
  const amount = useMemo(() => (token ? CurrencyAmount.fromRawAmount(token, 0) : undefined), [token])

  return useUpdateTokenAllowance(amount, spender)
}
