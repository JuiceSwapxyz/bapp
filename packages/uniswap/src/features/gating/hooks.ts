import { DynamicConfigKeys } from 'uniswap/src/features/gating/configs'
import { ExperimentProperties, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { TypedReturn } from 'uniswap/src/features/gating/sdk/statsig'

export function useFeatureFlag(flag: FeatureFlags): boolean {
  // Disabled Statsig - return false for all feature flags
  return false
}

export function useFeatureFlagWithLoading(flag: FeatureFlags): { value: boolean; isLoading: boolean } {
  // Disabled Statsig - return false for all feature flags
  return { value: false, isLoading: false }
}

export function getFeatureFlag(flag: FeatureFlags): boolean {
  // Disabled Statsig - return false for all feature flags
  return false
}

export function useFeatureFlagWithExposureLoggingDisabled(flag: FeatureFlags): boolean {
  // Disabled Statsig - return false for all feature flags
  return false
}

export function getFeatureFlagWithExposureLoggingDisabled(flag: FeatureFlags): boolean {
  // Disabled Statsig - return false for all feature flags
  return false
}

export function useExperimentGroupNameWithLoading(experiment: Experiments): {
  value: string | null
  isLoading: boolean
} {
  // Disabled Statsig - return null for experiments
  return { value: null, isLoading: false }
}

export function useExperimentGroupName(experiment: Experiments): string | null {
  // Disabled Statsig - return null for experiments
  return null
}

export function useExperimentValue<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>({
  experiment,
  param,
  defaultValue,
  customTypeGuard,
}: {
  experiment: Exp
  param: Param
  defaultValue: ValType
  customTypeGuard?: (x: unknown) => x is ValType
}): ValType {
  // Disabled Statsig - return default value
  return defaultValue
}

export function getExperimentValue<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>({
  experiment,
  param,
  defaultValue,
  customTypeGuard,
}: {
  experiment: Exp
  param: Param
  defaultValue: ValType
  customTypeGuard?: (x: unknown) => x is ValType
}): ValType {
  // Disabled Statsig - return default value
  return defaultValue
}

export function useExperimentValueWithExposureLoggingDisabled<
  Exp extends keyof ExperimentProperties,
  Param extends ExperimentProperties[Exp],
  ValType,
>({
  experiment,
  param,
  defaultValue,
  customTypeGuard,
}: {
  experiment: Exp
  param: Param
  defaultValue: ValType
  customTypeGuard?: (x: unknown) => x is ValType
}): ValType {
  // Disabled Statsig - return default value
  return defaultValue
}

export function useDynamicConfigValue<
  Conf extends keyof DynamicConfigKeys,
  Key extends DynamicConfigKeys[Conf],
  ValType,
>({
  config,
  key,
  defaultValue,
  customTypeGuard,
}: {
  config: Conf
  key: Key
  defaultValue: ValType
  customTypeGuard?: (x: unknown) => x is ValType
}): ValType {
  // Disabled Statsig - return default value
  return defaultValue
}

export function getDynamicConfigValue<
  Conf extends keyof DynamicConfigKeys,
  Key extends DynamicConfigKeys[Conf],
  ValType,
>({
  config,
  key,
  defaultValue,
  customTypeGuard,
}: {
  config: Conf
  key: Key
  defaultValue: ValType
  customTypeGuard?: (x: unknown) => x is ValType
}): ValType {
  // Disabled Statsig - return default value
  return defaultValue
}

export function getExperimentValueFromLayer<Layer extends string, Exp extends keyof ExperimentProperties, ValType>({
  layerName,
  param,
  defaultValue,
  customTypeGuard,
}: {
  layerName: Layer
  param: ExperimentProperties[Exp]
  defaultValue: ValType
  customTypeGuard?: (x: unknown) => x is ValType
}): ValType {
  // Disabled Statsig - return default value
  return defaultValue
}

export function useExperimentValueFromLayer<Layer extends string, Exp extends keyof ExperimentProperties, ValType>({
  layerName,
  param,
  defaultValue,
  customTypeGuard,
}: {
  layerName: Layer
  param: ExperimentProperties[Exp]
  defaultValue: ValType
  customTypeGuard?: (x: unknown) => x is ValType
}): ValType {
  // Disabled Statsig - return default value
  return defaultValue
}

export function checkTypeGuard<ValType>({
  value,
  defaultValue,
  customTypeGuard,
}: {
  value: TypedReturn<ValType>
  defaultValue: ValType
  customTypeGuard?: (x: unknown) => x is ValType
}): ValType {
  const isOfDefaultValueType = (val: unknown): val is ValType => typeof val === typeof defaultValue

  if (customTypeGuard?.(value) || isOfDefaultValueType(value)) {
    return value
  } else {
    return defaultValue
  }
}

export function useStatsigClientStatus(): {
  isStatsigLoading: boolean
  isStatsigReady: boolean
  isStatsigUninitialized: boolean
} {
  // Disabled Statsig - return ready status
  return {
    isStatsigLoading: false,
    isStatsigReady: true,
    isStatsigUninitialized: false,
  }
}
