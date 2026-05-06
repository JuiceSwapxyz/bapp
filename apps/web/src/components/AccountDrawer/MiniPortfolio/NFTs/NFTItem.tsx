import { SharedEventName } from '@uniswap/analytics-events'
import { usePfp, useSetPfp } from 'components/Identicon/usePfp'
import { useAccount } from 'hooks/useAccount'
import { NftCard } from 'nft/components/card'
import { VerifiedIcon } from 'nft/components/iconExports'
import { WalletAsset } from 'nft/types'
import { Flex, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
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
  const account = useAccount()
  const setPfp = useSetPfp()
  const currentPfp = usePfp(account.address)

  const isCurrentPfp =
    !!currentPfp &&
    currentPfp.contract.toLowerCase() === asset.asset_contract.address?.toLowerCase() &&
    currentPfp.tokenId === asset.tokenId

  const canSetPfp = !!account.address && !!asset.imageUrl && !!asset.asset_contract.address && !!asset.tokenId

  const onPress = () => {
    if (asset.asset_contract.address && asset.tokenId) {
      window.open(
        `https://testnet.citreascan.com/token/${asset.asset_contract.address}/instance/${asset.tokenId}`,
        '_blank',
        'noopener,noreferrer',
      )
    }
  }

  const togglePfp = (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.()
    if (!account.address) {
      return
    }
    if (isCurrentPfp) {
      setPfp(account.address, null)
    } else if (asset.imageUrl && asset.asset_contract.address && asset.tokenId) {
      setPfp(account.address, {
        imageUrl: asset.imageUrl,
        contract: asset.asset_contract.address,
        tokenId: asset.tokenId,
      })
    }
  }

  return (
    <Flex gap="8px" minHeight="150px" alignItems="center" justifyContent="flex-start" width="100%">
      <Flex position="relative" width="100%">
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
        {canSetPfp && (
          <Flex
            position="absolute"
            top="$spacing8"
            right="$spacing8"
            backgroundColor={isCurrentPfp ? '#F7911A' : 'rgba(10,6,4,0.78)'}
            borderRadius="$roundedFull"
            px="$padding10"
            py="$padding6"
            cursor="pointer"
            zIndex={2}
            borderWidth={1}
            borderStyle="solid"
            borderColor={isCurrentPfp ? '#FFD699' : 'rgba(255,255,255,0.18)'}
            shadowColor="rgba(0,0,0,0.45)"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.4}
            shadowRadius={4}
            hoverStyle={{
              backgroundColor: isCurrentPfp ? '#FFB35C' : 'rgba(247,145,26,0.85)',
              borderColor: '#FFD699',
            }}
            onPress={togglePfp}
            data-testid="nft-set-pfp"
            title={isCurrentPfp ? 'Current profile picture' : 'Set as profile picture'}
          >
            <Flex row alignItems="center" gap="$spacing4">
              {isCurrentPfp ? (
                <Check size={14} color="$white" />
              ) : (
                <Text variant="buttonLabel3" color="$white" lineHeight={14}>
                  +
                </Text>
              )}
              <Text variant="buttonLabel3" color="$white">
                {isCurrentPfp ? 'PFP' : 'Set PFP'}
              </Text>
            </Flex>
          </Flex>
        )}
      </Flex>
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
