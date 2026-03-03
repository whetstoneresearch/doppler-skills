---
name: migrator-uniswap-v3
description: Document and verify Doppler's Uniswap V3 liquidity migrator path, used only on v3-only networks when custom fees are required.
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Source References**: Use [Doppler deployments](https://github.com/whetstoneresearch/doppler/tree/main/deployments) as the contract source of truth for deployed addresses and revisions.

# Uniswap V3 Migrator

## When to use
- The target network is legacy and does not support Uniswap V4.
- Custom fee requirements make V3 migration necessary for this launch.
- You need to verify Airlock-to-migrator handoff for a V3 destination.

## Prerequisites
- Confirm V4 is unavailable on the target network.
- Confirm custom fee requirements are explicit and approved.
- Confirm `liquidityMigrator` points to the intended V3 migrator implementation.

## Core workflow
1. Validate V3-only + custom-fee gating decision.
2. Trace `Airlock.migrate(asset)` into migrator handoff.
3. Verify V3 destination position/pool state after migration.
4. Validate recipient/locker ownership and post-migration balances.

## Quick facts
| Item | Detail |
|---|---|
| Entrypoint caller | `Airlock.migrate(asset)` |
| Handoff call | `liquidityMigrator.migrate(...)` |
| Canonical source file | `doppler/src/migrators/UniswapV3Migrator.sol` |
| Policy posture | Conditional fallback: v3-only network + custom fees required |

## Failure modes
- Selecting V3 while V4 is available.
- Selecting V3 without a strict custom-fee requirement.
- Wrong V3 fee-tier/tick-spacing assumptions for destination liquidity.
- Token orientation mismatch between Airlock output and V3 destination setup.

## References
- [OVERVIEW.md](references/OVERVIEW.md)
- [INTERFACE.md](references/INTERFACE.md)
- [VERIFICATION.md](references/VERIFICATION.md)
- [liquidity-migration](../liquidity-migration/SKILL.md)
- [airlock](../airlock/SKILL.md)
- [verification](../verification/SKILL.md)
