import { ApolloClient, HttpLink } from '@apollo/client'
import { setupSharedApolloCache } from 'uniswap/src/data/cache'
// import { getDatadogApolloLink } from 'utilities/src/logger/datadog/datadogLink' // Commented out - Datadog disabled

const apiUrl = process.env.REACT_APP_AWS_API_ENDPOINT
if (!apiUrl) {
  throw new Error('REACT_APP_AWS_API_ENDPOINT is not configured in environment variables')
}

const httpLink = new HttpLink({ uri: apiUrl })
// const datadogLink = getDatadogApolloLink() // Commented out - Datadog disabled

export const apolloClient = new ApolloClient({
  connectToDevTools: true,
  link: httpLink, // Removed datadogLink from chain
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
