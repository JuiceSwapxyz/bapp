# JuiceSwap Labs Web Interface

## Accessing the JuiceSwap Interface

To access the JuiceSwap Interface, use an IPFS gateway link from the
[latest release](https://github.com/Uniswap/uniswap-interface/releases/latest),
or visit [app.uniswap.org](https://app.uniswap.org).

## Running the interface locally

```bash
yarn
yarn web start
```

## Translations

To get translations to work you'll need to set up 1Password, and then:

```
eval $(op signin)
```

Sign into 1Password, then:

```
yarn mobile env:local:download
```

Which downs a `.env.defaults.local` file at the root. Finally:

```
yarn web i18n:download
```

Which will download the translations to `./apps/web/src/i18n/locales/translations`.

## Accessing JuiceSwap V2

The JuiceSwap Interface supports swapping, adding liquidity, removing liquidity and migrating liquidity for JuiceSwap protocol V2.

- Swap on JuiceSwap V2: <https://app.uniswap.org/swap?use=v2>
- View V2 liquidity: <https://app.uniswap.org/pools/v2>
- Add V2 liquidity: <https://app.uniswap.org/add/v2>
- Migrate V2 liquidity to V3: <https://app.uniswap.org/migrate/v2>

## Accessing JuiceSwap V1

The JuiceSwap V1 interface for mainnet and testnets is accessible via IPFS gateways
linked from the [v1.0.0 release](https://github.com/Uniswap/uniswap-interface/releases/tag/v1.0.0).

## Feature flags

Web-specific feature flags are defined in [`src/constants/featureFlags.ts`](src/constants/featureFlags.ts)
and exported as `WebFeatureFlags` (distinct from the Statsig-backed `FeatureFlags` enum in
`packages/uniswap/src/features/gating/flags.ts`).

### How they are wired

Each flag reads its value from a `REACT_APP_*` environment variable. Vite inlines those
variables into the JS bundle **at build time** — they are not read at runtime. That means
a `docker-compose` `environment:` entry on the dapp container has **no effect** on the
bundle; the value must be set before `yarn web build:*` runs.

The repo follows the standard Vite pattern of mode-specific env files:

- `apps/web/.env.development` — loaded by `yarn web build:development` (DEV image)
- `apps/web/.env.production` — loaded by `yarn web build:production` (PRD image)
- `apps/web/.env.example` — committed reference for what env vars exist

To activate a flag for DEV only, add it to `.env.development` and merge to `develop`;
the next build bakes it into the `:beta` image. To activate for PRD, add it to
`.env.production` and ship a release. Local development (`yarn web dev`) also reads
`.env.development`.

### Adding a new flag

1. Add an entry to `WebFeatureFlags` in `src/constants/featureFlags.ts` with a clear
   default (`!== 'false'` for opt-out, `=== 'true'` for opt-in)
2. Gate the affected UI / route at every consumer site (component conditional render,
   route `enabled:` hook, etc.)
3. Document the env var in `.env.example`
4. If the flag also surfaces in public discovery files (`sitemap.xml`, `llms.txt`,
   `.well-known/ai-plugin.json`, `index.html` meta tags), gate or darken those too —
   otherwise crawlers advertise a feature that is off

### Current flags

Effective state per build mode. Source: code default in `src/constants/featureFlags.ts`
overridden by the matching `.env.{mode}` file when set.

| Flag | DEV (`.env.development`) | PRD (`.env.production`) | Control |
|------|---|---|---------|
| `CITREA_BAPPS_CAMPAIGN` | **ON** | **ON** | Default ON; opt-out via `=false` |
| `FIRST_SQUEEZER_CAMPAIGN` | **ON** | **ON** | Default ON; opt-out via `=false` |
| `CEX_TRANSFER_ENABLED` | **OFF** | **OFF** | Default OFF; opt-in via `=true` |
| `CROSS_CHAIN_SWAPS` | **ON** | **ON** | Default ON; opt-out via `=false`, URL override `?cross-chain-swaps=false` |
| `JUICE_POINTS_PROGRAM` | **ON** (set in `.env.development`) | **OFF** | Default OFF; PRD re-enablement tracked in issue #748 |

When you flip a flag in either env file, **update this table in the same PR** so the
documented state stays in sync with the shipped state.
