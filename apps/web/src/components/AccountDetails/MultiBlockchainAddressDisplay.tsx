import { useMemo } from 'react'
import { CopyHelper } from 'theme/components/CopyHelper'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { useENSName } from 'uniswap/src/features/ens/api'
import { Wallet } from 'uniswap/src/features/wallet/types/Wallet'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'

function AddressDisplay({
  unitag,
  ensName,
  shortenedEvmAddress,
}: {
  unitag?: string
  ensName?: string
  shortenedEvmAddress?: string
}) {
  return (
    <Flex row gap="$spacing2" alignItems="center" data-testid={TestID.AddressDisplay}>
      <Text
        variant="subheading1"
        color="$neutral1"
        maxWidth="120px"
        $xxl={{ maxWidth: '180px' }}
        {...EllipsisTamaguiStyle}
      >
        {unitag ?? ensName ?? shortenedEvmAddress}
      </Text>
      {unitag && <Unitag size={18} />}
    </Flex>
  )
}

type AddressItem = {
  image: JSX.Element | null
  address: string
  fullAddress: string
  label: string
}

function TooltipAddressRow({ address }: { address: AddressItem }) {
  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$spacing20">
      <Flex row gap="$spacing8" alignItems="flex-start">
        {address.image}
        <Text variant="body3">{address.label}</Text>
      </Flex>
      <CopyHelper alwaysShowIcon iconSize={iconSizes.icon12} iconPosition="right" toCopy={address.fullAddress}>
        <Text variant="body4">{address.address}</Text>
      </CopyHelper>
    </Flex>
  )
}

export function MultiBlockchainAddressDisplay({
  wallet,
  enableCopyAddress,
}: {
  wallet: Wallet
  enableCopyAddress?: boolean
}) {
  const evmAddress = wallet.evmAccount?.address
  const { data: ENSName } = useENSName(evmAddress)
  const { data: unitagData } = useUnitagsAddressQuery({
    params: evmAddress ? { address: evmAddress } : undefined,
  })
  const unitag = unitagData?.username
  const shortenedEvmAddress = shortenAddress(evmAddress)

  const primaryAddress = evmAddress
  if (!primaryAddress) {
    throw new Error('No addresses to display')
  }

  const addresses: AddressItem[] = useMemo(() => {
    return [
      {
        image: <NetworkLogo chainId={null} size={20} />,
        address: shortenedEvmAddress,
        fullAddress: evmAddress,
        label: MAINNET_CHAIN_INFO.name,
      },
    ]
  }, [evmAddress, shortenedEvmAddress])

  return (
    <InfoTooltip
      enabled={addresses.length > 1}
      maxWidth={400}
      text={
        <Flex flexDirection="column" gap="$spacing12">
          {addresses.map((address, i) => (
            <TooltipAddressRow key={i} address={address} />
          ))}
        </Flex>
      }
      trigger={
        enableCopyAddress ? (
          <CopyHelper iconSize={iconSizes.icon12} iconPosition="right" toCopy={primaryAddress}>
            <AddressDisplay unitag={unitag} ensName={ENSName ?? undefined} shortenedEvmAddress={shortenedEvmAddress} />
          </CopyHelper>
        ) : (
          <AddressDisplay unitag={unitag} ensName={ENSName ?? undefined} shortenedEvmAddress={shortenedEvmAddress} />
        )
      }
    />
  )
}
