---
name: fee-architecture
description: Reference for Doppler fee collection, distribution, and configuration across Airlock, FeesManager, locker contracts, and V4 hook-based fee paths.
metadata:
  author: doppler
  version: "2.0"
---

> **Source References**: Code citations link to raw GitHub files pinned to commit `46bad16d`.

# Fee Architecture

## When to use
- You need to explain where fees are tracked and who can claim them
- You are debugging protocol/integrator/beneficiary payout outcomes
- You are changing LP fee configuration or hook-driven fee behavior
- You are validating multicurve fee decay configuration (`startFee`, `fee`, `durationSeconds`, `startingTime`)

## Prerequisites
- Identify sale path (V3 static, V4 dynamic, V4 multicurve, or DopplerHookInitializer path)
- Identify whether pool is locked (beneficiaries enabled) or migrable

## Core workflow
1. Identify fee surfaces in the flow:
   - Swap-time LP fees (pool/hook context)
   - Migration-time proceeds and protocol/integrator accounting in `Airlock`
   - Beneficiary fee tracking in `FeesManager` / locker modules
2. Confirm storage owner for each fee bucket:
   - `Airlock` (`getProtocolFees`, `getIntegratorFees`)
   - Hook-local storage (for example `RehypeDopplerHook` fee buckets)
   - Locker/initializer `collectFees` paths for beneficiaries
3. Validate entitlement and permissions (airlock owner, beneficiary, buyback destination, or approved caller).
4. Reconcile balances before and after claims on-chain.

## Quick facts
| Fee type | Primary location | Typical claim path |
|---|---|---|
| Protocol/integrator accounting | `src/Airlock.sol` | Airlock-managed withdrawal flow |
| Beneficiary fees (initializer/locker) | `src/base/FeesManager.sol`, locker modules | `collectFees(...)` |
| Rehype beneficiary + airlock-owner buckets | `src/dopplerHooks/RehypeDopplerHook.sol` | `collectFees(asset)` / `claimAirlockOwnerFees(asset)` |

## Failure modes
- Wrong signer for privileged claim/update methods
- Using stale pool status assumptions (`Initialized` vs `Locked`/`Graduated`)
- Confusing proceeds split logic with LP fee accounting
- Treating V2-only mechanics as active defaults

## References
- [COLLECTION.md](references/COLLECTION.md)
- [DISTRIBUTION.md](references/DISTRIBUTION.md)
- [DYNAMIC-FEES.md](references/DYNAMIC-FEES.md)
- Source: `doppler/src/Airlock.sol`, `doppler/src/base/FeesManager.sol`, `doppler/src/StreamableFeesLockerV2.sol`, `doppler/src/dopplerHooks/RehypeDopplerHook.sol`

## Related skills
- [rehype](../rehype/SKILL.md)
- [v4-dynamic-auction](../v4-dynamic-auction/SKILL.md)
- [v4-multicurve-auction](../v4-multicurve-auction/SKILL.md)
- [proceeds-split-migration](../proceeds-split-migration/SKILL.md)
