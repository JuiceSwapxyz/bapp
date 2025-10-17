import { SharedEventName } from '@uniswap/analytics-events'
import { NftCard } from 'nft/components/card'
import { VerifiedIcon } from 'nft/components/iconExports'
import { WalletAsset } from 'nft/types'
import { Flex, Text } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function NFT({
  asset,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
}: {
  asset: WalletAsset
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
}) {
  const trace = useTrace()

  const onPress = () => {
    if (asset.asset_contract.address && asset.tokenId) {
      window.open(
        `https://explorer.testnet.citrea.xyz/token/${asset.asset_contract.address}/instance/${asset.tokenId}`,
        '_blank',
        'noopener,noreferrer',
      )
    }
  }

  return (
    <Flex gap="8px" minHeight="150px" alignItems="center" justifyContent="flex-start" width="100%">
      <NftCard
        asset={asset}
        hideDetails
        display={{ disabledInfo: true }}
        isSelected={false}
        isDisabled={false}
        onCardClick={onPress}
        sendAnalyticsEvent={() =>
          sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
            element: ElementName.MiniPortfolioNftItem,
            collection_name: asset.collection?.name,
            collection_address: asset.collection?.address,
            token_id: asset.tokenId,
            ...trace,
          })
        }
        mediaShouldBePlaying={mediaShouldBePlaying}
        setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
        testId="mini-portfolio-nft"
      />
      <NFTDetails asset={asset} />
    </Flex>
  )
}

function NFTDetails({ asset }: { asset: WalletAsset }) {
  return (
    <Flex overflow="hidden" width="100%" flexWrap="nowrap">
      <Flex row alignItems="center" gap="4px" width="100%">
        <Text
          variant="body3"
          mx="$spacing2"
          maxWidth="calc(100% - 22px)"
          $platform-web={{ whiteSpace: 'pre', textOverflow: 'ellipsis', overflow: 'hidden' }}
        >
          {asset.asset_contract.name}
          {asset.tokenId && (
            <Text variant="body3" color="$neutral3" $platform-web={{ display: 'inline' }}>
              {' '}
              #{asset.tokenId}
            </Text>
          )}
        </Text>
        {asset.collectionIsVerified && <Verified />}
      </Flex>
    </Flex>
  )
}

const BADGE_SIZE = '18px'
function Verified() {
  return (
    <Flex row alignItems="center" width="unset" style={{ flexShrink: 0 }}>
      <VerifiedIcon height={BADGE_SIZE} width={BADGE_SIZE} />
    </Flex>
  )
}
