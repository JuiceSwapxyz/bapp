const BASE_URL = 'https://blockstream.info/api'

export const fetchBlockTipHeight = async (): Promise<number> => {
  return await fetch(`${BASE_URL}/blocks/tip/height`)
    .then((response) => response.text())
    .then((height) => parseInt(height, 10))
}
