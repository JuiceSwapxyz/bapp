import { sha256 } from '@noble/hashes/sha2.js'
import { bech32, utf8 } from '@scure/base'
import { BigNumber } from 'bignumber.js'
import type { RoutingInfo } from 'bolt11'
import * as bolt11 from 'bolt11'

// ============================================================================
// Types
// ============================================================================

export const enum InvoiceType {
  Bolt11 = 'Bolt11',
  Bolt12 = 'Bolt12',
}

type LnurlResponse = {
  minSendable: number
  maxSendable: number
  callback: string
}

type LnurlCallbackResponse = {
  pr: string
}

// ============================================================================
// Constants
// ============================================================================

export const invoicePrefix = 'lightning:'
export const bitcoinPrefix = 'bitcoin:'
export const liquidPrefix = 'liquidnetwork:'
export const maxExpiryHours = 24

const bolt11Prefix = 'lnbc'

const magicRoutingHintConstant = '0846c900051c0000'

// ============================================================================
// Configuration (adjust these for your environment)
// ============================================================================

interface LightningConfig {
  getBolt12Module: () => Promise<{
    Offer: new (offer: string) => {
      signing_pubkey?: Uint8Array
      paths: Array<{
        hops: Array<{ pubkey: Uint8Array; free: () => void }>
        free: () => void
      }>
      free: () => void
    }
    Invoice: new (invoice: string) => {
      amount_msat: bigint
      payment_hash: Uint8Array
      signing_pubkey: Uint8Array
      free: () => void
    }
  }>
}

let config: LightningConfig = {
  getBolt12Module: async () => {
    throw new Error('getBolt12Module not configured')
  },
}

export const configureLightning = (newConfig: Partial<LightningConfig>) => {
  config = { ...config, ...newConfig }
}

// ============================================================================
// Denomination Helpers
// ============================================================================

const miliFactor = 1_000

export const satToMiliSat = (sat: BigNumber) => {
  return sat.multipliedBy(miliFactor)
}

// ============================================================================
// HTTP Helper
// ============================================================================

const checkResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }
  return response.json() as Promise<T>
}

// ============================================================================
// Invoice Decoding
// ============================================================================

export const decodeInvoice = async (
  invoice: string,
): Promise<{ type: InvoiceType; satoshis: number; preimageHash: string }> => {
  try {
    const decoded = bolt11.decode(invoice)
    const sats = BigNumber(decoded.millisatoshis || 0)
      .dividedBy(1000)
      .integerValue(BigNumber.ROUND_CEIL)
      .toNumber()
    return {
      satoshis: sats,
      type: InvoiceType.Bolt11,
      preimageHash: decoded.tags.find((tag) => tag.tagName === 'payment_hash')?.data as string,
    }
  } catch (e) {
    try {
      const mod = await config.getBolt12Module()
      const decoded = new mod.Invoice(invoice)
      const res = {
        type: InvoiceType.Bolt12,
        satoshis: Number(decoded.amount_msat / 1_000n),
        preimageHash: Buffer.from(decoded.payment_hash).toString('hex'),
      }
      decoded.free()
      return res
    } catch (e) {
      throw new Error('invalid_invoice')
    }
  }
}

// ============================================================================
// LNURL
// ============================================================================

export const fetchLnurl = async (lnurl: string, amount_sat: number): Promise<string> => {
  let url: string
  if (lnurl.includes('@')) {
    // Lightning address
    const urlsplit = lnurl.split('@')

    // TODO: This is not passing the CSP policy, and very hard to fix, as the url have an unknown domain.
    // Move this whole thing to the juiceswap api.
    url = `https://${urlsplit[1]}/.well-known/lnurlp/${urlsplit[0]}`
  } else {
    // LNURL
    const { bytes } = bech32.decodeToBytes(lnurl)
    url = utf8.encode(bytes)
  }

  const amount = satToMiliSat(BigNumber(amount_sat))

  const res = await checkResponse<LnurlResponse>(await fetch(url))
  checkLnurlResponse(amount, res)

  return await fetchLnurlInvoice(amount, res)
}

const checkLnurlResponse = (amount: BigNumber, data: LnurlResponse) => {
  if (amount.isLessThan(BigNumber(data.minSendable))) {
    throw new Error('MinAmount')
  }
  if (amount.isGreaterThan(BigNumber(data.maxSendable))) {
    throw new Error('MaxAmount')
  }
  return data
}

export const fetchLnurlInvoice = async (amount: BigNumber, data: LnurlResponse) => {
  const url = new URL(data.callback)
  url.searchParams.set('amount', amount.toString())
  const res = await fetch(url.toString()).then(checkResponse<LnurlCallbackResponse>)
  return res.pr
}

// ============================================================================
// BIP-21 / URI Parsing
// ============================================================================

export const isBip21 = (data: string) => {
  data = data.toLowerCase()
  return data.startsWith(bitcoinPrefix) || data.startsWith(liquidPrefix)
}

export const extractInvoice = (data: string) => {
  data = data.toLowerCase()
  if (data.startsWith(invoicePrefix)) {
    const url = new URL(data)
    return url.pathname
  }
  if (isBip21(data)) {
    const url = new URL(data)
    return url.searchParams.get('lightning') || ''
  }
  return data
}

export const extractAddress = (data: string) => {
  if (isBip21(data)) {
    const url = new URL(data)
    return url.pathname
  }
  return data
}

// ============================================================================
// Invoice Detection
// ============================================================================

export const isInvoice = (data: string) => {
  const lower = data.toLowerCase()
  return lower.startsWith(bolt11Prefix) || lower.startsWith('lni')
}

const isValidBech32 = (data: string) => {
  try {
    bech32.decodeToBytes(data)
    return true
  } catch (e) {
    return false
  }
}

const emailRegex =
  // eslint-disable-next-line security/detect-unsafe-regex
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const isLnurl = (data: string | null | undefined) => {
  if (typeof data !== 'string') {
    return false
  }

  data = data.toLowerCase().replace(invoicePrefix, '')
  return (data.includes('@') && emailRegex.test(data)) || (data.startsWith('lnurl') && isValidBech32(data))
}

// ============================================================================
// BOLT12
// ============================================================================

export const isBolt12Offer = async (offer: string) => {
  try {
    const { Offer } = await config.getBolt12Module()
    new Offer(offer).free()
    return true
  } catch (e) {
    return false
  }
}

export const validateInvoiceForOffer = async (offer: string, invoice: string) => {
  const { Offer, Invoice } = await config.getBolt12Module()
  const of = new Offer(offer)
  const possibleSigners: Uint8Array[] = []

  if (of.signing_pubkey !== undefined) {
    possibleSigners.push(of.signing_pubkey)
  }

  for (const path of of.paths) {
    const hops = path.hops
    if (hops.length > 0) {
      possibleSigners.push(hops[hops.length - 1].pubkey)
    }

    hops.forEach((hop) => hop.free())
    path.free()
  }

  of.free()

  const inv = new Invoice(invoice)

  try {
    const invoiceSigner = inv.signing_pubkey

    for (const signer of possibleSigners) {
      if (signer.length !== invoiceSigner.length) {
        continue
      }

      if (signer.every((b, i) => b === invoiceSigner[i])) {
        return true
      }
    }
  } finally {
    inv.free()
  }

  throw 'invoice does not belong to offer'
}

// ============================================================================
// Preimage Verification
// ============================================================================

export const checkInvoicePreimage = async (invoice: string, preimage: string) => {
  const dec = await decodeInvoice(invoice)
  const hash = Buffer.from(sha256(Buffer.from(preimage, 'hex'))).toString('hex')

  if (hash !== dec.preimageHash) {
    throw 'invalid preimage'
  }
}

// ============================================================================
// Magic Routing Hint (for submarine swaps)
// ============================================================================

export const findMagicRoutingHint = (invoice: string) => {
  try {
    const decodedInvoice = bolt11.decode(invoice)
    const routingInfo = decodedInvoice.tags.find((tag) => tag.tagName === 'routing_info')

    if (!routingInfo) {
      return undefined
    }

    const magicRoutingHint = (routingInfo.data as unknown as RoutingInfo).find(
      (hint: { short_channel_id: string }) => hint.short_channel_id === magicRoutingHintConstant,
    )

    return magicRoutingHint
  } catch (e) {
    return undefined
  }
}
