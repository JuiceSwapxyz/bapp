import { StatsigClientEventCallback, StatsigLoadingStatus } from '@statsig/client-core'
import { useEffect, useMemo, useState } from 'react'
import { DynamicConfigKeys } from 'uniswap/src/features/gating/configs'
import { ExperimentProperties, Experiments } from 'uniswap/src/features/gating/experiments'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import {
  TypedReturn,
  getStatsigClient,
  useDynamicConfig,
  useExperiment,
  useLayer,
  useStatsigClient,
} from 'uniswap/src/features/gating/sdk/statsig'

export function useFeatureFlag(_flag: FeatureFlags): boolean {
  return false
}

export function useFeatureFlagWithLoading(flag: FeatureFlags): { value: boolean; isLoading: boolean } {
  const { isStatsigLoading } = useStatsigClientStatus()
  return { value: false, isLoading: isStatsigLoading }
}

export function getFeatureFlag(_flag: FeatureFlags): boolean {
  return false
}

export function useFeatureFlagWithExposureLoggingDisabled(_flag: FeatureFlags): boolean {
  return false
}

export function getFeatureFlagWithExposureLoggingDisabled(_flag: FeatureFlags): boolean {
  return false
}

export function useExperimentGroupNameWithLoading(experiment: Experiments): {
  value: string | null
  isLoading: boolean
} {
  const { isStatsigLoading } = useStatsigClientStatus()
  const statsigExperiment = useExperiment(experiment)
  return { value: statsigExperiment.groupName, isLoading: isStatsigLoading }
}

export function useExperimentGroupName(experiment: Experiments): string | null {
  const { groupName } = useExperiment(experiment)
  return groupName
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
  const statsigExperiment = useExperiment(experiment)
  const value = statsigExperiment.get(param, defaultValue)
  return checkTypeGuard({ value, defaultValue, customTypeGuard })
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
  const statsigExperiment = getStatsigClient().getExperiment(experiment)
  const value = statsigExperiment.get(param, defaultValue)
  return checkTypeGuard({ value, defaultValue, customTypeGuard })
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
  const statsigExperiment = useExperiment(experiment, { disableExposureLog: true })
  const value = statsigExperiment.get(param, defaultValue)
  return checkTypeGuard({ value, defaultValue, customTypeGuard })
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
  const dynamicConfig = useDynamicConfig(config)
  const value = dynamicConfig.get(key, defaultValue)
  return checkTypeGuard({ value, defaultValue, customTypeGuard })
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
  const dynamicConfig = getStatsigClient().getDynamicConfig(config)
  const value = dynamicConfig.get(key, defaultValue)
  return checkTypeGuard({ value, defaultValue, customTypeGuard })
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
  const layer = getStatsigClient().getLayer(layerName)
  const value = layer.get(param, defaultValue)
  // we directly get param from layer; these are spread from experiments
  return checkTypeGuard({ value, defaultValue, customTypeGuard })
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
  const layer = useLayer(layerName)
  const value = layer.get(param, defaultValue)
  // we directly get param from layer; these are spread from experiments
  return checkTypeGuard({ value, defaultValue, customTypeGuard })
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
  const { client } = useStatsigClient()
  const [statsigStatus, setStatsigStatus] = useState<StatsigLoadingStatus>(client.loadingStatus)

  useEffect(() => {
    const handler: StatsigClientEventCallback<'values_updated'> = (event) => {
      setStatsigStatus(event.status)
    }
    client.on('values_updated', handler)
    return () => {
      client.off('values_updated', handler)
    }
  }, [client])

  return useMemo(
    () => ({
      isStatsigLoading: statsigStatus === 'Loading',
      isStatsigReady: statsigStatus === 'Ready',
      isStatsigUninitialized: statsigStatus === 'Uninitialized',
    }),
    [statsigStatus],
  )
}
