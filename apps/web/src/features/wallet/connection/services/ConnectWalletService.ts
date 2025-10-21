import type { CustomConnectorId } from 'features/wallet/connection/connectors/custom'
import type {
  CustomWalletConnectorMeta,
  WagmiWalletConnectorMeta,
  WalletConnectorMeta,
} from 'features/wallet/connection/types/WalletConnectorMeta'

export interface ConnectWalletService {
  connect(params: { walletConnector: WalletConnectorMeta }): Promise<void>
}

interface CreateConnectWalletServiceContext {
  connectWagmiWallet: (connector: WagmiWalletConnectorMeta) => Promise<void>
  connectCustomWalletsMap: Record<CustomConnectorId, (connector: CustomWalletConnectorMeta) => Promise<void>>
}

export function createConnectWalletService(ctx: CreateConnectWalletServiceContext): ConnectWalletService {
  const { connectWagmiWallet, connectCustomWalletsMap } = ctx

  return {
    connect: async (params: { walletConnector: WalletConnectorMeta }) => {
      const { customConnectorId, wagmi } = params.walletConnector
      if (customConnectorId) {
        const connectCustomWallet = connectCustomWalletsMap[customConnectorId]
        await connectCustomWallet({ ...params.walletConnector, customConnectorId })
      }

      if (wagmi?.id) {
        await connectWagmiWallet({ ...params.walletConnector, wagmi })
      }
    },
  }
}
