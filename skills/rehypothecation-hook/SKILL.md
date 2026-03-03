---
name: rehypothecation-hook
description: Operate and configure Doppler's rehypothecation hook (`RehypeDopplerHook`) for buybacks, beneficiary fees, and protocol-owner fee claims.
license: MIT
metadata:
  author: doppler
  version: "2.0"
---

> **Source References**: Use [Doppler deployments](https://github.com/whetstoneresearch/doppler/tree/main/deployments) as the contract source of truth for deployed addresses and revisions.

# Rehypothecation Hook (RehypeDopplerHook)

## When to use
- Tasks mention the rehypothecation hook, buybacks, beneficiary fee distribution, or `claimAirlockOwnerFees`
- You are troubleshooting hook-driven swap behavior for pools managed through `DopplerHookInitializer`

## Prerequisites
- Pool asset address
- Access to `DopplerHookInitializer.getState(asset)`
- Correct signer (`airlock.owner()` for protocol-owner fee claims; `buybackDst` only when using `RehypeDopplerHookMigrator.setFeeDistribution(...)`)

## Core workflow
1. Resolve pool context from initializer state and derive `poolId`.
2. Read hook state:
   - `getFeeDistributionInfo(poolId)`
   - `getHookFees(poolId)`
   - `getPoolInfo(poolId)`
3. Apply operation:
   - Collect beneficiary-directed fees with `collectFees(asset)`
   - Claim protocol-owner fees with `claimAirlockOwnerFees(asset)` from `airlock.owner()`
   - If using `RehypeDopplerHookMigrator`, update distribution with `setFeeDistribution(...)` from `buybackDst`
4. Validate storage resets and token balance deltas after each action.

## Quick facts
| Item | Detail |
|---|---|
| Initializer integration | Uses `DopplerHookInitializer.getState(asset)` |
| Distribution authority | `buybackDst` only on `RehypeDopplerHookMigrator` |
| Protocol-owner fee bucket | Claimable via `claimAirlockOwnerFees(asset)` |

## Failure modes
- Distribution does not sum to `WAD`
- Non-authorized caller for distribution update on migrator variant
- Non-owner caller for protocol-owner fee claim
- Assuming hook fees equal transferable balances without checking internal buckets

## References
- [CONFIGURATION.md](references/CONFIGURATION.md)
- Source: `doppler/src/dopplerHooks/RehypeDopplerHook.sol`, `doppler/src/dopplerHooks/RehypeDopplerHookMigrator.sol`, `doppler/docs/specs/REHYPE_AIRLOCK_OWNER_FEE_SPEC.md`

## Related skills
- [doppler-hooks](../doppler-hooks/SKILL.md)
- [fee-architecture](../fee-architecture/SKILL.md)
- [verification](../verification/SKILL.md)
