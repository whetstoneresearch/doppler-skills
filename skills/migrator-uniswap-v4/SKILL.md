---
name: migrator-uniswap-v4
description: Document and verify Doppler's Uniswap V4 migrator functionality, including standard and split migrator paths.
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Source References**: Use [Doppler deployments](https://github.com/whetstoneresearch/doppler/tree/main/deployments) as the contract source of truth for deployed addresses and revisions.

# Uniswap V4 Migrator

## When to use
- You are integrating Doppler's preferred migration destination (Uniswap V4).
- You need to reason about V4 standard migration vs split migration behavior.
- You are validating migrator outputs after `Airlock.migrate(asset)`.

## Prerequisites
- Confirm `liquidityMigrator` points to the intended V4 migrator path.
- Confirm whether split distribution is required (`UniswapV4MigratorSplit`).
- Confirm asset/numeraire orientation and recipient/locker settings.

## Core workflow
1. Trace `Airlock.migrate(asset)` through initializer exit and migrator handoff.
2. Validate selected V4 migrator path:
   - `UniswapV4MulticurveMigrator`
   - `UniswapV4MigratorSplit`
3. Verify destination V4 liquidity state and recipient/locker outcomes.
4. If split mode is active, verify split recipient payout and top-up pull-up behavior.

## Quick facts
| Item | Detail |
|---|---|
| Entrypoint caller | `Airlock.migrate(asset)` |
| Handoff call | `liquidityMigrator.migrate(...)` |
| Core contracts | `UniswapV4MulticurveMigrator`, `UniswapV4MigratorSplit` |
| Preferred posture | Canonical migration path for v4-capable deployments |

## Failure modes
- Misconfigured V4 migrator wiring in Airlock.
- Wrong migrator selection for expected split/non-split behavior.
- Incorrect `isToken0` orientation in split configuration.
- Assuming split/top-up hooks are active without explicit split migrator setup.

## References
- [OVERVIEW.md](references/OVERVIEW.md)
- [INTERFACE.md](references/INTERFACE.md)
- [VERIFICATION.md](references/VERIFICATION.md)
- [proceeds-split-migration](../proceeds-split-migration/SKILL.md)
- [pda-multicurve](../pda-multicurve/SKILL.md)
- [airlock](../airlock/SKILL.md)
- [verification](../verification/SKILL.md)
