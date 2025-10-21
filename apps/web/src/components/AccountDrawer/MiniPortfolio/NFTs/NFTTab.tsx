import { NFT } from 'components/AccountDrawer/MiniPortfolio/NFTs/NFTItem'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LoadingAssets } from 'nft/components/collection/CollectionAssetLoading'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { WalletAsset } from 'nft/types/sell'
import { useState } from 'react'
import { View } from 'ui/src'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { useJuiceSwapNFTData } from 'uniswap/src/features/dataApi/nfts/nftsJuiceSwap'
import { assume0xAddress } from 'utils/wagmi'

// Transform NFTItem to WalletAsset format for display
function nftItemToWalletAsset(nft: NFTItem): WalletAsset {
  return {
    id: `${nft.contractAddress}-${nft.tokenId}`,
    imageUrl: nft.imageUrl,
    smallImageUrl: nft.imageUrl, // Use same image for thumbnail
    notForSale: true, // JuiceSwap NFTs are not for sale
    name: nft.name,
    tokenId: nft.tokenId,
    asset_contract: {
      address: nft.contractAddress,
      name: nft.collectionName,
    },
    collectionIsVerified: nft.isVerifiedCollection,
  }
}

const AssetsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <View
      $platform-web={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
      }}
      m="$spacing16"
      gap="$gap12"
    >
      {children}
    </View>
  )
}

export default function NFTs({ account }: { account: string }) {
  const accountDrawer = useAccountDrawer()

  // Fetch NFTs from JuiceSwap API
  const { data: walletAssets, loading } = useJuiceSwapNFTData({
    address: assume0xAddress(account),
    skip: !accountDrawer.isOpen,
  })

  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()

  if (loading && !walletAssets) {
    return (
      <AssetsContainer>
        <LoadingAssets count={2} height={150} />
      </AssetsContainer>
    )
  }

  if (!walletAssets || walletAssets.length === 0) {
    return <EmptyWalletModule onNavigateClick={accountDrawer.close} />
  }

  return (
    <AssetsContainer>
      {walletAssets.map((nft) => {
        const asset = nftItemToWalletAsset(nft)
        return (
          <NFT
            setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
            mediaShouldBePlaying={currentTokenPlayingMedia === asset.tokenId}
            key={`${nft.contractAddress}-${nft.tokenId}`}
            asset={asset}
          />
        )
      })}
    </AssetsContainer>
  )
}
