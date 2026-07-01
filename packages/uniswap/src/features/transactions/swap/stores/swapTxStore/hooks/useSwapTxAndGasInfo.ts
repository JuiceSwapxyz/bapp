import { useMemo } from 'react'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { useTokenApprovalInfo } from 'uniswap/src/features/transactions/swap/review/hooks/useTokenApprovalInfo'
import { getUniswapXSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/uniswapx/utils'
import {
  getBitcoinBridgeSwapTxAndGasInfo,
  getBridgeSwapTxAndGasInfo,
  getClassicSwapTxAndGasInfo,
  getFallbackSwapTxAndGasInfo,
  getLightningBridgeSwapTxAndGasInfo,
  getWrapTxAndGasInfo,
  usePermitTxInfo,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { useJusdDirectPoolSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/useJusdDirectPoolSwapTxAndGasInfo'
import { useTransactionRequestInfo } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/hooks/useTransactionRequestInfo'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type {
  BitcoinBridgeTrade,
  BridgeTrade,
  ClassicTrade,
  LightningBridgeTrade,
  UniswapXTrade,
  WrapTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import type { JusdDirectPoolTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isGatewayJusd, isJusdDirectPool, isSatsuma } from 'uniswap/src/features/transactions/swap/utils/routing'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { CurrencyField } from 'uniswap/src/types/currency'

export function useSwapTxAndGasInfo({
  derivedSwapInfo,
  account,
  bitcoinDestinationAddress,
}: {
  derivedSwapInfo: DerivedSwapInfo
  account?: AccountDetails
  bitcoinDestinationAddress?: string
}): SwapTxAndGasInfo {
  const {
    chainId,
    wrapType,
    currencyAmounts,
    trade: { trade },
  } = derivedSwapInfo

  const approvalTxInfo = useTokenApprovalInfo({
    account,
    chainId,
    wrapType,
    currencyInAmount: currencyAmounts[CurrencyField.INPUT],
    currencyOutAmount: currencyAmounts[CurrencyField.OUTPUT],
    routing: trade?.routing,
  })
  const { tokenApprovalInfo } = approvalTxInfo

  // TODO(MOB-3425) decouple wrap tx from swap tx to simplify UniswapX code
  const swapTxInfo = useTransactionRequestInfo({
    derivedSwapInfo,
    tokenApprovalInfo,
  })

  const permitTxInfo = usePermitTxInfo({ quote: trade?.quote })

  // Direct-pool JUSD-sell fallback: built entirely client-side (no api call). The hook no-ops when
  // the trade isn't a direct-pool trade, so it's safe to call unconditionally.
  const directPoolTxAndGasInfo = useJusdDirectPoolSwapTxAndGasInfo(
    trade && isJusdDirectPool(trade) ? (trade as JusdDirectPoolTrade) : undefined,
  )

  return useMemo(() => {
    // Early return if trade is null/undefined to avoid accessing properties on null
    if (!trade) {
      return getFallbackSwapTxAndGasInfo({ swapTxInfo, approvalTxInfo })
    }

    if (isJusdDirectPool(trade) && directPoolTxAndGasInfo) {
      return directPoolTxAndGasInfo
    }

    // Handle Gateway JUSD and Satsuma routing (string literals, not in the
    // Routing enum). Both go through the JuiceSwap API /swap endpoint and
    // produce a single ERC20-router call, so downstream we wrap them as a
    // Classic swap context. Without this branch, Satsuma trades fall through
    // to `getFallbackSwapTxAndGasInfo` *and* `useTransactionRequestInfo`
    // never fires `/v1/swap` for them, so `txRequests` stays undefined and
    // the review button is stuck on "Loading quote..." forever.
    if (isGatewayJusd(trade) || isSatsuma(trade)) {
      return getClassicSwapTxAndGasInfo({
        trade: trade as unknown as ClassicTrade,
        swapTxInfo,
        approvalTxInfo,
        permitTxInfo,
      })
    }

    switch (trade.routing) {
      case Routing.DUTCH_V2:
      case Routing.DUTCH_V3:
      case Routing.PRIORITY:
        return getUniswapXSwapTxAndGasInfo({ trade: trade as UniswapXTrade, swapTxInfo, approvalTxInfo })
      case 'BITCOIN_BRIDGE' as Routing:
        return getBitcoinBridgeSwapTxAndGasInfo({
          trade: trade as BitcoinBridgeTrade,
          swapTxInfo,
          approvalTxInfo,
          destinationAddress: bitcoinDestinationAddress,
        })
      case 'LN_BRIDGE' as Routing:
        return getLightningBridgeSwapTxAndGasInfo({
          trade: trade as LightningBridgeTrade,
          swapTxInfo,
          approvalTxInfo,
          destinationAddress: bitcoinDestinationAddress,
        })
      case Routing.BRIDGE:
      case Routing.ERC20_CHAIN_SWAP:
      case Routing.WBTC_BRIDGE:
        return getBridgeSwapTxAndGasInfo({ trade: trade as BridgeTrade, swapTxInfo, approvalTxInfo })
      case Routing.CLASSIC:
        return getClassicSwapTxAndGasInfo({ trade: trade as ClassicTrade, swapTxInfo, approvalTxInfo, permitTxInfo })
      case Routing.WRAP:
      case Routing.UNWRAP:
        return getWrapTxAndGasInfo({ trade: trade as WrapTrade, swapTxInfo })
      default:
        return getFallbackSwapTxAndGasInfo({ swapTxInfo, approvalTxInfo })
    }
  }, [approvalTxInfo, permitTxInfo, swapTxInfo, trade, bitcoinDestinationAddress, directPoolTxAndGasInfo])
}
