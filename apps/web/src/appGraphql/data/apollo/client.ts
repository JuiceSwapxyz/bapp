import { ApolloClient, HttpLink, from } from '@apollo/client'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'
import { getDatadogApolloLink } from 'utilities/src/logger/datadog/datadogLink'

// TODO: Re-enable once GraphQL endpoint is configured
let API_URL = process.env.REACT_APP_AWS_API_ENDPOINT
if (!API_URL) {
  // throw new Error('AWS API ENDPOINT MISSING FROM ENVIRONMENT')
  // Use placeholder URL to prevent initialization errors
  // GraphqlProviders will prevent actual usage when endpoint is not configured
  API_URL = 'https://api.juiceswap.xyz/v1/graphql'
}

// Prevent localhost GraphQL endpoints from being used to avoid CSP errors
if (API_URL.includes('localhost:42069')) {
  // Localhost GraphQL endpoint detected, using beta gateway instead
  API_URL = 'https://beta.gateway.uniswap.org/v1/graphql'
}

const httpLink = new HttpLink({ uri: API_URL })
const datadogLink = getDatadogApolloLink()

export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  link: from([datadogLink, httpLink]),
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://app.uniswap.org',
  },
  cache: setupSharedApolloCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
})
