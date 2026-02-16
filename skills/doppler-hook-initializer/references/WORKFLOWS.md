# Workflows

## 1) Enable hook modules
- Call `setDopplerHookState(address[] hooks, uint256[] flags)` from Airlock owner context.
- Flags correspond to callback phases in `BaseDopplerHook`.

## 2) Initialize hook-enabled pool
- In `InitData`, set:
  - `dopplerHook`
  - `onInitializationDopplerHookCalldata`
  - `graduationDopplerHookCalldata`
- If hook is nonzero, ensure it is enabled in `isDopplerHookEnabled`.

## 3) Validate runtime behavior
- Read `getState(asset)` and derive `poolKey`/`poolId`.
- Confirm callbacks are firing for expected events.
- For swap-time behavior, inspect hook-specific storage (`ScheduledLaunchDopplerHook`, `SwapRestrictorDopplerHook`, `RehypeDopplerHook`).

## 4) Graduation and migration checks
- Verify status progression and tick/proceeds conditions before exit/migrate calls.
- If `graduationDopplerHookCalldata` is required, confirm encoding and signer path.
