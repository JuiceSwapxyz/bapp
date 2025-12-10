/* eslint-env node */

const fs = require('fs')
const { parseStringPromise, Builder } = require('xml2js')

const weekMs = 7 * 24 * 60 * 60 * 1000
const nowISO = new Date().toISOString()

const getTopPoolsQuery = (v3Chain) => `
  query {
    topV3Pools(first: 50, chain: ${v3Chain}) {
      id
      address
    }
    topV2Pairs(first: 50, chain: ETHEREUM) {
      address
    }
  }
`

const chains = [
  'ETHEREUM',
  'ARBITRUM',
  'OPTIMISM',
  'POLYGON',
  'BASE',
  'BNB',
  'CELO',
  'UNICHAIN',
  'AVALANCHE',
  'BLAST',
  'SONEIUM',
  'WORLDCHAIN',
  'ZKSYNC',
  'ZORA',
  'CITREA_TESTNET',
]

const JUICESWAP_APP_URL = 'https://bapp.juiceswap.com'
const JUICESWAP_API_URL = 'https://api.juiceswap.com'

fs.readFile('./public/tokens-sitemap.xml', 'utf8', async (_err, data) => {
  const tokenURLs = {}
  try {
    const sitemap = await parseStringPromise(data)
    if (sitemap.urlset.url) {
      sitemap.urlset.url.forEach((url) => {
        const lastMod = new Date(url.lastmod).getTime()
        if (lastMod < Date.now() - weekMs) {
          url.lastmod = nowISO
        }
        tokenURLs[url.loc] = true
      })
    }

    const tokensResponse = await fetch(`${JUICESWAP_API_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        accept: '*/*',
        origin: JUICESWAP_APP_URL,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: `query { tokens(first: 50) { id address symbol } }`,
      }),
    }).catch(() => null)

    if (tokensResponse && tokensResponse.ok) {
      const tokensJSON = await tokensResponse.json()
      const tokens = tokensJSON?.data?.tokens || []

      tokens.forEach((token) => {
        const chainName = (token.chain || 'citrea_testnet').toLowerCase()
        const address = token.address ? token.address.toLowerCase() : 'NATIVE'
        const tokenURL = `${JUICESWAP_APP_URL}/explore/tokens/${chainName}/${address}`
        if (!(tokenURL in tokenURLs)) {
          sitemap.urlset.url.push({
            loc: [tokenURL],
            lastmod: [nowISO],
            priority: [0.8],
          })
        }
      })
    } else {
      console.log('Token rankings API not available, skipping token sitemap updates')
    }

    const builder = new Builder()
    const xml = builder.buildObject(sitemap)
    const path = './public/tokens-sitemap.xml'
    fs.writeFile(path, xml, (error) => {
      if (error) {
        throw error
      }
      const stats = fs.statSync(path)
      const fileSizeBytes = stats.size
      const fileSizeMegabytes = fileSizeBytes / (1024 * 1024)

      if (fileSizeMegabytes > 50) {
        throw new Error('Generated tokens-sitemap.xml file size exceeds 50MB')
      }
      console.log('Tokens sitemap updated')
    })
  } catch (e) {
    console.error(e)
  }
})

fs.readFile('./public/pools-sitemap.xml', 'utf8', async (_err, data) => {
  const poolURLs = {}
  try {
    const sitemap = await parseStringPromise(data)
    if (sitemap.urlset.url) {
      sitemap.urlset.url.forEach((url) => {
        const lastMod = new Date(url.lastmod).getTime()
        if (lastMod < Date.now() - weekMs) {
          url.lastmod = nowISO
        }
        poolURLs[url.loc] = true
      })
    }

    // JuiceSwap pools - using Ponder API
    for (const chainName of chains) {
      const poolsResponse = await fetch(`${JUICESWAP_API_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: JUICESWAP_APP_URL,
        },
        body: JSON.stringify({ query: getTopPoolsQuery(chainName) }),
      }).catch(() => null)

      if (poolsResponse && poolsResponse.ok) {
        const poolsJSON = await poolsResponse.json()
        const v3PoolAddresses = poolsJSON.data?.topV3Pools?.map((pool) => pool.address.toLowerCase()) ?? []
        const v2PoolAddresses = poolsJSON.data?.topV2Pairs?.map((pool) => pool.address.toLowerCase()) ?? []
        const poolAddresses = v3PoolAddresses.concat(v2PoolAddresses)

        poolAddresses.forEach((address) => {
          const poolUrl = `${JUICESWAP_APP_URL}/explore/pools/${chainName.toLowerCase()}/${address}`
          if (!(poolUrl in poolURLs)) {
            sitemap.urlset.url.push({
              loc: [poolUrl],
              lastmod: [nowISO],
              priority: [0.8],
            })
          }
        })
      } else {
        console.log(`Pools API not available for ${chainName}, skipping`)
      }
    }

    const builder = new Builder()
    const xml = builder.buildObject(sitemap)
    const path = './public/pools-sitemap.xml'
    fs.writeFile(path, xml, (error) => {
      if (error) {
        throw error
      }
      const stats = fs.statSync(path)
      const fileSizeBytes = stats.size
      const fileSizeMegabytes = fileSizeBytes / (1024 * 1024)

      if (fileSizeMegabytes > 50) {
        throw new Error('Generated pools-sitemap.xml file size exceeds 50MB')
      }
      console.log('Pools sitemap updated')
    })
  } catch (e) {
    console.error(e)
  }
})
