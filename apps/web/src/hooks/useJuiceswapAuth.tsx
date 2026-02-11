import { useAccount } from 'hooks/useAccount'
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  authenticate as authenticateJuiceswap,
  checkAuthentication,
  getTokenForAddress,
  setAuthForAddress,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { useSignMessage } from 'wagmi'

const JuiceswapAuthProviderContext = createContext<
  | {
      handleCheckAuthentication: () => Promise<boolean>
      handleAuthenticate: () => Promise<boolean>
      getIsAuthenticated: (address?: string) => boolean
      autenticationSignal: string
      isAuthenticated: boolean
    }
  | undefined
>(undefined)

export function JuiceswapAuthProvider({ children }: PropsWithChildren): JSX.Element {
  const account = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [autenticationSignal, setAutenticationSignal] = useState(Math.random().toString())

  const getIsAuthenticated = useCallback((address?: string) => {
    return !!address && Boolean(getTokenForAddress(address.toLowerCase()))
  }, [])

  const isAuthenticated = useMemo(() => {
    return getIsAuthenticated(account.address)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.address, autenticationSignal, getIsAuthenticated])

  const handleAuthenticate = useCallback(async (): Promise<boolean> => {
    try {
      if (!account.address) {
        return false
      }
      await authenticateJuiceswap(account.address, signMessageAsync)
      return true
    } catch (error) {
      return false
    } finally {
      setAutenticationSignal(Math.random().toString())
    }
  }, [account.address, signMessageAsync])

  const handleCheckAuthentication = useCallback(async (): Promise<boolean> => {
    try {
      if (!account.address) {
        setAuthForAddress('')
        return false
      }

      return await checkAuthentication(account.address)
    } catch (error) {
      return false
    } finally {
      setAutenticationSignal(Math.random().toString())
    }
  }, [account.address])

  useEffect(() => {
    handleCheckAuthentication()
  }, [handleCheckAuthentication])

  return (
    <JuiceswapAuthProviderContext.Provider
      value={{
        handleCheckAuthentication,
        handleAuthenticate,
        getIsAuthenticated,
        autenticationSignal,
        isAuthenticated,
      }}
    >
      {children}
    </JuiceswapAuthProviderContext.Provider>
  )
}

export function useJuiceswapAuth() {
  const context = useContext(JuiceswapAuthProviderContext)
  if (!context) {
    throw new Error('useJuiceswapAuth must be used within a JuiceswapAuthProvider')
  }
  return context
}
