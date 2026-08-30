import { getRuntimeLaunchpadAddresses } from 'constants/launchpad'

// Citrea testnet launchpad chain id (has launchpad addresses configured).
const CHAIN_ID = 5115
const FACTORY_ENV = 'REACT_APP_LAUNCHPAD_5115_FACTORY'
const VALID_FACTORY = '0x1111111111111111111111111111111111111111'

/**
 * supportsDevBuy is the single gate the Create page uses to keep the Dev buy
 * block disabled ("Coming soon") until an upgraded factory exposing
 * createTokenWithDevBuyPermit is deployed and wired up via env override.
 */
describe('getRuntimeLaunchpadAddresses — dev buy gate', () => {
  const original = process.env[FACTORY_ENV]

  afterEach(() => {
    if (original === undefined) {
      delete process.env[FACTORY_ENV]
    } else {
      process.env[FACTORY_ENV] = original
    }
  })

  it('reports supportsDevBuy=false when no factory override is set', () => {
    delete process.env[FACTORY_ENV]
    const addresses = getRuntimeLaunchpadAddresses(CHAIN_ID)
    expect(addresses?.supportsDevBuy).toBe(false)
  })

  it('reports supportsDevBuy=true and overrides the factory when a valid override is set', () => {
    process.env[FACTORY_ENV] = VALID_FACTORY
    const addresses = getRuntimeLaunchpadAddresses(CHAIN_ID)
    expect(addresses?.supportsDevBuy).toBe(true)
    expect(addresses?.factory).toBe(VALID_FACTORY)
  })

  it('ignores a malformed factory override (stays disabled)', () => {
    process.env[FACTORY_ENV] = '0xnot-an-address'
    const addresses = getRuntimeLaunchpadAddresses(CHAIN_ID)
    expect(addresses?.supportsDevBuy).toBe(false)
  })
})
