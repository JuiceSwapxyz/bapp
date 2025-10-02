import { getExternalEVMWalletService } from 'features/wallet/services/ExternalEVMWalletService'
import { useAccount } from 'hooks/useAccount'
import { PropsWithChildren, useMemo } from 'react'
import { WalletProvider } from 'uniswap/src/features/wallet/contexts/WalletProvider'
import { createWalletService } from 'uniswap/src/features/wallet/services/createWalletService'

export function ExternalWalletProvider({ children }: PropsWithChildren): JSX.Element {
  const evmAccountAddress = useAccount().address

  const walletService = useMemo(
    () =>
      createWalletService({
        evmWalletService: getExternalEVMWalletService(),
        svmWalletService: undefined,
      }),
    [],
  )

  return (
    <WalletProvider walletService={walletService} evmAddress={evmAccountAddress} svmAddress={undefined}>
      {children}
    </WalletProvider>
  )
}
