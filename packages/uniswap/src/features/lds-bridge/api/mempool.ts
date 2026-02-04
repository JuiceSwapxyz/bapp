import type { BitcoinAddressTransactions } from 'uniswap/src/features/lds-bridge/lds-types/api'

const BASE_URL = 'https://blockstream.info/api'

export const fetchBlockTipHeight = async (): Promise<number> => {
  return await fetch(`${BASE_URL}/blocks/tip/height`)
    .then((response) => response.text())
    .then((height) => parseInt(height, 10))
}

export const fetchTransactionByAddress = async (address: string): Promise<BitcoinAddressTransactions> => {
  return await fetch(`${BASE_URL}/address/${address}/txs`)
    .then((response) => response.json())
}