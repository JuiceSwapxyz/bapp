import { SharedEventName } from '@uniswap/analytics-events'
import { POINTS_BRAND_COLOR } from 'components/AccountDrawer/Points/constants'
import { usePfp, useSetPfp } from 'components/Identicon/usePfp'
import { WebFeatureFlags } from 'constants/featureFlags'
import { useAccount } from 'hooks/useAccount'
import { NftCard } from 'nft/components/card'
import { VerifiedIcon } from 'nft/components/iconExports'
import { WalletAsset } from 'nft/types'
import { Flex, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { Sparkle } from 'ui/src/components/icons/Sparkle'
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

  const canSetPfp =
    WebFeatureFlags.JUICE_POINTS_NFT &&
    !!account.address &&
    !!asset.imageUrl &&
    !!asset.asset_contract.address &&
    !!asset.tokenId

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
            zIndex={2}
            cursor="pointer"
            onPress={togglePfp}
            data-testid="nft-set-pfp"
            title={isCurrentPfp ? 'Current profile picture' : 'Set as profile picture'}
            style={{
              borderRadius: 999,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              background: isCurrentPfp
                ? 'linear-gradient(135deg, #FFB35C 0%, #F7911A 55%, #B05E00 100%)'
                : 'linear-gradient(135deg, rgba(20,12,4,0.72) 0%, rgba(10,6,4,0.62) 100%)',
              border: isCurrentPfp ? '1px solid rgba(255,214,153,0.65)' : '1px solid rgba(255,255,255,0.14)',
              boxShadow: isCurrentPfp
                ? '0 4px 14px rgba(247,145,26,0.45), inset 0 1px 0 rgba(255,255,255,0.35)'
                : '0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
              transition: 'transform 120ms ease, box-shadow 120ms ease',
            }}
          >
            {isCurrentPfp ? <Check size={13} color="$white" /> : <Sparkle size={13} color={POINTS_BRAND_COLOR} />}
            <Text variant="buttonLabel3" color="$white">
              {isCurrentPfp ? 'PFP' : 'Set PFP'}
            </Text>
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
