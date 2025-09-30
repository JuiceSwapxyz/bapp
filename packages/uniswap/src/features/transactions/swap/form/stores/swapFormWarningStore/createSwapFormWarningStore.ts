import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SwapFormWarningStoreState = {
  isTokenWarningModalVisible: boolean
  isBridgingWarningModalVisible: boolean
  isMaxNativeTransferModalVisible: boolean
  isViewOnlyModalVisible: boolean
  isRateLimitModalVisible: boolean
  rateLimitEndTime: number | null
  actions: {
    handleShowTokenWarningModal: () => void
    handleHideTokenWarningModal: () => void
    handleShowBridgingWarningModal: () => void
    handleHideBridgingWarningModal: () => void
    handleShowMaxNativeTransferModal: () => void
    handleHideMaxNativeTransferModal: () => void
    handleShowViewOnlyModal: () => void
    handleHideViewOnlyModal: () => void
    handleShowRateLimitModal: () => void
    handleHideRateLimitModal: () => void
  }
}

export type SwapFormWarningStore = UseBoundStore<StoreApi<SwapFormWarningStoreState>>

export const createSwapFormWarningStore = (): SwapFormWarningStore =>
  create<SwapFormWarningStoreState>()(
    devtools(
      (set) => ({
        isTokenWarningModalVisible: false,
        isBridgingWarningModalVisible: false,
        isMaxNativeTransferModalVisible: false,
        isViewOnlyModalVisible: false,
        isRateLimitModalVisible: false,
        rateLimitEndTime: null,
        actions: {
          handleShowTokenWarningModal: (): void => set({ isTokenWarningModalVisible: true }),
          handleHideTokenWarningModal: (): void => set({ isTokenWarningModalVisible: false }),
          handleShowBridgingWarningModal: (): void => set({ isBridgingWarningModalVisible: true }),
          handleHideBridgingWarningModal: (): void => set({ isBridgingWarningModalVisible: false }),
          handleShowMaxNativeTransferModal: (): void => set({ isMaxNativeTransferModalVisible: true }),
          handleHideMaxNativeTransferModal: (): void => set({ isMaxNativeTransferModalVisible: false }),
          handleShowViewOnlyModal: (): void => set({ isViewOnlyModalVisible: true }),
          handleHideViewOnlyModal: (): void => set({ isViewOnlyModalVisible: false }),
          handleShowRateLimitModal: (): void =>
            set({ isRateLimitModalVisible: true, rateLimitEndTime: Date.now() + 60000 }),
          handleHideRateLimitModal: (): void => set({ isRateLimitModalVisible: false, rateLimitEndTime: null }),
        },
      }),
      {
        name: 'useSwapFormWarningStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
