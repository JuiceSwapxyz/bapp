import { ipfsToHttp } from 'hooks/useTokenMetadata'

describe('ipfsToHttp', () => {
  it('converts ipfs:// URIs to dedicated Pinata gateway', () => {
    expect(ipfsToHttp('ipfs://QmFoo')).toBe('https://indigo-impossible-goldfish-326.mypinata.cloud/ipfs/QmFoo')
  })

  it('converts ar:// URIs to Arweave gateway', () => {
    expect(ipfsToHttp('ar://abc123')).toBe('https://arweave.net/abc123')
  })

  it('returns https:// URIs unchanged', () => {
    expect(ipfsToHttp('https://example.com/metadata.json')).toBe('https://example.com/metadata.json')
  })

  it('returns http:// URIs unchanged', () => {
    expect(ipfsToHttp('http://example.com/metadata.json')).toBe('http://example.com/metadata.json')
  })
})
