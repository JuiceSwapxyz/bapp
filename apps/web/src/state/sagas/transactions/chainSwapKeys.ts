import ecc from '@bitcoinerlab/secp256k1'
import { sha256 } from '@noble/hashes/sha2.js'
import { HDKey } from '@scure/bip32'
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { initEccLib } from 'bitcoinjs-lib'
import { Buffer } from 'buffer'
import { ECPairFactory } from 'ecpair'

// Initialize ECC library for bitcoinjs-lib
initEccLib(ecc)
const ECPair = ECPairFactory(ecc)

export type ChainSwapKeys = {
  preimageHash: string
  claimPublicKey: string
  mnemonic: string
  keyIndex: number
}

const DERIVATION_PATH = 'm/44/0/0/0'

/**
 * Generates preimageHash and claimPublicKey for a chain swap (e.g., cBTC -> BTC OnChain).
 * Creates a random mnemonic if none is provided.
 *
 * Required dependencies:
 * - @scure/bip32
 * - @scure/bip39
 * - @bitcoinerlab/secp256k1
 * - bitcoinjs-lib
 * - buffer
 * - ecpair
 *
 * Browser Configuration:
 * This code requires additional configuration to run in the browser:
 *
 * 1. For Vite projects, add these plugins to vite.config:
 *    - vite-plugin-node-polyfills (for Buffer polyfill)
 *    - vite-plugin-wasm (for @bitcoinerlab/secp256k1 WASM support)
 *
 *    Example vite.config:
 *    ```js
 *    import { nodePolyfills } from "vite-plugin-node-polyfills";
 *    import wasm from "vite-plugin-wasm";
 *
 *    export default defineConfig({
 *      plugins: [nodePolyfills(), wasm()],
 *    });
 *    ```
 *
 * 2. For other bundlers (Webpack, Rollup, etc.):
 *    - Configure Buffer polyfill (the 'buffer' package)
 *    - Configure WASM support for @bitcoinerlab/secp256k1
 *
 * @example
 * // Generate with random mnemonic
 * const keys = generateChainSwapKeys();
 * console.log(keys.preimageHash, keys.claimPublicKey);
 *
 * // Use existing mnemonic
 * const keys = generateChainSwapKeys("your mnemonic phrase here");
 *
 * // Use specific key index
 * const keys = generateChainSwapKeys(undefined, 5);
 *
 * @param mnemonic - Optional mnemonic phrase. If not provided, a random one will be generated.
 * @param keyIndex - Optional key index to use. If not provided, defaults to 0.
 * @returns Object containing preimageHash, claimPublicKey, mnemonic, and keyIndex
 */
export const generateChainSwapKeys = (mnemonic?: string, keyIndex: number = 0): ChainSwapKeys => {
  // Generate or use provided mnemonic
  const finalMnemonic = mnemonic || generateMnemonic(wordlist)

  // Convert mnemonic to HDKey
  const seed = mnemonicToSeedSync(finalMnemonic)
  const hdKey = HDKey.fromMasterSeed(seed)

  // Derive key at the specified index
  const derivationPath = `${DERIVATION_PATH}/${keyIndex}`
  const derivedKey = hdKey.derive(derivationPath)

  if (!derivedKey.privateKey) {
    throw new Error('Failed to derive private key')
  }

  // Create ECPair from private key
  const claimKeyPair = ECPair.fromPrivateKey(Buffer.from(derivedKey.privateKey))

  // Derive preimage: SHA256 of the private key
  const preimage = sha256(Buffer.from(derivedKey.privateKey))

  // Generate preimageHash: SHA256 of preimage
  const preimageHash = Buffer.from(sha256(preimage)).toString('hex')

  // Extract claim public key as hex string
  const claimPublicKey = Buffer.from(claimKeyPair.publicKey).toString('hex')

  return {
    preimageHash,
    claimPublicKey,
    mnemonic: finalMnemonic,
    keyIndex,
  }
}
