import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { atomWithStorage } from 'jotai/utils'
import { useCallback } from 'react'

export interface PfpEntry {
  imageUrl: string
  contract: string
  tokenId: string
}

const pfpMapAtom = atomWithStorage<Record<string, PfpEntry>>('juicePfp', {})

export function usePfp(address?: string): PfpEntry | undefined {
  const map = useAtomValue(pfpMapAtom)
  if (!address) {
    return undefined
  }
  return map[address.toLowerCase()]
}

export function useSetPfp() {
  const setMap = useUpdateAtom(pfpMapAtom)
  return useCallback(
    (address: string, entry: PfpEntry | null) => {
      const key = address.toLowerCase()
      setMap((prev) => {
        const next = { ...prev }
        if (entry === null) {
          delete next[key]
        } else {
          next[key] = entry
        }
        return next
      })
    },
    [setMap],
  )
}
