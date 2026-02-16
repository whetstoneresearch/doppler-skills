---
name: rehype
description: Operate, configure, test, and deploy Doppler's Rehype V4 hook for buybacks, beneficiary fees, and airlock-owner fee claims.
metadata:
  owner: doppler
  version: "2.0"
---

> **Source References**: Code citations link to raw GitHub files pinned to commit `46bad16d`.

# Rehype Doppler Hook

## When to use
- Tasks mention Rehype, buybacks, fee distribution, or `claimAirlockOwnerFees`
- You are working in `src/dopplerHooks/RehypeDopplerHook.sol`
- You are troubleshooting hook-driven swap behavior for pools managed through `DopplerHookInitializer`

## Prerequisites
- Pool asset address
- Access to `DopplerHookInitializer.getState(asset)`
- Correct signer (`buybackDst` for fee distribution updates, `airlock.owner()` for owner-fee claims)

## Core workflow
1. Resolve pool context from initializer state and derive `poolId`.
2. Read hook state:
   - `getFeeDistributionInfo(poolId)`
   - `getHookFees(poolId)`
   - `getPoolInfo(poolId)`
3. Apply operation:
   - Update distribution with `setFeeDistribution(...)` from `buybackDst`
   - Collect beneficiary-directed fees with `collectFees(asset)`
   - Claim 5% owner fees with `claimAirlockOwnerFees(asset)` from `airlock.owner()`
4. Validate storage resets and token balance deltas after each action.

## Quick facts
| Item | Detail |
|---|---|
| Initializer integration | Uses `DopplerHookInitializer.getState(asset)` |
| Distribution authority | `buybackDst` only |
| Airlock owner fees | Separate 5% bucket, claimable via `claimAirlockOwnerFees` |
| Primary tests | `test/integration/RehypeDopplerHook.t.sol` |

## Failure modes
- Distribution does not sum to `WAD`
- Non-authorized caller for distribution update
- Non-owner caller for owner-fee claim
- Assuming hook fees equal transferable balances without checking internal buckets

## References
- [CONFIGURATION.md](references/CONFIGURATION.md)
- [TESTING.md](references/TESTING.md)
- [DEPLOYMENT.md](references/DEPLOYMENT.md)
- Source: `doppler/src/dopplerHooks/RehypeDopplerHook.sol`, `doppler/docs/specs/REHYPE_AIRLOCK_OWNER_FEE_SPEC.md`

## Related skills
- [doppler-hook-initializer](../doppler-hook-initializer/SKILL.md)
- [fee-architecture](../fee-architecture/SKILL.md)
- [verification](../verification/SKILL.md)
