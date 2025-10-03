import { config } from 'uniswap/src/config'
import { isBetaEnv, isDevEnv, isPlaywrightEnv, isTestEnv } from 'utilities/src/environment/env'
import { isAndroid, isExtension, isInterface, isMobileApp } from 'utilities/src/platform'

enum TrafficFlows {
  GraphQL = 'graphql',
  TradingApi = 'trading-api-labs',
}

const FLOWS_USING_BETA: TrafficFlows[] = []

const isDevOrBeta = isPlaywrightEnv() ? false : isDevEnv() || isBetaEnv()

export const UNISWAP_WEB_HOSTNAME = 'bapp.juiceswap.xyz'
const EMBEDDED_WALLET_HOSTNAME = isPlaywrightEnv() || isDevEnv() ? 'staging.ew.unihq.org' : UNISWAP_WEB_HOSTNAME

export const UNISWAP_WEB_URL = `https://${UNISWAP_WEB_HOSTNAME}`
export const UNISWAP_APP_URL = 'https://uniswap.org/app'
export const UNISWAP_MOBILE_REDIRECT_URL = 'https://uniswap.org/mobile-redirect'

// The trading api uses custom builds for testing which may not use the v1 prefix
const tradingApiVersionPrefix = config.tradingApiWebTestEnv === 'true' ? '' : '/v1'

export const CHROME_EXTENSION_UNINSTALL_URL_PATH = '/extension/uninstall'

export const uniswapUrls = {
  tradingApiDocsUrl: 'https://api.juiceswap.xyz/',
  unichainUrl: 'https://www.unichain.org/',
  uniswapXUrl: 'https://x.juiceswap.xyz/',
  helpCenterUrl: 'https://help.juiceswap.xyz/',
  blogUrl: 'https://blog.juiceswap.xyz/',
  docsUrl: 'https://docs.juiceswap.xyz/',
  voteUrl: 'https://vote.juiceswapfoundation.org',
  governanceUrl: 'https://juiceswap.xyz/governance',
  developersUrl: 'https://juiceswap.xyz/developers',
  aboutUrl: 'https://about.juiceswap.xyz/',
  careersUrl: 'https://careers.juiceswap.xyz/',
  social: {
    x: 'https://x.com/JuiceSwap_com',
    telegram: 'https://t.me/JuiceSwap',
    github: 'https://github.com/JuiceSwapxyz',
  },
  termsOfServiceUrl: 'https://juiceswap.xyz/terms-of-service',
  privacyPolicyUrl: 'https://juiceswap.xyz/privacy-policy',
  chromeExtension: 'http://juiceswap.xyz/ext',
  chromeExtensionUninstallUrl: `https://juiceswap.xyz${CHROME_EXTENSION_UNINSTALL_URL_PATH}`,

  // Download links
  appStoreDownloadUrl: 'https://apps.apple.com/us/app/uniswap-crypto-nft-wallet/id6443944476',
  playStoreDownloadUrl: 'https://play.google.com/store/apps/details?id=com.uniswap.mobile&pcampaignid=web_share',

  // Core API Urls
  apiOrigin: 'https://api.uniswap.org',
  apiBaseUrl: config.apiBaseUrlOverride || getCloudflareApiBaseUrl(),
  apiBaseUrlV2: config.apiBaseUrlV2Override || `${getCloudflareApiBaseUrl()}/v2`,
  graphQLUrl: config.graphqlUrlOverride || `${getCloudflareApiBaseUrl(TrafficFlows.GraphQL)}/v1/graphql`,

  // Trading API
  tradingApiUrl: config.tradingApiUrlOverride || getCloudflareApiBaseUrl(TrafficFlows.TradingApi),

  // Disabled services (kept for backwards compatibility)
  amplitudeProxyUrl: config.amplitudeProxyUrlOverride || '',
  statsigProxyUrl: config.statsigProxyUrlOverride || '',
  unitagsApiUrl: config.unitagsApiUrlOverride || '',
  scantasticApiUrl: config.scantasticApiUrlOverride || '',
  forApiUrl: config.forApiUrlOverride || '',

  // Merkl Docs for LP Incentives
  merklDocsUrl: 'https://docs.merkl.xyz/earn-with-merkl/faq-earn#how-are-aprs-calculated',

  // Embedded Wallet URL's
  // Totally fine that these are public
  evervaultDevUrl: 'https://embedded-wallet-dev.app-907329d19a06.enclave.evervault.com',
  evervaultStagingUrl: 'https://embedded-wallet-staging.app-907329d19a06.enclave.evervault.com',
  evervaultProductionUrl: 'https://embedded-wallet.app-907329d19a06.enclave.evervault.com',
  embeddedWalletUrl: `https://${EMBEDDED_WALLET_HOSTNAME}`,
  passkeysManagementUrl: `https://${EMBEDDED_WALLET_HOSTNAME}/manage/passkey`,

  // API Paths
  trmPath: '/v1/screen',
  gasServicePath: '/v1/gas-fee',
  tradingApiPaths: {
    quote: `${tradingApiVersionPrefix}/quote`,
    approval: `${tradingApiVersionPrefix}/check_approval`,
    swap: `${tradingApiVersionPrefix}/swap`,
    swap5792: `${tradingApiVersionPrefix}/swap_5792`,
    order: `${tradingApiVersionPrefix}/order`,
    orders: `${tradingApiVersionPrefix}/orders`,
    swaps: `${tradingApiVersionPrefix}/swaps`,
    swappableTokens: `${tradingApiVersionPrefix}/swappable_tokens`,
    createLp: `${tradingApiVersionPrefix}/lp/create`,
    increaseLp: `${tradingApiVersionPrefix}/lp/increase`,
    decreaseLp: `${tradingApiVersionPrefix}/lp/decrease`,
    claimLpFees: `${tradingApiVersionPrefix}/lp/claim`,
    lpApproval: `${tradingApiVersionPrefix}/lp/approve`,
    migrate: `${tradingApiVersionPrefix}/lp/migrate`,
    claimRewards: `${tradingApiVersionPrefix}/lp/claim_rewards`,
    wallet: {
      checkDelegation: `${tradingApiVersionPrefix}/wallet/check_delegation`,
      encode7702: `${tradingApiVersionPrefix}/wallet/encode_7702`,
    },
    swap7702: `${tradingApiVersionPrefix}/swap_7702`,
  },

  jupiterApiUrl: 'https://lite-api.jup.ag/ultra/v1',
  jupiterApiPaths: {
    order: '/order',
    execute: '/execute',
  },

  // App and Redirect URL's
  appBaseUrl: UNISWAP_APP_URL,
  redirectUrlBase: UNISWAP_MOBILE_REDIRECT_URL,
  requestOriginUrl: UNISWAP_WEB_URL,

  // Web Interface Urls
  webInterfaceSwapUrl: `${UNISWAP_WEB_URL}/#/swap`,
  webInterfaceTokensUrl: `${UNISWAP_WEB_URL}/explore/tokens`,
  webInterfacePoolsUrl: `${UNISWAP_WEB_URL}/explore/pools`,
  webInterfaceAddressUrl: `${UNISWAP_WEB_URL}/address`,
  webInterfaceNftItemUrl: `${UNISWAP_WEB_URL}/nfts/asset`,
  webInterfaceNftCollectionUrl: `${UNISWAP_WEB_URL}/nfts/collection`,
  webInterfaceBuyUrl: `${UNISWAP_WEB_URL}/buy`,

  // Feedback Links
  walletFeedbackForm:
    'https://docs.google.com/forms/d/e/1FAIpQLSepzL5aMuSfRhSgw0zDw_gVmc2aeVevfrb1UbOwn6WGJ--46w/viewform',
}

function getCloudflarePrefix(flow?: TrafficFlows): string {
  if (flow && isDevOrBeta && FLOWS_USING_BETA.includes(flow)) {
    return `beta`
  }

  if (isMobileApp) {
    return `${isAndroid ? 'android' : 'ios'}.wallet`
  }

  if (isExtension) {
    return 'extension'
  }

  if (isPlaywrightEnv() || isInterface) {
    return 'interface'
  }

  if (isTestEnv()) {
    return 'wallet'
  }

  throw new Error('Could not determine app to generate Cloudflare prefix')
}

function getServicePrefix(flow?: TrafficFlows): string {
  if (flow && (isPlaywrightEnv() || !(isDevOrBeta && FLOWS_USING_BETA.includes(flow)))) {
    return flow + '.'
  } else {
    return ''
  }
}

function getCloudflareApiBaseUrl(flow?: TrafficFlows): string {
  return `https://${getServicePrefix(flow)}${getCloudflarePrefix(flow)}.gateway.uniswap.org`
}
