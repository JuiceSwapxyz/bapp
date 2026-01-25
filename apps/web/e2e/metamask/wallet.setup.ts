import { ADDRESS } from '@juicedollar/jusd'
import dotenv from 'dotenv'
import { Wallet } from 'ethers'
import path from 'path'

// Load environment variables from .env.local
// Use process.cwd() since Playwright runs from apps/web directory
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

/**
 * Wallet setup for MetaMask E2E tests
 *
 * IMPORTANT: Use a dedicated TEST WALLET only!
 * Never use a wallet with real funds for testing.
 *
 * Environment variables:
 * - WALLET_SEED_PHRASE: Your test wallet's 12-word seed phrase
 * - WALLET_PASSWORD: Password for MetaMask (can be any password for testing)
 */

// Wallet credentials from environment - no hardcoded fallbacks
export const SEED_PHRASE = process.env.WALLET_SEED_PHRASE || ''
export const WALLET_PASSWORD = process.env.WALLET_PASSWORD || ''

// Derive wallet address from seed phrase
const wallet = Wallet.fromMnemonic(SEED_PHRASE)
export const WALLET_ADDRESS = wallet.address

// Chain configurations
export const CHAIN_CONFIG = {
  citreaTestnet: {
    name: 'Citrea Testnet',
    rpcUrl: 'https://dev.rpc.testnet.juiceswap.com',
    chainId: 5115,
    symbol: 'cBTC',
    blockExplorerUrl: 'https://testnet.citreascan.com',
  },
  polygon: {
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    symbol: 'POL',
    blockExplorerUrl: 'https://polygonscan.com',
  },
}

// Token addresses
export const TOKENS = {
  // JUSD on Citrea Testnet
  JUSD: {
    address: ADDRESS[5115]!.juiceDollar,
    symbol: 'JUSD',
    decimals: 18, // JUSD has 18 decimals - DO NOT CHANGE
    chainId: 5115,
  },
  // USDT on Polygon
  USDT: {
    address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    symbol: 'USDT',
    decimals: 6,
    chainId: 137,
  },
}
