import dotenv from 'dotenv'
import path from 'path'
import { Wallet } from 'ethers'

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
    rpcUrl: 'https://rpc.testnet.juiceswap.com',
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
    address: '0xFdB0a83d94CD65151148a131167Eb499Cb85d015',
    symbol: 'JUSD',
    decimals: 6,
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
