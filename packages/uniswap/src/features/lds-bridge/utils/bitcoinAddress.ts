import { base58_to_binary } from 'base58-js'
import { bech32, bech32m } from 'bech32'
import { createHash } from 'sha256-uint8array'

const sha256 = (payload: Uint8Array): Uint8Array => createHash().update(payload).digest()

enum Network {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  mainnet = 'mainnet',
}

enum AddressType {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  p2pkh = 'p2pkh',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  p2sh = 'p2sh',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  p2wpkh = 'p2wpkh',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  p2wsh = 'p2wsh',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  p2tr = 'p2tr',
}

type AddressInfo = {
  bech32: boolean
  network: Network
  address: string
  type: AddressType
}

const addressTypes: { [key: number]: { type: AddressType; network: Network } } = {
  0x00: {
    type: AddressType.p2pkh,
    network: Network.mainnet,
  },
  0x05: {
    type: AddressType.p2sh,
    network: Network.mainnet,
  },
}

const normalizeAddressInfo = (addressInfo: AddressInfo): AddressInfo => {
  return {
    ...addressInfo,
    network: addressInfo.network,
  }
}

const parseBech32 = (address: string): AddressInfo => {
  let decoded

  try {
    if (address.startsWith('bc1p')) {
      decoded = bech32m.decode(address)
    } else {
      decoded = bech32.decode(address)
    }
  } catch (error) {
    throw new Error('Invalid address')
  }

  const witnessVersion = decoded.words[0]
  if (witnessVersion === undefined || witnessVersion < 0 || witnessVersion > 16) {
    throw new Error('Invalid address')
  }

  let type
  const data = bech32.fromWords(decoded.words.slice(1))
  if (data.length === 20) {
    type = AddressType.p2wpkh
  } else if (witnessVersion === 1) {
    type = AddressType.p2tr
  } else {
    type = AddressType.p2wsh
  }

  return normalizeAddressInfo({
    bech32: true,
    network: Network.mainnet,
    address,
    type,
  })
}

const getAddressInfo = (address: string): AddressInfo => {
  let decoded: Uint8Array

  const prefix = address.slice(0, 2).toLowerCase()
  if (prefix === 'bc') {
    return parseBech32(address)
  }

  try {
    decoded = base58_to_binary(address)
  } catch (error) {
    throw new Error('Invalid address')
  }

  const { length } = decoded
  if (length !== 25) {
    throw new Error('Invalid address')
  }

  const version = decoded[0]
  const checksum = decoded.slice(length - 4, length)
  const body = decoded.slice(0, length - 4)
  const expectedChecksum = sha256(sha256(body)).slice(0, 4)

  if (checksum.some((value: number, index: number) => value !== expectedChecksum[index])) {
    throw new Error('Invalid address')
  }

  const validVersions = Object.keys(addressTypes).map(Number)
  if (version === undefined || !validVersions.includes(version)) {
    throw new Error('Invalid address')
  }
  const addressType = addressTypes[version]

  if (!addressType) {
    throw new Error('Invalid address')
  }

  return normalizeAddressInfo({
    ...addressType,
    address,
    bech32: false,
  })
}

export const validateBitcoinAddress = (address: string): boolean => {
  try {
    getAddressInfo(address)
    return true
  } catch (error) {
    throw new Error('Invalid address')
  }
}

export const isBitcoinAddress = (address: string): boolean => {
  try {
    getAddressInfo(address)
    return true
  } catch (error) {
    return false
  }
}
