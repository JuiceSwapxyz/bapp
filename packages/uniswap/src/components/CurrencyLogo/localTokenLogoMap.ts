import { ADDRESS } from '@juicedollar/jusd'
import { ChainId, WETH9 } from '@juiceswapxyz/sdk-core'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const WCBTC_ADDRESS = WETH9[ChainId.CITREA_TESTNET]!.address
const TFC_ADDRESS = '0x14ADf6B87096Ef750a956756BA191fc6BE94e473'
const cUSD_ADDRESS = '0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0'
const NUSD_ADDRESS = '0x9B28B690550522608890C3C7e63c0b4A7eBab9AA'
const USDC_ADDRESS = '0x36c16eaC6B0Ba6c50f494914ff015fCa95B7835F'
const JUSD_CITREA_TESTNET = ADDRESS[5115]!.juiceDollar

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
    case JUSD_CITREA_TESTNET.toLowerCase():
      return 'https://docs.juiceswap.com/media/icons/jusd.png'

    default:
      return undefined
  }
}
