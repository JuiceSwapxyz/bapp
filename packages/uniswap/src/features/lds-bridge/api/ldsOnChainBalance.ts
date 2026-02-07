import { Contract } from 'ethers/lib/ethers'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { USDC, USDT, USDT_POLYGON, WBTC } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { getJusdAddress } from 'uniswap/src/features/tokens/jusdAbstraction'
import { LDS_ADDRESS, WBTC_E_ADDRESSES } from '../constants'

const CITREA_CHAIN_IDS = [UniverseChainId.CitreaMainnet, UniverseChainId.CitreaTestnet]

function isCitreaChainId(chainId: number): boolean {
  return CITREA_CHAIN_IDS.includes(chainId as UniverseChainId)
}

export async function fetchLdsOnChainBalance(
  chainId: number,
  symbol: string,
): Promise<number | undefined> {
  try {
    const chainInfo = getChainInfo(chainId)
    if (chainInfo.platform !== Platform.EVM) return undefined
    const provider = createEthersProvider({ chainId })
    if (!provider) return undefined

    if (isCitreaChainId(chainId) && symbol === 'cBTC') {
      const wei = await provider.getBalance(LDS_ADDRESS)
      const btcEquivalent = Number(wei) / 1e18
      return btcEquivalent * 1e8
    }
    if (isCitreaChainId(chainId) && symbol === 'WBTCe') {
      const addr = WBTC_E_ADDRESSES[chainId as UniverseChainId]
      if (!addr) return undefined
      const contract = new Contract(addr, ERC20_ABI, provider)
      const raw = await contract.callStatic.balanceOf?.(LDS_ADDRESS)
      return Number(raw)
    }
    if (isCitreaChainId(chainId) && symbol === 'JUSD') {
      const tokenAddress = getJusdAddress(chainId as UniverseChainId)
      if (!tokenAddress) return undefined
      const contract = new Contract(tokenAddress, ERC20_ABI, provider)
      const raw = await contract.callStatic.balanceOf?.(LDS_ADDRESS)
      const humanValue = Number(raw) / 1e18
      return humanValue * 1e8
    }
    if (chainId === UniverseChainId.Mainnet) {
      if (symbol === 'WBTC') {
        const contract = new Contract(WBTC.address, ERC20_ABI, provider)
        const raw = await contract.callStatic.balanceOf?.(LDS_ADDRESS)
        return Number(raw)
      }
      if (symbol === 'USDT') {
        const contract = new Contract(USDT.address, ERC20_ABI, provider)
        const raw = await contract.callStatic.balanceOf?.(LDS_ADDRESS)
        const humanValue = Number(raw) / 1e6
        return humanValue * 1e8
      }
      if (symbol === 'USDC') {
        const contract = new Contract(USDC.address, ERC20_ABI, provider)
        const raw = await contract.callStatic.balanceOf?.(LDS_ADDRESS)
        const humanValue = Number(raw) / 1e6
        return humanValue * 1e8
      }
    }
    if (chainId === UniverseChainId.Polygon && symbol === 'USDT') {
      const contract = new Contract(USDT_POLYGON.address, ERC20_ABI, provider)
      const raw = await contract.callStatic.balanceOf?.(LDS_ADDRESS)
      const humanValue = Number(raw) / 1e6
      return humanValue * 1e8
    }
    return undefined
  } catch (error) {
    console.error(`Failed to fetch LDS on-chain balance for ${symbol} on chain ${chainId}:`, error)
    return undefined
  }
}
