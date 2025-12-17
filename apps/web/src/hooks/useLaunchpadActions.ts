import { ContractTransaction } from '@ethersproject/contracts'
import { useAccount } from 'hooks/useAccount'
import { useContract } from 'hooks/useContract'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback, useMemo, useRef } from 'react'
import { BONDING_CURVE_TOKEN_ABI, TOKEN_FACTORY_ABI, LAUNCHPAD_ADDRESSES, DEFAULT_LAUNCHPAD_SLIPPAGE_BPS } from 'constants/launchpad'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { UserRejectedRequestError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { logger } from 'utilities/src/logger/logger'

/**
 * Hook to get a BondingCurveToken contract instance
 */
export function useBondingCurveContract(tokenAddress: string | undefined, chainId?: UniverseChainId) {
  return useContract({
    address: tokenAddress,
    ABI: BONDING_CURVE_TOKEN_ABI,
    withSignerIfPossible: true,
    chainId,
  })
}

/**
 * Hook to get the TokenFactory contract instance
 */
export function useTokenFactoryContract(chainId: UniverseChainId = UniverseChainId.CitreaTestnet) {
  const factoryAddress = useMemo(() => {
    const addresses = LAUNCHPAD_ADDRESSES[chainId]
    if (!addresses || addresses.factory === '0x0000000000000000000000000000000000000000') {
      return undefined
    }
    return addresses.factory
  }, [chainId])

  return useContract({
    address: factoryAddress,
    ABI: TOKEN_FACTORY_ABI,
    withSignerIfPossible: true,
    chainId,
  })
}

export interface BuyParams {
  baseIn: bigint
  minTokensOut: bigint
}

export interface SellParams {
  tokensIn: bigint
  minBaseOut: bigint
}

export interface CreateTokenParams {
  name: string
  symbol: string
}

/**
 * Hook for buying tokens from bonding curve
 * @param tokenAddress - The bonding curve token address
 * @param chainId - Chain ID
 */
export function useBuy(
  tokenAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet
): (params: BuyParams) => Promise<ContractTransaction> {
  const contract = useBondingCurveContract(tokenAddress, chainId)
  const account = useAccount()
  const selectChain = useSelectChain()
  const contractRef = useRef(contract)
  contractRef.current = contract
  const accountRef = useRef(account)
  accountRef.current = account

  return useCallback(
    async ({ baseIn, minTokensOut }: BuyParams): Promise<ContractTransaction> => {
      const currentAccount = accountRef.current
      if (currentAccount.chainId !== chainId) {
        const switched = await selectChain(chainId)
        if (!switched) {
          throw new Error('Please switch to Citrea Testnet to continue')
        }
      }

      const contract = contractRef.current
      if (!contract) {
        throw new Error('Contract not available')
      }
      if (baseIn <= 0n) {
        throw new Error('Amount must be greater than 0')
      }

      try {
        const tx = await contract.buy(baseIn, minTokensOut)
        logger.info('useLaunchpadActions', 'useBuy', 'Buy transaction submitted', {
          hash: tx.hash,
          baseIn: baseIn.toString(),
          minTokensOut: minTokensOut.toString(),
        })
        return tx
      } catch (error) {
        if (didUserReject(error)) {
          throw new UserRejectedRequestError('Buy transaction rejected')
        }
        logger.error(error, { tags: { file: 'useLaunchpadActions', function: 'useBuy' } })
        throw error
      }
    },
    [chainId, selectChain]
  )
}

/**
 * Hook for selling tokens to bonding curve
 * @param tokenAddress - The bonding curve token address
 * @param chainId - Chain ID
 */
export function useSell(
  tokenAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet
): (params: SellParams) => Promise<ContractTransaction> {
  const contract = useBondingCurveContract(tokenAddress, chainId)
  const account = useAccount()
  const selectChain = useSelectChain()
  const contractRef = useRef(contract)
  contractRef.current = contract
  const accountRef = useRef(account)
  accountRef.current = account

  return useCallback(
    async ({ tokensIn, minBaseOut }: SellParams): Promise<ContractTransaction> => {
      const currentAccount = accountRef.current
      if (currentAccount.chainId !== chainId) {
        const switched = await selectChain(chainId)
        if (!switched) {
          throw new Error('Please switch to Citrea Testnet to continue')
        }
      }

      const contract = contractRef.current
      if (!contract) {
        throw new Error('Contract not available')
      }
      if (tokensIn <= 0n) {
        throw new Error('Amount must be greater than 0')
      }

      try {
        const tx = await contract.sell(tokensIn, minBaseOut)
        logger.info('useLaunchpadActions', 'useSell', 'Sell transaction submitted', {
          hash: tx.hash,
          tokensIn: tokensIn.toString(),
          minBaseOut: minBaseOut.toString(),
        })
        return tx
      } catch (error) {
        if (didUserReject(error)) {
          throw new UserRejectedRequestError('Sell transaction rejected')
        }
        logger.error(error, { tags: { file: 'useLaunchpadActions', function: 'useSell' } })
        throw error
      }
    },
    [chainId, selectChain]
  )
}

/**
 * Hook for creating a new token
 * @param chainId - Chain ID
 */
export function useCreateToken(
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet
): (params: CreateTokenParams) => Promise<{ tx: ContractTransaction; tokenAddress: string | null }> {
  const contract = useTokenFactoryContract(chainId)
  const account = useAccount()
  const selectChain = useSelectChain()
  const contractRef = useRef(contract)
  contractRef.current = contract
  const accountRef = useRef(account)
  accountRef.current = account

  return useCallback(
    async ({ name, symbol }: CreateTokenParams): Promise<{ tx: ContractTransaction; tokenAddress: string | null }> => {
      const currentAccount = accountRef.current
      if (currentAccount.chainId !== chainId) {
        const switched = await selectChain(chainId)
        if (!switched) {
          throw new Error('Please switch to Citrea Testnet to continue')
        }
      }

      const contract = contractRef.current
      if (!contract) {
        throw new Error('Factory contract not available')
      }
      if (!name.trim()) {
        throw new Error('Token name is required')
      }
      if (!symbol.trim()) {
        throw new Error('Token symbol is required')
      }

      try {
        const tx = await contract.createToken(name, symbol)
        logger.info('useLaunchpadActions', 'useCreateToken', 'Create token transaction submitted', {
          hash: tx.hash,
          name,
          symbol,
        })

        // Wait for receipt to get the token address from events
        const receipt = await tx.wait()
        let tokenAddress: string | null = null

        // Parse TokenCreated event to get the new token address
        if (receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsed = contract.interface.parseLog(log)
              if (parsed.name === 'TokenCreated') {
                tokenAddress = parsed.args.token
                break
              }
            } catch {
              // Skip logs that don't match
            }
          }
        }

        return { tx, tokenAddress }
      } catch (error) {
        if (didUserReject(error)) {
          throw new UserRejectedRequestError('Create token transaction rejected')
        }
        logger.error(error, { tags: { file: 'useLaunchpadActions', function: 'useCreateToken' } })
        throw error
      }
    },
    [chainId, selectChain]
  )
}

/**
 * Hook for graduating a token to V2
 * @param tokenAddress - The bonding curve token address
 * @param chainId - Chain ID
 */
export function useGraduate(
  tokenAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaTestnet
): () => Promise<ContractTransaction> {
  const contract = useBondingCurveContract(tokenAddress, chainId)
  const account = useAccount()
  const selectChain = useSelectChain()
  const contractRef = useRef(contract)
  contractRef.current = contract
  const accountRef = useRef(account)
  accountRef.current = account

  return useCallback(async (): Promise<ContractTransaction> => {
    const currentAccount = accountRef.current
    if (currentAccount.chainId !== chainId) {
      const switched = await selectChain(chainId)
      if (!switched) {
        throw new Error('Please switch to Citrea Testnet to continue')
      }
    }

    const contract = contractRef.current
    if (!contract) {
      throw new Error('Contract not available')
    }

    try {
      const tx = await contract.graduate()
      logger.info('useLaunchpadActions', 'useGraduate', 'Graduate transaction submitted', {
        hash: tx.hash,
      })
      return tx
    } catch (error) {
      if (didUserReject(error)) {
        throw new UserRejectedRequestError('Graduate transaction rejected')
      }
      logger.error(error, { tags: { file: 'useLaunchpadActions', function: 'useGraduate' } })
      throw error
    }
  }, [chainId, selectChain])
}

/**
 * Calculate minimum output with slippage protection
 * @param expectedOutput - Expected output amount
 * @param slippageBps - Slippage tolerance in basis points (default 1%)
 */
export function calculateMinOutput(expectedOutput: bigint, slippageBps: number = DEFAULT_LAUNCHPAD_SLIPPAGE_BPS): bigint {
  return expectedOutput - (expectedOutput * BigInt(slippageBps)) / 10000n
}
