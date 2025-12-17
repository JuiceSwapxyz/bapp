import { LightningBridgePopupContent } from 'components/Popups/PopupContent'
import { LightningBridgeStatus } from 'components/Popups/types'
import { Flex, Text } from 'ui/src'
import { LightningBridgeDirection } from 'uniswap/src/data/tradingApi/types'

export default function LightningBridgeNotificationDev() {
  return (
    <Flex gap="$spacing24" p="$spacing24" backgroundColor="$surface2" minHeight="100vh">
      <Text variant="heading2" color="$neutral1">
        Lightning Bridge Notification - Dev Preview
      </Text>

      <Flex gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          Submarine (BTC → cBTC) - Pending
        </Text>
        <LightningBridgePopupContent
          direction={LightningBridgeDirection.Submarine}
          status={LightningBridgeStatus.Pending}
          onClose={() => {}}
        />
      </Flex>

      <Flex gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          Submarine (BTC → cBTC) - Confirmed
        </Text>
        <LightningBridgePopupContent
          direction={LightningBridgeDirection.Submarine}
          status={LightningBridgeStatus.Confirmed}
          onClose={() => {}}
        />
      </Flex>

      <Flex gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          Submarine (BTC → cBTC) - Failed
        </Text>
        <LightningBridgePopupContent
          direction={LightningBridgeDirection.Submarine}
          status={LightningBridgeStatus.Failed}
          onClose={() => {}}
        />
      </Flex>

      <Flex gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          Reverse (cBTC → BTC) - Pending
        </Text>
        <LightningBridgePopupContent
          direction={LightningBridgeDirection.Reverse}
          status={LightningBridgeStatus.Pending}
          onClose={() => {}}
        />
      </Flex>

      <Flex gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          Reverse (cBTC → BTC) - Confirmed
        </Text>
        <LightningBridgePopupContent
          direction={LightningBridgeDirection.Reverse}
          status={LightningBridgeStatus.Confirmed}
          onClose={() => {}}
        />
      </Flex>

      <Flex gap="$spacing16">
        <Text variant="subheading1" color="$neutral1">
          Reverse (cBTC → BTC) - Failed
        </Text>
        <LightningBridgePopupContent
          direction={LightningBridgeDirection.Reverse}
          status={LightningBridgeStatus.Failed}
          onClose={() => {}}
        />
      </Flex>
    </Flex>
  )
}
