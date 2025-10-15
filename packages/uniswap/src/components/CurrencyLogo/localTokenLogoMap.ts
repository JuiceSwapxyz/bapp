import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'

const WCBTC_ADDRESS = '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0'
const TFC_ADDRESS = '0x14ADf6B87096Ef750a956756BA191fc6BE94e473'
const cUSD_ADDRESS = '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0'
const NUSD_ADDRESS = '0x9B28B690550522608890C3C7e63c0b4A7eBab9AA'
const USDC_ADDRESS = '0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F'

export const getLocalTokenLogoUrlByAddress = (tokenAddress: string | undefined): string | undefined => {
  switch (tokenAddress) {
    case WCBTC_ADDRESS.toLowerCase():
    case ZERO_ADDRESS:
      return 'https://docs.juiceswap.com/media/icons/cbtc.png'
    case TFC_ADDRESS.toLowerCase():
      return 'https://docs.juiceswap.com/media/icons/tfc.png'
    case cUSD_ADDRESS.toLowerCase():
      return 'https://docs.juiceswap.com/media/icons/cusd.png'
    case NUSD_ADDRESS.toLowerCase():
      return 'https://docs.juiceswap.com/media/icons/nusd.png'
    case USDC_ADDRESS.toLowerCase():
      return 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png'

    default:
      return undefined
  }
}
