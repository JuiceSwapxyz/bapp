import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { type PropsWithChildren, useMemo } from 'react'
import { SharedQueryClient } from 'uniswap/src/data/apiClients/SharedQueryClient'
import { sharedDehydrateOptions } from 'uniswap/src/data/apiClients/sharedDehydrateOptions'
import { MAX_REACT_QUERY_CACHE_TIME_MS } from 'utilities/src/time/time'

// Include cross-chain swaps flag in cache buster so cache is invalidated when flag changes
function getCacheBuster(): string {
  const crossChainEnabled = localStorage.getItem('crossChainSwapsOverride') === 'true'
  return `v0-crosschain-${crossChainEnabled}`
}

export function QueryClientPersistProvider({ children }: PropsWithChildren): JSX.Element {
  const persistOptions = useMemo(() => {
    return {
      // Cache buster includes flag status so entire cache is invalidated when flag changes
      buster: getCacheBuster(),
      maxAge: MAX_REACT_QUERY_CACHE_TIME_MS,
      persister: createSyncStoragePersister({ storage: localStorage }),
      dehydrateOptions: sharedDehydrateOptions,
    }
  }, [])

  return (
    <PersistQueryClientProvider client={SharedQueryClient} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  )
}
