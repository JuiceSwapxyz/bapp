import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AssetLogoBaseProps } from 'components/Logo/AssetLogo'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { TokenStat } from 'state/explore/types'
import { getLocalTokenLogoUrlByAddress } from 'uniswap/src/components/CurrencyLogo/localTokenLogoMap'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TokenStat
  },
) {
  const chainId = getChainIdFromChainUrlParam(props.token?.chain.toLowerCase()) ?? UniverseChainId.Mainnet
  const isNative = props.token?.address === NATIVE_CHAIN_ID

  const nativeCurrency = useNativeCurrency(chainId)
  const currency = isNative ? nativeCurrency : undefined

  const currencies = useMemo(() => (!isNative ? undefined : [currency]), [currency, isNative])

  // Use logo URL with fallback to project logo URL for compatibility with different token data structures
  const logoUrl = useMemo(() => {
    if (props.token?.logo) {
      return props.token.logo
    }
    // Fallback to project.logo.url structure used in GraphQL responses
    if (props.token?.project?.logo?.url) {
      return props.token.project.logo.url
    }

    const urlFromAddress = props.token?.address
      ? getLocalTokenLogoUrlByAddress(props.token.address.toLowerCase())
      : undefined
    if (urlFromAddress) {
      return urlFromAddress
    }

    return undefined
  }, [props.token?.logo, props.token?.project?.logo?.url, props.token?.address])

  return <PortfolioLogo currencies={currencies} chainId={chainId} images={[logoUrl]} {...props} />
}
