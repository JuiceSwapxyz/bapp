import { useEvent } from 'utilities/src/react/hooks'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useDisconnect as useDisconnectWagmi } from 'wagmi'

export function useDisconnect(): () => void {
  const { disconnect: disconnectWagmi, connectors } = useDisconnectWagmi()

  return useEvent(() => {
    connectors.forEach((connector) => disconnectWagmi({ connector }))
  })
}
