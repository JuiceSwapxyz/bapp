import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { getProtocolVersionLabel } from 'components/Liquidity/utils/protocolVersion'
import { atom, useAtom } from 'jotai'
import { useCallback, useMemo, useState } from 'react'
import { Check } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia, useSporeColors } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

// Default to V3 only
export const exploreProtocolVersionFilterAtom = atom(ProtocolVersion.V3)
// Only show V3 pools
const PROTOCOL_VERSIONS = [ProtocolVersion.V3]

function ProtocolFilter() {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [open, setOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useAtom(exploreProtocolVersionFilterAtom)
  const media = useMedia()

  const onVersionChange = useCallback(
    (protocol: ProtocolVersion) => {
      setSelectedProtocol(protocol)
      setOpen(false)
    },
    [setSelectedProtocol],
  )

  const versionFilterOptions = useMemo(() => {
    return PROTOCOL_VERSIONS.map((option) => (
      <InternalMenuItem key={`ExplorePools-version-${option}`} onPress={() => onVersionChange(option)}>
        {option === ProtocolVersion.UNSPECIFIED ? t('common.all') : getProtocolVersionLabel(option)}
        {selectedProtocol === option && <Check size={16} color={colors.accent1.val} />}
      </InternalMenuItem>
    ))
  }, [selectedProtocol, onVersionChange, colors, t])

  return (
    <Flex>
      <Trace modal={ModalName.ExploreProtocolFilter}>
        <DropdownSelector
          isOpen={open}
          toggleOpen={() => setOpen((prev) => !prev)}
          menuLabel={
            <Text variant="buttonLabel3" width="max-content">
              {selectedProtocol === ProtocolVersion.UNSPECIFIED
                ? t('common.protocol')
                : getProtocolVersionLabel(selectedProtocol)}
            </Text>
          }
          dropdownStyle={{ width: 160 }}
          buttonStyle={{ height: 40, width: 'max-content' }}
          allowFlip
          alignRight={!media.lg}
        >
          {versionFilterOptions}
        </DropdownSelector>
      </Trace>
    </Flex>
  )
}

// eslint-disable-next-line import/no-unused-modules
export default ProtocolFilter
