import { initialTransactionSettingsState } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/createTransactionSettingsStore'
import { isDefaultTradeRouteOptions } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/isDefaultTradeRouteOptions'

describe('createTransactionSettingsStore', () => {
  describe('initialTransactionSettingsState', () => {
    it('should have default values that pass isDefaultTradeRouteOptions validation', () => {
      const { selectedProtocols, isV4HookPoolsEnabled } = initialTransactionSettingsState

      const isDefault = isDefaultTradeRouteOptions({
        selectedProtocols,
        isV4HookPoolsEnabled,
      })

      expect(isDefault).toBe(true)
    })

    it('should pass validation even if isV4HookPoolsEnabled is false (parameter not used in validation)', () => {
      const { selectedProtocols } = initialTransactionSettingsState

      const isDefault = isDefaultTradeRouteOptions({
        selectedProtocols,
        isV4HookPoolsEnabled: false,
      })

      // isV4HookPoolsEnabled is not actually checked by isDefaultTradeRouteOptions
      expect(isDefault).toBe(true)
    })
  })
})
