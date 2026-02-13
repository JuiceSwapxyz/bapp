import { SomeSwap } from "../lds-types/storage"

export const applyMigrationV4 = (swaps: Record<string, SomeSwap>): SomeSwap[] => {
    return Object.values(swaps).filter(swap => swap.version === 3 ).map((swap) => ({
        ...swap,
        version: 4,
        // @ts-expect-error - Migration from v3 mnemonic to v4 preimageSeed
        preimageSeed: swap.mnemonic,
        mnemonic: undefined,
    }))
}