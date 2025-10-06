import { fork } from 'typed-redux-saga'
import { watchTransactionEvents } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'

export function* telemetrySaga() {
  // Amplitude analytics disabled for JuiceSwap - skip initialization
  // Only keep transaction event watching
  yield* fork(watchTransactionEvents)
}
