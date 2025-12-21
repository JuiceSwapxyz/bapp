import ecc from '@bitcoinerlab/secp256k1'
import { initEccLib } from 'bitcoinjs-lib'
import { Musig } from 'boltz-core'
import { init } from 'boltz-core/dist/lib/liquid'
import { Buffer } from 'buffer'
import type { ECPairInterface } from 'ecpair'

const randomBytes = (size: number): Buffer => {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes)
}

initEccLib(ecc)

let secpZkp: any = null
const getSecpZkp = async () => {
  if (!secpZkp) {
    const zkp = (await import('@vulpemventures/secp256k1-zkp')).default
    secpZkp = await zkp()
    init(secpZkp)
  }
  return secpZkp
}

export const createMusig = async (ourKeys: ECPairInterface, theirPublicKey: Buffer): Promise<Musig> => {
  const secp = await getSecpZkp()
  return new Musig(secp, ourKeys, randomBytes(32), [theirPublicKey, Buffer.from(ourKeys.publicKey)])
}
