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
  preimage: string
  preimageHash: string
  claimPublicKey: string
  mnemonic: string
  keyIndex: number
}

const DERIVATION_PATH = 'm/44/0/0/0'

const getLastMnemonic = () => {
  const mnemonic = localStorage.getItem('mnemonic')
  return mnemonic
}

const saveMnemonic = (mnemonic: string) => {
  localStorage.setItem('mnemonic', mnemonic)
}

const getLastKeyIndex = () => {
  const keyIndex = localStorage.getItem('keyIndex')
  return keyIndex ? parseInt(keyIndex) : 0
}

const saveKeyIndex = (keyIndex: number) => {
  localStorage.setItem('keyIndex', keyIndex.toString())
}

/**
 * Generates preimageHash and claimPublicKey for a chain swap (e.g., cBTC -> BTC OnChain).
 * Creates a random mnemonic if none is provided.
 * @param mnemonic - Optional mnemonic phrase. If not provided, a random one will be generated.
 * @param keyIndex - Optional key index to use. If not provided, defaults to 0.
 * @returns Object containing preimageHash, claimPublicKey, mnemonic, and keyIndex
 */
export const generateChainSwapKeys = (mnemonic?: string, index?: number): ChainSwapKeys => {
  const finalMnemonic = mnemonic || getLastMnemonic() || generateMnemonic(wordlist)
  const lastKeyIndex = index || getLastKeyIndex()
  const finalKeyIndex = lastKeyIndex + 1

  saveMnemonic(finalMnemonic)
  saveKeyIndex(finalKeyIndex)

  const seed = mnemonicToSeedSync(finalMnemonic)
  const hdKey = HDKey.fromMasterSeed(seed)
  const derivationPath = `${DERIVATION_PATH}/${finalKeyIndex}`
  const derivedKey = hdKey.derive(derivationPath)

  if (!derivedKey.privateKey) {
    throw new Error('Failed to derive private key')
  }

  const claimKeyPair = ECPair.fromPrivateKey(Buffer.from(derivedKey.privateKey))
  const preimage = sha256(Buffer.from(derivedKey.privateKey))
  const preimageHash = Buffer.from(sha256(preimage)).toString('hex')
  const claimPublicKey = Buffer.from(claimKeyPair.publicKey).toString('hex')

  return {
    preimage: Buffer.from(preimage).toString('hex'),
    preimageHash,
    claimPublicKey,
    mnemonic: finalMnemonic,
    keyIndex: finalKeyIndex,
  }
}
