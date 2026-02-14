/* eslint-disable complexity */
import { forwardRef, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, useIsShortMobileDevice, useShakeAnimation } from 'ui/src'
import { AmountInputPresets } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/AmountInputPresets'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetAmountButton'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { CurrencyInputPanelBalance } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelBalance'
import { CurrencyInputPanelHeader } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelHeader'
import { CurrencyInputPanelInput } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelInput'
import { CurrencyInputPanelValue } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanelValue'
import { useIndicativeQuoteTextDisplay } from 'uniswap/src/components/CurrencyInputPanel/hooks/useIndicativeQuoteTextDisplay'
import type { CurrencyInputPanelProps, CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import type { Experiments } from 'uniswap/src/features/gating/experiments'
import { Layers, SwapPresetsProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValueFromLayer } from 'uniswap/src/features/gating/hooks'
import { useLocalizedFormatter } from 'uniswap/src/features/language/formatter'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { isExtension, isInterfaceDesktop, isMobileWeb } from 'utilities/src/platform'

export const CurrencyInputPanel = memo(
  forwardRef<CurrencyInputPanelRef, CurrencyInputPanelProps>(
    function _CurrencyInputPanel(props, forwardedRef): JSX.Element {
      const {
        autoFocus,
        currencyAmount,
        currencyBalance,
        currencyField,
        currencyInfo,
        focus,
        isFiatMode = false,
        showMaxButtonOnly = false,
        showSoftInputOnFocus = false,
        tokenColor,
        onPressIn,
        isLoading,
        valueIsIndicative,
        isIndicativeLoading,
        onSelectionChange: selectionChange,
        onSetExactAmount,
        onSetPresetValue,
        onShowTokenSelector,
        onToggleIsFiatMode,
        resetSelection,
        disabled = false,
        onPressDisabled,
        priceDifferencePercentage,
        headerLabel,
        transactionType,
        customPanelStyle,
        limits,
      } = props
      const { t } = useTranslation()
      const account = useWallet().evmAccount
      const isShortMobileDevice = useIsShortMobileDevice()

      const isInputPresetsEnabled = useExperimentValueFromLayer<Layers.SwapPage, Experiments.SwapPresets, boolean>({
        layerName: Layers.SwapPage,
        param: SwapPresetsProperties.InputEnabled,
        defaultValue: false,
      })
      const isOutputPresetsEnabled = useExperimentValueFromLayer<Layers.SwapPage, Experiments.SwapPresets, boolean>({
        layerName: Layers.SwapPage,
        param: SwapPresetsProperties.OutputEnabled,
        defaultValue: false,
      })

      const display = useIndicativeQuoteTextDisplay(props)
      const { value, usdValue } = display

      const isOutput = currencyField === CurrencyField.OUTPUT

      const showDefaultTokenOptions = isOutputPresetsEnabled && isOutput && !currencyInfo

      const showInsufficientBalanceWarning =
        !isOutput && !!currencyBalance && !!currencyAmount && currencyBalance.lessThan(currencyAmount)

      const showMaxButton = (!isInputPresetsEnabled || showMaxButtonOnly) && !isOutput && account
      const showPercentagePresetOptions =
        isInputPresetsEnabled && !showMaxButtonOnly && currencyField === CurrencyField.INPUT

      const isDesktop = isInterfaceDesktop || isExtension

      const showPercentagePresetsOnBottom = showPercentagePresetOptions && (isMobileWeb || (isDesktop && !headerLabel))

      const formatter = useLocalizedFormatter()
      const minLimitValue = limits?.min?.toExact()
      const maxLimitValue = limits?.max?.toExact()
      const formattedMinLimit = minLimitValue
        ? formatter.formatNumberOrString({ value: minLimitValue, type: NumberType.TokenNonTx })
        : undefined
      const formattedMaxLimit = maxLimitValue
        ? formatter.formatNumberOrString({ value: maxLimitValue, type: NumberType.TokenNonTx })
        : undefined

      const shakeAnimation = useShakeAnimation()
      const { triggerShakeAnimation } = shakeAnimation

      const onPressDisabledWithShakeAnimation = useCallback((): void => {
        onPressDisabled?.()
        triggerShakeAnimation()
      }, [onPressDisabled, triggerShakeAnimation])

      const handleSetPresetValue = useCallback(
        (amount: string, percentage: PresetPercentage) => {
          onSetPresetValue?.(amount, percentage)
        },
        [onSetPresetValue],
      )

      return (
        <TouchableArea
          group
          disabledStyle={{
            cursor: 'default',
          }}
          onPress={disabled ? onPressDisabledWithShakeAnimation : currencyInfo ? onPressIn : onShowTokenSelector}
        >
          <Flex
            {...customPanelStyle}
            overflow="hidden"
            px="$spacing16"
            py={isShortMobileDevice ? '$spacing8' : '$spacing16'}
          >
            <CurrencyInputPanelHeader
              headerLabel={headerLabel}
              currencyField={currencyField}
              currencyBalance={currencyBalance}
              currencyAmount={currencyAmount}
              currencyInfo={currencyInfo}
              showDefaultTokenOptions={showDefaultTokenOptions}
              onSetPresetValue={handleSetPresetValue}
            />
            <CurrencyInputPanelInput
              ref={forwardedRef}
              autoFocus={autoFocus}
              currencyAmount={currencyAmount}
              currencyBalance={currencyBalance}
              currencyField={currencyField}
              currencyInfo={currencyInfo}
              shakeAnimation={shakeAnimation}
              focus={focus}
              isLoading={isLoading}
              isFiatMode={isFiatMode}
              isIndicativeLoading={isIndicativeLoading}
              valueIsIndicative={valueIsIndicative}
              showSoftInputOnFocus={showSoftInputOnFocus}
              resetSelection={resetSelection}
              disabled={disabled}
              tokenColor={tokenColor}
              indicativeQuoteTextDisplay={display}
              showInsufficientBalanceWarning={showInsufficientBalanceWarning}
              showDefaultTokenOptions={showDefaultTokenOptions}
              onPressIn={onPressIn}
              onSelectionChange={selectionChange}
              onSetExactAmount={onSetExactAmount}
              onShowTokenSelector={onShowTokenSelector}
              onPressDisabledWithShakeAnimation={onPressDisabledWithShakeAnimation}
            />
            <Flex
              row
              alignItems="center"
              gap="$spacing8"
              mb={showPercentagePresetsOnBottom ? '$spacing6' : undefined}
              // maintain layout when balance is hidden
              {...(!currencyInfo && { opacity: 0, pointerEvents: 'none' })}
            >
              {showPercentagePresetsOnBottom && currencyBalance && !currencyAmount ? (
                <Flex position="absolute">
                  <AmountInputPresets
                    hoverLtr
                    buttonProps={{ py: '$spacing4' }}
                    currencyAmount={currencyAmount}
                    currencyBalance={currencyBalance}
                    onSetPresetValue={handleSetPresetValue}
                  />
                </Flex>
              ) : (
                <CurrencyInputPanelValue
                  disabled={disabled}
                  value={value}
                  usdValue={usdValue}
                  isFiatMode={isFiatMode}
                  priceDifferencePercentage={priceDifferencePercentage}
                  currencyInfo={currencyInfo}
                  currencyAmount={currencyAmount}
                  currencyField={currencyField}
                  onPressDisabledWithShakeAnimation={onPressDisabledWithShakeAnimation}
                  onToggleIsFiatMode={onToggleIsFiatMode}
                />
              )}
              {currencyInfo && (
                <Flex row centered ml="auto" gap="$spacing4" justifyContent="flex-end">
                  {!limits && (
                    <CurrencyInputPanelBalance
                      currencyField={currencyField}
                      currencyBalance={currencyBalance}
                      currencyInfo={currencyInfo}
                      showInsufficientBalanceWarning={showInsufficientBalanceWarning}
                    />
                  )}
                  {/* Max button */}
                  {showMaxButton && onSetPresetValue && !limits && (
                    <PresetAmountButton
                      percentage="max"
                      currencyAmount={currencyAmount}
                      currencyBalance={currencyBalance}
                      currencyField={currencyField}
                      transactionType={transactionType}
                      buttonProps={{
                        borderWidth: 0,
                      }}
                      onSetPresetValue={handleSetPresetValue}
                    />
                  )}
                  {formattedMinLimit &&
                    formattedMaxLimit &&
                    (disabled ? (
                      <Text variant="body3" color="$neutral2">
                        {t('common.limits')}: {formattedMinLimit} - {formattedMaxLimit}
                      </Text>
                    ) : (
                      <Flex row centered gap="$spacing8">
                        <TouchableArea onPress={() => onSetExactAmount(minLimitValue!)}>
                          <Flex
                            row
                            centered
                            gap="$spacing2"
                            hoverStyle={{
                              backgroundColor: '$accent2Hovered',
                            }}
                            borderRadius="$rounded12"
                            p="$spacing2"
                          >
                            <Button
                              size="xxsmall"
                              variant="branded"
                              emphasis="tertiary"
                              borderWidth={0}
                              minWidth="auto"
                              pressStyle={{
                                scale: 0.99,
                              }}
                              hoverStyle={{
                                scale: 1.02,
                              }}
                              onPress={() => onSetExactAmount(minLimitValue!)}
                            >
                              {t('common.min')}
                            </Button>
                            <Text variant="body4" color="$neutral2">
                              {formattedMinLimit}
                            </Text>
                          </Flex>
                        </TouchableArea>
                        <TouchableArea onPress={() => onSetExactAmount(maxLimitValue!)}>
                          <Flex
                            row
                            centered
                            gap="$spacing2"
                            hoverStyle={{
                              backgroundColor: '$accent2Hovered',
                            }}
                            borderRadius="$rounded12"
                            p="$spacing2"
                          >
                            <Button
                              size="xxsmall"
                              variant="branded"
                              emphasis="tertiary"
                              borderWidth={0}
                              minWidth="auto"
                              pressStyle={{
                                scale: 0.99,
                              }}
                              hoverStyle={{
                                scale: 1.02,
                              }}
                              onPress={() => onSetExactAmount(maxLimitValue!)}
                            >
                              {t('common.max')}
                            </Button>
                            <Text variant="body4" color="$neutral2">
                              {formattedMaxLimit}
                            </Text>
                          </Flex>
                        </TouchableArea>
                      </Flex>
                    ))}
                </Flex>
              )}
            </Flex>
          </Flex>
        </TouchableArea>
      )
    },
  ),
)
