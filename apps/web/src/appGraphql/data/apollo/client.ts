import { ApolloClient, HttpLink, from } from '@apollo/client'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'
import { getDatadogApolloLink } from 'utilities/src/logger/datadog/datadogLink'

let apiUrl = process.env.REACT_APP_AWS_API_ENDPOINT
if (!apiUrl) {
  throw new Error('REACT_APP_AWS_API_ENDPOINT is not configured in environment variables')
}

// Prevent localhost GraphQL endpoints from being used to avoid CSP errors
if (apiUrl.includes('localhost:42069')) {
  apiUrl = 'https://beta.gateway.uniswap.org/v1/graphql'
}

const httpLink = new HttpLink({ uri: apiUrl })
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
