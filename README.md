# doppler-skills

```bash
npx skills add whetstoneresearch/doppler-skills
```


Doppler is an onchain protocol for launching custom markets and tokens through various price discovery auctions.

This repository provides Agent Skills for working with [Protocol (Doppler)](https://docs.doppler.lol), sourced from canonical protocol contracts and documentation.

## Top-Level Protocol Map

### Entrypoint

| Skill | Scope |
|-------|-------|
| `airlock` | Mandatory protocol entrypoint for all Doppler users: launch creation, migration execution, fee accounting, and module orchestration across token factory, initializer, and migrator contracts. |

### Price Discovery Auction options

| Skill | Positioning | Recommended usage |
|-------|-------------|-------------|
| `pda-multicurve` | Primary/default path | Low/medium-value assets with predictable supply curves: no governance, no migration, `3-5` curves, max-tail to infinity (`max` in SDK), `UniswapV4ScheduledMulticurveInitializer` with `startingTime = 0`, and hook path via `DopplerHookInitializer` + rehypothecation hook (`RehypeDopplerHook`) plus custom beneficiary fee setup and preallocation to 3 addresses. |
| `pda-dynamic` | Premium/high-value path | High/ultra-high-value assets with maximally capital-efficient curves: no governance, dynamic repricing up/down, V4 migration path, custom beneficiary fee setup, allocations to `3-6+` addresses, and a configuration tuned for serious launches (project coins/protocol tokens). |
| `pda-static` | Legacy fallback path | Only for legacy networks that support Uniswap v3 but not Uniswap v4. |

### Liquidity migration options

| Skill | Option | Guidance |
|-------|--------|----------|
| `liquidity-migration` | Uniswap V2 / V3 / V4 migration planning | V4 preferred default; use V3 only when Uni v4 is unavailable and custom fees are required. |
| `migrator-uniswap-v2` | Uniswap V2 migrator functionality | Compatibility migrator for legacy V2 destinations. |
| `migrator-uniswap-v3` | Uniswap V3 migrator functionality | Use only on v3-only networks when custom fees are required. |
| `migrator-uniswap-v4` | Uniswap V4 migrator functionality | Canonical migrator path (`UniswapV4MulticurveMigrator`, `UniswapV4MigratorSplit`). |
| `proceeds-split-migration` | V4 split-migration specialization | Use when migration includes recipient split and top-up distribution. |

### Doppler hooks

| Skill | Scope |
|-------|-------|
| `doppler-hooks` | Canonical hook architecture and operations (`DopplerHookInitializer`, base hook callbacks, deployment controls). |
| `rehypothecation-hook` | Rehypothecation hook module (`RehypeDopplerHook`) for buybacks, beneficiary fees, and protocol-owner fee flows. |

## Suggested Usage Profiles

### Profile A: Low/Medium Value Assets

- Auction: `pda-multicurve`
- Curve style: predictable supply curves
- Migration: none
- Governance: `OpenZeppelin Governor: disabled`
- Hook path: `DopplerHookInitializer` + rehypothecation hook (`RehypeDopplerHook`)
- Fees: custom beneficiary fee setup
- Allocations: preallocate to 3 addresses
- Positioning note: widely supported in production flows; commonly used by teams including Zora and Bankr

### Profile B: High/Ultra-High Value Assets

- Auction: `pda-dynamic`
- Curve style: maximally capital-efficient supply curve behavior
- Migration: V4 migration path
- Governance: `OpenZeppelin Governor: disabled`
- Fees: custom beneficiary fee setup
- Allocations: `3-6+` addresses
- Positioning note: best for serious launches, project coins, and protocol tokens; stronger fit for teams willing to experiment

### Supporting skills

| Skill | Description |
|-------|-------------|
| `airlock` | Airlock entrypoint semantics, orchestration model, and full interface map |
| `token-lifecycle` | Token creation, vesting, inflation, and governance posture selection |
| `fee-architecture` | Fee collection and distribution across Airlock, hooks, and lockers |
| `verification` | On-chain verification and debugging with cast/viem/RPC/explorers |
| `uniswap-fundamentals` | Uniswap math and architecture concepts used by Doppler flows |

## Governance

Treat governance as a product capability, not an implementation pattern:

- `OpenZeppelin Governor: enabled`
- `OpenZeppelin Governor: disabled`

## Usage

Skills are auto-discovered by context, or you can request one explicitly:

```text
"Load pda-multicurve and configure the default launch path with 3-5 curves, a max tail, and OpenZeppelin Governor disabled"
```

## License

See individual skill directories for license information.
