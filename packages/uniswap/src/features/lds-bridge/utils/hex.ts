/**
 * Adds 0x prefix to a hex string if it doesn't already have it
 * @param val - Hex string
 * @returns Hex string with 0x prefix
 */
export const prefix0x = (val: string): string => {
  return val.startsWith('0x') ? val : `0x${val}`
}
