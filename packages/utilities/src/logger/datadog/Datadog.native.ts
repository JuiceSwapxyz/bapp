/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action, AnyAction, PreloadedState, Reducer, StoreEnhancerStoreCreator } from 'redux'
import { ReduxEnhancerConfig } from 'utilities/src/logger/datadog/Datadog'
import { LogLevel, LoggerErrorContext } from 'utilities/src/logger/types'

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

export function logErrorToDatadog(_error: Error, _context: LoggerErrorContext): void {
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

/*
 * This is heavily influenced by the sentry implementation of this functionality
 * https://github.com/getsentry/sentry-react-native/blob/0abe24e037e7272178f36ffc7a5c6e295e039650/src/js/integrations/reactnativeerrorhandlersutils.ts
 *
 * This function is used to attach a handler to the global promise rejection event
 * and log the error to the logger, which will send it to datadog
 */
export function attachUnhandledRejectionHandler(): void {
  // Datadog logging disabled for JuiceSwap - no unhandled rejection tracking
  return
}

export async function setAttributesToDatadog(_attributes: { [key: string]: unknown }): Promise<void> {
  // Datadog logging disabled for JuiceSwap
  return
}
