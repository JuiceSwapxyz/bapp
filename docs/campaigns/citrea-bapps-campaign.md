# Juiceswap

### Task 1: Swap CBTC to Nectra USD (NUSD)

Track swap action on `0x6006797369E2A595D31Df4ab3691044038AAa7FE`.

1. Listen to 
```
Swap(
        address indexed sender,
        address indexed recipient,
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96,
        uint128 liquidity,
        int24 tick
    );
```
Swap event signature(topic[0]): ```0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67```

2. Mark `recipient` as completed the first task

### Task 2: Swap CBTC to cUSD (cUSD)

Track swap action on `0xA69De906B9A830Deb64edB97B2eb0848139306d2`.

1. Listen to 
```
Swap(
        address indexed sender,
        address indexed recipient,
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96,
        uint128 liquidity,
        int24 tick
    );
```
Swap event signature(topic[0]): ```0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67```

2. Mark `recipient` as completed the second task

### Task 3: Swap CBTC to USDC (USDC)

Track swap action on `0xD8C7604176475eB8D350bC1EE452dA4442637C09`.

1. Listen to 
```
Swap(
        address indexed sender,
        address indexed recipient,
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96,
        uint128 liquidity,
        int24 tick
    );
```
Swap event signature(topic[0]): ```0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67```

2. Mark `recipient` as completed the third task