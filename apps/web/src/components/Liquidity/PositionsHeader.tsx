import { PositionStatus } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { DropdownSelector } from 'components/DropdownSelector'
import { lpStatusConfig } from 'components/Liquidity/constants'
import { getProtocolStatusLabel } from 'components/Liquidity/utils/protocolVersion'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, LabeledCheckbox, Text } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { StatusIndicatorCircle } from 'ui/src/components/icons/StatusIndicatorCircle'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { selectIsCitreaOnlyEnabled } from 'uniswap/src/features/settings/selectors'

const StyledDropdownButton = {
  borderRadius: '$rounded16',
  py: '$padding8',
  px: '$padding12',
  backgroundColor: '$surface3',
  borderWidth: 0,
  hoverStyle: {
    ...ClickableTamaguiStyle.hoverStyle,
    backgroundColor: 'none',
  },
}

type PositionsHeaderProps = {
  showFilters?: boolean
  selectedChain: UniverseChainId | null
  selectedStatus?: PositionStatus[]
  onChainChange: (selectedChain: UniverseChainId | null) => void
  onStatusChange: (toggledStatus: PositionStatus) => void
}

export function PositionsHeader({
  showFilters = true,
  selectedChain,
  selectedStatus,
  onChainChange,
  onStatusChange,
}: PositionsHeaderProps) {
  const { t } = useTranslation()
  const { chains } = useEnabledChains()
  const navigate = useNavigate()
  const isCitreaOnlyEnabled = useSelector(selectIsCitreaOnlyEnabled)

  const statusFilterOptions = useMemo(() => {
    return [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE, PositionStatus.CLOSED].map((status) => {
      const config = lpStatusConfig[status]

      if (!config) {
        return <></>
      }

      return (
        <Flex
          key={`PositionsHeader-status-${status}`}
          row
          gap="$spacing8"
          width="100%"
          justifyContent="space-between"
          alignItems="center"
        >
          <StatusIndicatorCircle color={config.color} />
          <LabeledCheckbox
            py="$spacing4"
            size="$icon.18"
            hoverStyle={{ opacity: 0.8, backgroundColor: 'unset' }}
            containerStyle={{ flex: 1 }}
            checkboxPosition="end"
            checked={selectedStatus?.includes(status) ?? false}
            text={getProtocolStatusLabel(status, t)}
            onCheckPressed={() => onStatusChange(status)}
          />
        </Flex>
      )
    })
  }, [selectedStatus, onStatusChange, t])

  const [protocolDropdownOpen, setProtocolDropdownOpen] = useState(false)

  return (
    <Flex gap={16}>
      <Text variant="heading3">{t('pool.positions.title')}</Text>
      <Flex gap="$gap8" row $sm={{ flexDirection: 'column' }}>
        {showFilters && (
          <>
            <Flex
              row
              gap="$gap8"
              px="$padding16"
              backgroundColor="$neutral1"
              borderRadius="$rounded16"
              alignItems="center"
              $sm={{ justifyContent: 'center' }}
              justifyContent="flex-start"
              {...ClickableTamaguiStyle}
              onPress={() => {
                navigate('/positions/create/v3')
              }}
            >
              <Plus size={20} color="$surface1" />
              <Text color="$surface1" variant="buttonLabel3">
                {t('common.new')}
              </Text>
            </Flex>
            <Flex row alignItems="center" shrink height="100%" gap="$gap4">
              <DropdownSelector
                isOpen={protocolDropdownOpen}
                toggleOpen={() => {
                  setProtocolDropdownOpen((prev) => !prev)
                }}
                menuLabel={<Text variant="buttonLabel3">{t('common.status')}</Text>}
                dropdownStyle={{ width: 240 }}
                buttonStyle={StyledDropdownButton}
                alignRight={false}
              >
                {statusFilterOptions}
              </DropdownSelector>
              <Flex
                alignItems="center"
                justifyContent="center"
                backgroundColor="$surface3"
                borderRadius="$rounded16"
                px="$padding12"
                height="100%"
                {...ClickableTamaguiStyle}
              >
                <NetworkFilter
                  includeAllNetworks={!isCitreaOnlyEnabled}
                  selectedChain={selectedChain}
                  onPressChain={onChainChange}
                  chainIds={chains}
                  styles={{
                    buttonPaddingY: '$spacing8',
                  }}
                />
              </Flex>
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
}
