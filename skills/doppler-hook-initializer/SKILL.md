---
name: doppler-hook-initializer
description: Configure and operate `DopplerHookInitializer` pools, including hook enablement flags, pool lifecycle state, hook callbacks, delegated authority, and graduation gating.
metadata:
  author: doppler
  version: "1.0"
---

> **Source References**: Code citations link to raw GitHub files pinned to commit `46bad16d`.

# Doppler Hook Initializer

## When to use
- You are using `src/initializers/DopplerHookInitializer.sol`
- You need to register/manage Doppler hooks for pool initialization/swap/graduation callbacks
- You are troubleshooting hook-enabled multicurve pools and lifecycle transitions

## Prerequisites
- Airlock owner or authorized operator for module-level mutations
- Asset/numeraire addresses and expected pool mode (locked vs migrable)
- Hook contract addresses and intended flags

## Core workflow
1. Enable hook modules at initializer level with `setDopplerHookState(...)`.
2. Initialize pool with `InitData` including optional `dopplerHook` and callback calldata.
3. Confirm stored state via `getState(asset)`:
   - pool key
   - far tick
   - status
   - selected hook
4. Validate callback execution path by flag:
   - `ON_INITIALIZATION_FLAG`
   - `ON_SWAP_FLAG`
   - `ON_GRADUATION_FLAG`
5. Manage runtime controls:
   - `setAuthority(...)` and delegated execution
   - `setDopplerHook(asset, hook, calldata)` when supported by authorization
   - graduation / migration flow checks

## Supported hook patterns
- `RehypeDopplerHook` for buybacks and fee routing
- `ScheduledLaunchDopplerHook` for start-time gates
- `SwapRestrictorDopplerHook` for per-address amount ceilings

## Failure modes
- Hook not enabled at initializer level before assignment
- Wrong signer (airlock owner vs delegated authority)
- Incorrect callback calldata encoding
- Status mismatch (`WrongPoolStatus` cases)
- Attempting migration without graduation conditions met

## References
- [WORKFLOWS.md](references/WORKFLOWS.md)
- [STATE-MAP.md](references/STATE-MAP.md)
- Source: `doppler/src/initializers/DopplerHookInitializer.sol`, `doppler/src/base/BaseDopplerHook.sol`, `doppler/docs/DopplerHook.md`

## Related skills
- [rehype](../rehype/SKILL.md)
- [v4-multicurve-auction](../v4-multicurve-auction/SKILL.md)
- [verification](../verification/SKILL.md)
