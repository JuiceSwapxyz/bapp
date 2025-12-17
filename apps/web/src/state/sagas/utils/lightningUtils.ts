export const btcToSat = (btc: BigNumber): BigNumber => {
  return btc.multipliedBy(100_000_000)
}
