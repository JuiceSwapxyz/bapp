//
//  Network.swift
//  WidgetsCore
//
//  Created by Eric Huang on 7/6/23.
//

import Foundation
import Apollo

public class Network {
  public static let shared = Network()
  
  private let JUICESWAP_API_URL = "https://dev.api.juiceswap.com/v1/graphql"
  
  public lazy var apollo: ApolloClient = {
    let cache = InMemoryNormalizedCache()
    let store = ApolloStore(cache: cache)
    let client = URLSessionClient()
    
    let provider = NetworkInterceptorProvider(store: store, client: client)
    let url = URL(string: JUICESWAP_API_URL)!
    let transport = RequestChainNetworkTransport(interceptorProvider: provider, endpointURL: url)
    return ApolloClient(networkTransport: transport, store: store)
  }()
}

class NetworkInterceptorProvider: InterceptorProvider {
    private let store: ApolloStore
    private let client: URLSessionClient
    
    init(store: ApolloStore, client: URLSessionClient) {
        self.store = store
        self.client = client
    }
    
    func interceptors<Operation: GraphQLOperation>(for operation: Operation) -> [ApolloInterceptor] {
        return [
            AuthorizationInterceptor(),
            MaxRetryInterceptor(),
            CacheReadInterceptor(store: self.store),
            NetworkFetchInterceptor(client: self.client),
            ResponseCodeInterceptor(),
            MultipartResponseParsingInterceptor(),
            JSONResponseParsingInterceptor(),
            AutomaticPersistedQueryInterceptor(),
            CacheWriteInterceptor(store: self.store)
        ]
    }
}

class AuthorizationInterceptor: ApolloInterceptor {

  
  func interceptAsync<Operation>(
    chain: RequestChain,
    request: HTTPRequest<Operation>,
    response: HTTPResponse<Operation>?,
    completion: @escaping (Result<GraphQLResult<Operation.Data>, Error>) -> Void
  ) where Operation : GraphQLOperation {
    request.addHeader(name: "X-API-KEY", value: Env.UNISWAP_API_KEY)
    request.addHeader(name: "Content-Type", value: "application/json")
    request.addHeader(name: "Origin", value: "https://bapp.juiceswap.com")
    
    chain.proceedAsync(request: request,
                       response: response,
                       completion: completion)
  }
  
}
