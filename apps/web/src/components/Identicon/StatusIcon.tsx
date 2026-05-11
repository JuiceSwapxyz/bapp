import sockImg from 'assets/svg/socks.svg'
import Identicon from 'components/Identicon'
import { usePfp } from 'components/Identicon/usePfp'
import { WebFeatureFlags } from 'constants/featureFlags'
import { useHasSocks } from 'hooks/useSocksBalance'
import styled from 'lib/styled-components'
import { flexColumnNoWrap } from 'theme/styles'
import { breakpoints } from 'ui/src/theme'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

const IconWrapper = styled.div<{ size?: number }>`
  position: relative;
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  @media only screen and (min-width: ${breakpoints.xl}px) {
    margin-right: 4px;
  }
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

const MiniIconContainer = styled.div<{ side: 'left' | 'right' }>`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  bottom: -4px;
  ${({ side }) => `${side === 'left' ? 'left' : 'right'}: -4px;`}
  border-radius: 50%;
  outline: 2px solid ${({ theme }) => theme.surface1};
  outline-offset: -0.1px;
  background-color: ${({ theme }) => theme.surface1};
  overflow: hidden;
  @supports (overflow: clip) {
    overflow: clip;
  }
`

const MiniImg = styled.img`
  width: 16px;
  height: 16px;
`

const PfpImg = styled.img<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
  object-fit: cover;
`

function Socks() {
  return (
    <MiniIconContainer side="left">
      <MiniImg src={sockImg} />
    </MiniIconContainer>
  )
}

export default function StatusIcon({
  size = 16,
  showMiniIcons = true,
  address,
}: {
  size?: number
  showMiniIcons?: boolean
  address?: string
}) {
  const account = useWallet().evmAccount
  const effectiveAddress = address ?? account?.address
  const pfp = usePfp(effectiveAddress)
  const hasSocks = useHasSocks()
  const showPfp = WebFeatureFlags.JUICE_POINTS_PROGRAM && pfp
  return (
    <IconWrapper size={size} data-testid="StatusIconRoot">
      {showPfp ? (
        <PfpImg src={pfp.imageUrl} size={size} alt="" />
      ) : (
        <Identicon account={effectiveAddress} size={size} />
      )}
      {/* Disabled to prevent missing wallet icon errors */}
      {/* {showMiniIcons && <MiniWalletIcon />} */}
      {hasSocks && showMiniIcons && <Socks />}
    </IconWrapper>
  )
}
