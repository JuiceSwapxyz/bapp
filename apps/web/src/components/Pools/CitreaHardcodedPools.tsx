import { HARDCODED_CITREA_POOLS } from 'constants/hardcodedPools'
import { Flex, Text } from 'ui/src'

export function CitreaHardcodedPools() {
  return (
    <Flex gap="$spacing16" px="$spacing16" py="$spacing24">
      <Text variant="heading3">Citrea Testnet Pools</Text>
      <Flex gap="$spacing12">
        {HARDCODED_CITREA_POOLS.map((pool) => (
          <Flex key={pool.id} p="$spacing16" borderRadius="$rounded20" backgroundColor="$surface2" gap="$spacing8">
            <Flex row gap="$spacing8" alignItems="center">
              <Text variant="body1" fontWeight="600">
                {pool.token0.symbol}/{pool.token1.symbol}
              </Text>
              <Text variant="body3" color="$neutral2">
                {(pool.feeTier / 10000).toFixed(2)}%
              </Text>
            </Flex>
            <Flex row gap="$spacing16">
              <Flex gap="$spacing4">
                <Text variant="body3" color="$neutral2">
                  TVL
                </Text>
                <Text variant="body2">${pool.tvlUSD.toLocaleString()}</Text>
              </Flex>
              <Flex gap="$spacing4">
                <Text variant="body3" color="$neutral2">
                  24h Volume
                </Text>
                <Text variant="body2">${pool.volume24hUSD.toLocaleString()}</Text>
              </Flex>
              <Flex gap="$spacing4">
                <Text variant="body3" color="$neutral2">
                  APR
                </Text>
                <Text variant="body2">{pool.apr.toFixed(1)}%</Text>
              </Flex>
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
