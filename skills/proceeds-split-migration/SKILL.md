---
name: proceeds-split-migration
description: Configure and verify migration-time proceeds split flows using `ProceedsSplitter`, `TopUpDistributor`, `UniswapV4MigratorSplit`, and `UniswapV4MigratorSplitHook`.
metadata:
  author: doppler
  version: "1.0"
---

> **Source References**: Code citations link to raw GitHub files pinned to commit `46bad16d`.

# Proceeds Split Migration

## When to use
- Launch uses `UniswapV4MigratorSplit` path
- You need to configure a recipient proceeds share and top-up distribution
- You are debugging migration payouts and split accounting

## Prerequisites
- Confirm migrator module and hook addresses
- Confirm `TopUpDistributor` deployment and pull-up permissions
- Confirm token ordering (`token0 < token1`) and asset orientation (`isToken0` in split config)

## Core workflow
1. Configure migrator initialization data:
   - V4 pool params
   - locker settings / beneficiaries
   - proceeds split recipient and share
2. If split enabled (`proceedsShare > 0`), migrator stores `SplitConfiguration` via `_setSplit`.
3. Approve migrator in `TopUpDistributor` via `setPullUp(migrator, true)` from Airlock owner.
4. During migration:
   - compute balances
   - `_distributeSplit(...)` transfers split share to recipient
   - `TOP_UP_DISTRIBUTOR.pullUp(...)` forwards cumulative top-ups
5. Verify final balances and `DistributeSplit`/`PullUp` events.

## Critical constraints
- `MAX_SPLIT_SHARE = 0.5e18`
- split recipient must be nonzero
- only approved migrators can call `pullUp`
- top-ups are pair-specific and cumulative until migration pull-up

## Failure modes
- Migrator not approved in `TopUpDistributor`
- Wrong `isToken0` orientation causing split on wrong side
- Share exceeds cap or recipient is zero
- Assuming top-ups are recoverable without migration

## References
- [CONFIG.md](references/CONFIG.md)
- [FLOW.md](references/FLOW.md)
- Source: `doppler/src/base/ProceedsSplitter.sol`, `doppler/src/TopUpDistributor.sol`, `doppler/src/migrators/UniswapV4MigratorSplit.sol`

## Related skills
- [v4-multicurve-auction](../v4-multicurve-auction/SKILL.md)
- [fee-architecture](../fee-architecture/SKILL.md)
- [verification](../verification/SKILL.md)
