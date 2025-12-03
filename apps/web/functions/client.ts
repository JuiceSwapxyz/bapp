import { ApolloClient, InMemoryCache } from '@apollo/client'
// JuiceSwap GraphQL endpoint for SSR/Cloudflare Functions
const GRAPHQL_ENDPOINT = 'https://dev.api.juiceswap.com/v1/graphql'

//TODO: Figure out how to make ApolloClient global variable
export default new ApolloClient({
  connectToDevTools: false,
  uri: GRAPHQL_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
    Origin: 'https://bapp.juiceswap.com',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36',
  },
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
  },
})
