import { atom } from 'jotai'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

// Note:
// We should consider a generic sessionStorage abstraction if this pattern becomes common. (i.e., Future promo dismissals like the tax service discounts or Fiat Onramp launch notification may use this.)
// This would be something similar to the current feature flag implementation, but utilizing session instead
//
// Motivation:
// NFT features have been disabled to remove OpenSea dependencies
const storage = createJSONStorage(() => sessionStorage)
const persistStorage = createJSONStorage(() => localStorage)

// NFTs are now permanently disabled
export const shouldDisableNFTRoutesAtom = atom(true)
export const hideMobileAppPromoBannerAtom = atomWithStorage('hideMobileAppPromoBanner', false, storage)
export const persistHideMobileAppPromoBannerAtom = atomWithStorage(
  'persistHideMobileAppPromoBanner',
  false,
  persistStorage,
)
