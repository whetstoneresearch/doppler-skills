---
name: rehypothecation-hook
description: Operate and configure Doppler's Rehype hook variants for buybacks, beneficiary fees, fee routing, and protocol-owner fee claims.
license: MIT
metadata:
  author: doppler
  version: "2.0"
---

> **Source References**: Use [Doppler deployments](https://github.com/whetstoneresearch/doppler/tree/main/deployments) as the contract source of truth for deployed addresses and revisions.

# Rehypothecation Hook (Rehype)

## When to use
- Tasks mention Rehype, the rehypothecation hook, buybacks, beneficiary fee distribution, or `claimAirlockOwnerFees`
- You are troubleshooting hook-driven swap behavior for pools managed through `DopplerHookInitializer` or `DopplerHookMigrator`

## Prerequisites
- Pool asset address
- Determine whether the pool uses `RehypeDopplerHookInitializer` or `RehypeDopplerHookMigrator`
- Access to `DopplerHookInitializer.getState(asset)` for initializer-side pools
- Correct signer (`airlock.owner()` for protocol-owner fee claims; `buybackDst` only when using `RehypeDopplerHookMigrator.setFeeDistribution(...)`)

## Core workflow
1. Resolve pool context and derive `poolId`.
   - Initializer-side: use `DopplerHookInitializer.getState(asset)`
   - Migrator-side: resolve the pair with `DopplerHookMigrator.getPair(asset)` and `getAssetData(...)`
2. Read hook state:
   - `getFeeDistributionInfo(poolId)`
   - `getHookFees(poolId)`
   - `getPoolInfo(poolId)`
   - `getFeeRoutingMode(poolId)`
   - `getFeeSchedule(poolId)` for `RehypeDopplerHookInitializer`
3. Apply operation:
   - Collect beneficiary-directed fees with `collectFees(asset)`
   - Claim protocol-owner fees with `claimAirlockOwnerFees(asset)` from `airlock.owner()`
   - If using `RehypeDopplerHookMigrator`, update distribution with `setFeeDistribution(...)` from `buybackDst`
4. Validate storage resets and token balance deltas after each action.

## Quick facts
| Item | Detail |
|---|---|
| Current variants | `RehypeDopplerHookInitializer`, `RehypeDopplerHookMigrator` |
| Initializer fee model | Decaying fee schedule via `getFeeSchedule(poolId)` |
| Migrator fee model | Static `customFee` stored in `getHookFees(poolId).customFee` |
| Distribution authority | `buybackDst` only on `RehypeDopplerHookMigrator` |
| Fee routing modes | `DirectBuyback`, `RouteToBeneficiaryFees` |
| Airlock owner share | Fixed 5% of the raw hook fee |
| Protocol-owner fee bucket | Claimable via `claimAirlockOwnerFees(asset)` |

## Failure modes
- Treating initializer-side Rehype as a static `customFee` hook instead of a fee-schedule hook
- Distribution does not sum to `WAD`
- Non-authorized caller for distribution update on migrator variant
- Non-owner caller for protocol-owner fee claim
- Confusing Rehype `beneficiaryFees` with initializer or migrator beneficiary-share accounting
- Assuming hook fees equal transferable balances without checking internal buckets

## References
- [CONFIGURATION.md](references/CONFIGURATION.md)
- Source: `doppler/src/dopplerHooks/RehypeDopplerHookInitializer.sol`, `doppler/src/dopplerHooks/RehypeDopplerHookMigrator.sol`, `doppler/src/types/RehypeTypes.sol`, `doppler/docs/RehypeDopplerHookInitializer.md`, `doppler/docs/RehypeDopplerHookMigrator.md`

## Related skills
- [doppler-hooks](../doppler-hooks/SKILL.md)
- [fee-architecture](../fee-architecture/SKILL.md)
- [verification](../verification/SKILL.md)
