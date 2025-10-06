/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action, AnyAction, PreloadedState, Reducer, StoreEnhancerStoreCreator } from 'redux'
import { NotImplementedError } from 'utilities/src/errors'
import { ReduxEnhancerConfig } from 'utilities/src/logger/datadog/Datadog'
import { LogLevel, LoggerErrorContext } from 'utilities/src/logger/types'

export function logToDatadog(
  _message: string,
  _options: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  // Datadog logging disabled for JuiceSwap
  return
}

export function logWarningToDatadog(
  _message: string,
  _options: {
    level: LogLevel
    args: unknown[]
    fileName: string
    functionName: string
  },
): void {
  // Datadog logging disabled for JuiceSwap
  return
}

export function logErrorToDatadog(_error: Error, _context?: LoggerErrorContext): void {
  // Datadog logging disabled for JuiceSwap
  return
}

export function attachUnhandledRejectionHandler(): void {
  throw new NotImplementedError('attachUnhandledRejectionHandler')
}

export async function setAttributesToDatadog(_attributes: { [key: string]: unknown }): Promise<void> {
  throw new NotImplementedError('setAttributes')
}

// Inspired by Sentry createReduxEnhancer
// https://github.com/getsentry/sentry-javascript/blob/master/packages/react/src/redux.ts
export function createDatadogReduxEnhancer({
  shouldLogReduxState: _shouldLogReduxState,
}: ReduxEnhancerConfig): (next: StoreEnhancerStoreCreator) => StoreEnhancerStoreCreator {
  return (next: StoreEnhancerStoreCreator): StoreEnhancerStoreCreator =>
    <S = any, A extends Action = AnyAction>(reducer: Reducer<S, A>, initialState?: PreloadedState<S>) => {
      // Datadog logging disabled for JuiceSwap - no redux action logging
      return next(reducer, initialState)
    }
}
