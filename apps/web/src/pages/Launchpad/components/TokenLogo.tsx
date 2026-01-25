import { ipfsToHttp, useTokenMetadata } from 'hooks/useTokenMetadata'
import styledComponents from 'lib/styled-components'
import { useEffect, useState } from 'react'
import { Flex, Text, styled } from 'ui/src'

interface TokenLogoProps {
  metadataURI?: string | null
  symbol: string
  size?: number
}

const LogoImage = styledComponents.img<{ $size: number }>`
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  border-radius: 50%;
  object-fit: cover;
`

const LogoPlaceholder = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  backgroundColor: '$accent2',
})

/**
 * Token logo component that fetches and displays the token image from metadata
 * Falls back to a letter placeholder if no image is available or fails to load
 */
export function TokenLogo({ metadataURI, symbol, size = 48 }: TokenLogoProps) {
  const { data: metadata } = useTokenMetadata(metadataURI)
  const [imageError, setImageError] = useState(false)

  // Get the HTTP URL for the image
  const imageUrl = metadata?.image ? ipfsToHttp(metadata.image) : null

  // Reset error state when image URL changes (e.g., navigating to different token)
  useEffect(() => {
    setImageError(false)
  }, [imageUrl])

  const handleImageError = () => {
    setImageError(true)
  }

  // Show image if available and loaded successfully
  if (imageUrl && !imageError) {
    return <LogoImage src={imageUrl} alt={`${symbol} logo`} $size={size} onError={handleImageError} />
  }

  // Fallback to letter placeholder
  const letter = symbol.charAt(0).toUpperCase() || '?'

  return (
    <LogoPlaceholder width={size} height={size}>
      <Text variant={size >= 48 ? 'heading3' : 'body2'} color="$accent1" fontWeight="bold">
        {letter}
      </Text>
    </LogoPlaceholder>
  )
}
