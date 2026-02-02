import { Contract, ContractTransaction } from '@ethersproject/contracts'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import {
  BONDING_CURVE_TOKEN_ABI,
  DEFAULT_LAUNCHPAD_SLIPPAGE_BPS,
  LAUNCHPAD_ADDRESSES,
  TOKEN_FACTORY_ABI,
} from 'constants/launchpad'
import { clientToProvider } from 'hooks/useEthersProvider'
import { useCallback } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { UserRejectedRequestError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { getConnectorClient } from 'wagmi/actions'

/**
 * Get a fresh signer for the wallet's current chain.
 * This follows the same pattern as the swap page (utils.ts getSigner).
 */
async function getFreshSigner() {
  const client = await getConnectorClient(wagmiConfig)
  const provider = clientToProvider(client)

  if (!provider) {
    throw new Error('Failed to get provider - wallet may not be connected')
  }

  return {
    signer: provider.getSigner(client.account.address),
    chainId: client.chain.id,
  }
}

/**
 * Get a fresh BondingCurveToken contract with a signer for the current chain.
 */
async function getFreshBondingCurveContract(tokenAddress: string, expectedChainId: number) {
  const { signer, chainId } = await getFreshSigner()

  if (chainId !== expectedChainId) {
    throw new Error(`Wallet is on chain ${chainId} but token is on chain ${expectedChainId}. Please switch networks.`)
  }

  return new Contract(tokenAddress, BONDING_CURVE_TOKEN_ABI, signer)
}

/**
 * Get a fresh TokenFactory contract with a signer for the current chain.
 */
async function getFreshTokenFactoryContract(expectedChainId: UniverseChainId) {
  const addresses = LAUNCHPAD_ADDRESSES[expectedChainId]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!addresses || addresses.factory === '0x0000000000000000000000000000000000000000') {
    throw new Error('Token factory not available for this chain')
  }

  const { signer, chainId } = await getFreshSigner()

  if (chainId !== expectedChainId) {
    throw new Error(`Wallet is on chain ${chainId} but factory is on chain ${expectedChainId}. Please switch networks.`)
  }

  return new Contract(addresses.factory, TOKEN_FACTORY_ABI, signer)
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
  metadataURI: string
}

/**
 * Hook for buying tokens from bonding curve.
 * Gets a fresh signer at transaction time to ensure correct chain after chain switch.
 */
export function useBuy(
  tokenAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaMainnet,
): (params: BuyParams) => Promise<ContractTransaction> {
  return useCallback(
    async ({ baseIn, minTokensOut }: BuyParams): Promise<ContractTransaction> => {
      if (!tokenAddress) {
        throw new Error('Token address not available')
      }
      if (baseIn <= 0n) {
        throw new Error('Amount must be greater than 0')
      }

      try {
        // Get fresh contract with signer at transaction time
        const contract = await getFreshBondingCurveContract(tokenAddress, chainId)

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
    [tokenAddress, chainId],
  )
}

/**
 * Hook for selling tokens to bonding curve.
 * Gets a fresh signer at transaction time to ensure correct chain after chain switch.
 */
export function useSell(
  tokenAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaMainnet,
): (params: SellParams) => Promise<ContractTransaction> {
  return useCallback(
    async ({ tokensIn, minBaseOut }: SellParams): Promise<ContractTransaction> => {
      if (!tokenAddress) {
        throw new Error('Token address not available')
      }
      if (tokensIn <= 0n) {
        throw new Error('Amount must be greater than 0')
      }

      try {
        // Get fresh contract with signer at transaction time
        const contract = await getFreshBondingCurveContract(tokenAddress, chainId)

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
    [tokenAddress, chainId],
  )
}

/**
 * Hook for creating a new token.
 * Gets a fresh signer at transaction time to ensure correct chain after chain switch.
 */
export function useCreateToken(
  chainId: UniverseChainId = UniverseChainId.CitreaMainnet,
): (params: CreateTokenParams) => Promise<{ tx: ContractTransaction; tokenAddress: string | null }> {
  return useCallback(
    async ({
      name,
      symbol,
      metadataURI,
    }: CreateTokenParams): Promise<{ tx: ContractTransaction; tokenAddress: string | null }> => {
      if (!name.trim()) {
        throw new Error('Token name is required')
      }
      if (!symbol.trim()) {
        throw new Error('Token symbol is required')
      }
      if (!metadataURI.trim()) {
        throw new Error('Token metadata URI is required')
      }

      try {
        // Get fresh contract with signer at transaction time
        const contract = await getFreshTokenFactoryContract(chainId)

        const tx = await contract.createToken(name, symbol, metadataURI)
        logger.info('useLaunchpadActions', 'useCreateToken', 'Create token transaction submitted', {
          hash: tx.hash,
          name,
          symbol,
          metadataURI,
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
    [chainId],
  )
}

/**
 * Hook for graduating a token to V2.
 * Gets a fresh signer at transaction time to ensure correct chain after chain switch.
 */
export function useGraduate(
  tokenAddress: string | undefined,
  chainId: UniverseChainId = UniverseChainId.CitreaMainnet,
): () => Promise<ContractTransaction> {
  return useCallback(async (): Promise<ContractTransaction> => {
    if (!tokenAddress) {
      throw new Error('Token address not available')
    }

    try {
      // Get fresh contract with signer at transaction time
      const contract = await getFreshBondingCurveContract(tokenAddress, chainId)

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
  }, [tokenAddress, chainId])
}

/**
 * Calculate minimum output with slippage protection
 * @param expectedOutput - Expected output amount
 * @param slippageBps - Slippage tolerance in basis points (default 1%)
 */
export function calculateMinOutput(
  expectedOutput: bigint,
  slippageBps: number = DEFAULT_LAUNCHPAD_SLIPPAGE_BPS,
): bigint {
  return expectedOutput - (expectedOutput * BigInt(slippageBps)) / 10000n
}

// API URL for metadata uploads
const API_URL =
  process.env.REACT_APP_TRADING_API_URL_OVERRIDE ||
  process.env.REACT_APP_UNISWAP_GATEWAY_DNS ||
  'https://api.juiceswap.com'

export interface UploadImageResponse {
  imageURI: string
}

export interface UploadMetadataParams {
  name: string
  description: string
  imageURI: string
  website?: string
  twitter?: string
  telegram?: string
}

export interface UploadMetadataResponse {
  metadataURI: string
}

/**
 * Upload an image file to IPFS via API
 * @param image - The image file to upload
 * @returns The IPFS URI of the uploaded image
 */
export async function uploadTokenImage(image: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', image)

  const response = await fetch(`${API_URL}/v1/launchpad/upload-image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || 'Failed to upload image')
  }

  const data: UploadImageResponse = await response.json()
  return data.imageURI
}

/**
 * Upload token metadata JSON to IPFS via API
 * @param params - The metadata parameters
 * @returns The IPFS URI of the uploaded metadata
 */
export async function uploadTokenMetadata(params: UploadMetadataParams): Promise<string> {
  const response = await fetch(`${API_URL}/v1/launchpad/upload-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || 'Failed to upload metadata')
  }

  const data: UploadMetadataResponse = await response.json()
  return data.metadataURI
}

/**
 * Hook for uploading token metadata (image + JSON) to IPFS
 * Combines image upload and metadata upload into a single flow
 */
export function useUploadTokenMetadata() {
  return useCallback(
    async (params: {
      name: string
      description: string
      image: File
      website?: string
      twitter?: string
      telegram?: string
    }): Promise<string> => {
      logger.info('useLaunchpadActions', 'useUploadTokenMetadata', 'Starting metadata upload', {
        name: params.name,
        imageSize: params.image.size,
      })

      // 1. Upload image to IPFS
      const imageURI = await uploadTokenImage(params.image)
      logger.info('useLaunchpadActions', 'useUploadTokenMetadata', 'Image uploaded', { imageURI })

      // 2. Upload metadata JSON with the image URI
      const metadataURI = await uploadTokenMetadata({
        name: params.name,
        description: params.description,
        imageURI,
        website: params.website,
        twitter: params.twitter,
        telegram: params.telegram,
      })
      logger.info('useLaunchpadActions', 'useUploadTokenMetadata', 'Metadata uploaded', { metadataURI })

      return metadataURI
    },
    [],
  )
}
