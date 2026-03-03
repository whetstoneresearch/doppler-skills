---
name: migrator-uniswap-v2
description: Document and verify Doppler's Uniswap V2 liquidity migrator path used during `Airlock.migrate(asset)`.
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Source References**: Use [Doppler deployments](https://github.com/whetstoneresearch/doppler/tree/main/deployments) as the contract source of truth for deployed addresses and revisions.

# Uniswap V2 Migrator

## When to use
- You are integrating a legacy migration destination based on Uniswap V2 pools.
- You need to verify Airlock-to-migrator handoff behavior for the V2 path.
- You are auditing compatibility behavior on networks where V4 migration is not used.

## Prerequisites
- Confirm `liquidityMigrator` is configured to the V2 migrator implementation.
- Confirm migration policy allows V2 for this launch.
- Confirm asset/numeraire token ordering and destination recipient assumptions.

## Core workflow
1. Trace `Airlock.migrate(asset)` up to migrator handoff.
2. Verify post-fee balances sent by Airlock to the V2 migrator path.
3. Verify V2 destination liquidity state after migration.
4. Validate recipient/locker ownership of migrated liquidity.

## Quick facts
| Item | Detail |
|---|---|
| Entrypoint caller | `Airlock.migrate(asset)` |
| Handoff call | `liquidityMigrator.migrate(...)` |
| Canonical source file | `doppler/src/migrators/UniswapV2Migrator.sol` |
| Policy posture | Compatibility path, not the preferred default |

## Failure modes
- Wrong `liquidityMigrator` wiring for a V2 target.
- Migrating to V2 when a preferred V4 path is available for the same launch policy.
- Token orientation mismatch between Airlock output and destination pool assumptions.
- Assuming V4-only features (split/top-up hooks) exist on the V2 path.

## References
- [OVERVIEW.md](references/OVERVIEW.md)
- [INTERFACE.md](references/INTERFACE.md)
- [VERIFICATION.md](references/VERIFICATION.md)
- [liquidity-migration](../liquidity-migration/SKILL.md)
- [airlock](../airlock/SKILL.md)
- [verification](../verification/SKILL.md)
