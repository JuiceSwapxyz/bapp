/**
 * Hook for fetching and caching token metadata from IPFS/Arweave/HTTPS
 */
import { useQuery } from '@tanstack/react-query'

/**
 * Token metadata following standard NFT/token metadata format
 */
export interface TokenMetadata {
  name: string
  description: string
  image: string // IPFS URI like ipfs://Qm...
  external_url?: string // Website URL
  attributes?: Array<{
    trait_type: string
    value: string
  }>
}

/**
 * Convert ipfs:// or ar:// URI to HTTP gateway URL
 */
export function ipfsToHttp(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    // Use Pinata gateway (added to CSP, has proper CORS headers)
    return uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
  }
  if (uri.startsWith('ar://')) {
    // Arweave gateway
    return uri.replace('ar://', 'https://arweave.net/')
  }
  return uri
}

/**
 * Hook to fetch metadata for a single token from its metadataURI
 * Automatically handles IPFS/Arweave/HTTPS URIs and caches results
 *
 * @param metadataURI - The metadata URI from the token (ipfs://, ar://, or https://)
 */
export function useTokenMetadata(metadataURI: string | null | undefined) {
  return useQuery({
    queryKey: ['token-metadata', metadataURI],
    queryFn: async (): Promise<TokenMetadata | null> => {
      if (!metadataURI) return null

      const url = ipfsToHttp(metadataURI)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`)
      }

      return response.json()
    },
    enabled: !!metadataURI,
    staleTime: Infinity, // Metadata is immutable - never stale
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // 1 second between retries
  })
}

/**
 * Helper to extract a social link from metadata attributes
 *
 * @param metadata - Token metadata object
 * @param type - The trait_type to look for (e.g., 'Twitter', 'Telegram')
 * @returns The value if found, null otherwise
 */
export function getSocialLink(
  metadata: TokenMetadata | null | undefined,
  type: string
): string | null {
  if (!metadata?.attributes) return null
  const attr = metadata.attributes.find((a) => a.trait_type === type)
  return attr?.value ?? null
}
