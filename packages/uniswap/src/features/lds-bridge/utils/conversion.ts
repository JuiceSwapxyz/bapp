import BigNumber from 'bignumber.js'

/**
 * Converts BTC to satoshis
 * @param btc - Amount in BTC
 * @returns Amount in satoshis
 */
export const btcToSat = (btc: BigNumber): BigNumber => {
  return btc.multipliedBy(100_000_000)
}

/**
 * Converts satoshis to wei (for EVM chains)
 * @param satoshis - Amount in satoshis
 * @returns Amount in wei as bigint
 */
export const satoshiToWei = (satoshis: number): bigint => {
  const weiFactor = BigInt(10 ** 10)
  return BigInt(satoshis) * weiFactor
}
