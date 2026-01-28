import { ADDRESS } from '@juicedollar/jusd'
import { ChainId, WETH9 } from '@juiceswapxyz/sdk-core'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const WCBTC_ADDRESS = WETH9[ChainId.CITREA_TESTNET]!.address
const JUSD_CITREA_TESTNET = ADDRESS[5115]!.juiceDollar

export const getLocalTokenLogoUrlByAddress = (tokenAddress: string | undefined): string | undefined => {
  switch (tokenAddress) {
    case WCBTC_ADDRESS.toLowerCase():
    case ZERO_ADDRESS:
      return 'https://docs.juiceswap.com/media/icons/cbtc.png'
    case JUSD_CITREA_TESTNET.toLowerCase():
      return 'https://docs.juiceswap.com/media/icons/jusd.png'

    default:
      return undefined
  }
}
