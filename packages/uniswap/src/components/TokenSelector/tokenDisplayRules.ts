import { WETH9 } from '@juiceswapxyz/sdk-core'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isSvJusdAddress } from 'uniswap/src/features/tokens/jusdAbstraction'

type AddressChecker = (chainId: UniverseChainId, address: string) => boolean

const isWcBtcAddress: AddressChecker = (chainId, address) => {
  const wcBtcAddress = WETH9[chainId as unknown as number]?.address
  return wcBtcAddress ? address.toLowerCase() === wcBtcAddress.toLowerCase() : false
}

const HIDDEN_TOKENS: AddressChecker[] = [isSvJusdAddress]
const CONDITIONAL_TOKENS: AddressChecker[] = [isWcBtcAddress]

function matchesSearch(option: TokenOption, search: string): boolean {
  const { currency } = option.currencyInfo
  const lower = search.toLowerCase()
  return (
    currency.symbol?.toLowerCase().includes(lower) ||
    currency.name?.toLowerCase().includes(lower) ||
    (!currency.isNative && 'address' in currency && currency.address.toLowerCase().startsWith(lower)) ||
    false
  )
}

export function applyTokenDisplayRules(tokenOptions: TokenOption[], searchFilter?: string): TokenOption[] {
  return tokenOptions.filter((option) => {
    const { currency } = option.currencyInfo
    if (currency.isNative || !('address' in currency)) return true

    const chainId = currency.chainId as UniverseChainId
    const address = currency.address as string

    if (HIDDEN_TOKENS.some((check) => check(chainId, address))) return false

    if (CONDITIONAL_TOKENS.some((check) => check(chainId, address))) {
      return (
        Boolean(option.quantity && Number(option.quantity) > 0) ||
        (searchFilter && matchesSearch(option, searchFilter))
      )
    }

    return true
  })
}
