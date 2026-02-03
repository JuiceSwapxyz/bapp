import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AssetLogoBaseProps } from 'components/Logo/AssetLogo'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useLaunchpadTokenLogoUrl } from 'hooks/useLaunchpadTokens'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { TokenStat } from 'state/explore/types'
import { getLocalTokenLogoUrlByAddress } from 'uniswap/src/components/CurrencyLogo/localTokenLogoMap'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getLogoUrlBySymbol, getTokenLogoFromRegistry } from 'uniswap/src/features/tokens/tokenRegistry'
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

  // Launchpad token logo - resolved from metadata when token is from launchpad
  const launchpadLogoUrl = useLaunchpadTokenLogoUrl(props.token?.address, chainId)

  const logoUrl = useMemo(() => {
    const { token } = props
    const candidates = [
      token?.logo,
      token?.project?.logo?.url,
      token?.address ? getLocalTokenLogoUrlByAddress(token.address.toLowerCase()) : undefined,
      getLogoUrlBySymbol(token?.symbol),
      token?.address ? getTokenLogoFromRegistry(chainId as UniverseChainId, token.address) : undefined,
      launchpadLogoUrl,
    ]
    return candidates.find(Boolean) ?? undefined
  }, [
    props.token,
    props.token?.logo,
    props.token?.project?.logo?.url,
    props.token?.address,
    props.token?.symbol,
    chainId,
    launchpadLogoUrl,
  ])

  return <PortfolioLogo currencies={currencies} chainId={chainId} images={[logoUrl]} {...props} />
}
