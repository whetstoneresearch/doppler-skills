# Configuration Guide

## Source of truth
- `doppler/src/dopplerHooks/RehypeDopplerHookInitializer.sol`
- `doppler/src/dopplerHooks/RehypeDopplerHookMigrator.sol`
- `doppler/src/types/RehypeTypes.sol`
- `doppler/docs/RehypeDopplerHookInitializer.md`
- `doppler/docs/RehypeDopplerHookMigrator.md`

## Initializer-side configuration
Use this path for `RehypeDopplerHookInitializer`.

- Calldata layout (`abi.encode(...)` of `RehypeTypes.InitData`):
  1. `address numeraire`
  2. `address buybackDst`
  3. `uint24 startFee`
  4. `uint24 endFee`
  5. `uint32 durationSeconds`
  6. `uint32 startingTime`
  7. `FeeRoutingMode feeRoutingMode`
  8. `FeeDistributionInfo feeDistributionInfo`
- Validation:
  - `startFee <= MAX_SWAP_FEE`
  - `endFee <= MAX_SWAP_FEE`
  - `startFee >= endFee`
  - if `startFee > endFee`, `durationSeconds > 0`
  - each 4-field fee-distribution row must sum to `WAD (1e18)`
  - `startingTime` is normalized to `block.timestamp` when passed as `0` or already in the past
- Operational note:
  - initializer-side Rehype does not use `getHookFees(poolId).customFee` as its fee source of truth
  - read `getFeeSchedule(poolId)` instead

## Migrator-side configuration
Use this path for `RehypeDopplerHookMigrator`.

- Calldata layout (`abi.encode(...)` of `RehypeTypes.MigratorInitData`):
  1. `address numeraire`
  2. `address buybackDst`
  3. `uint24 customFee`
  4. `FeeRoutingMode feeRoutingMode`
  5. `FeeDistributionInfo feeDistributionInfo`
- Validation:
  - `customFee <= MAX_SWAP_FEE`
  - each 4-field fee-distribution row must sum to `WAD (1e18)`
- Operational note:
  - migrator-side Rehype stores its static fee in `getHookFees(poolId).customFee`

## Updating Fee Distribution (Migrator Variant Only)
`RehypeDopplerHookInitializer` does not expose an external `setFeeDistribution(...)` function.

For deployments using `RehypeDopplerHookMigrator`:

1. Compute `poolId = PoolKey.toId()`.
2. Call `setFeeDistribution(poolId, assetFeesToAssetBuybackWad, assetFeesToNumeraireBuybackWad, assetFeesToBeneficiaryWad, assetFeesToLpWad, numeraireFeesToAssetBuybackWad, numeraireFeesToNumeraireBuybackWad, numeraireFeesToBeneficiaryWad, numeraireFeesToLpWad)` from the `buybackDst` address.
3. If either 4-field row does not sum to `WAD`, the call reverts (`FeeDistributionMustAddUpToWAD`).
4. If the caller is not `buybackDst`, the call reverts with `SenderNotAuthorized`.
5. Recommended guardrails:
   - Keep LP allocation healthy (`assetFeesToLpWad`, `numeraireFeesToLpWad`) relative to beneficiary allocation when swap volume is high.
   - Ensure the buyback and beneficiary paths still match the intended `FeeRoutingMode`.

## Beneficiary Fee Collection
1. Locate the Doppler asset address.
2. Call `collectFees(asset)` directly on the hook contract.
3. Resolve the pool according to the hook variant.
   - Initializer-side: `DopplerHookInitializer.getState(asset)`
   - Migrator-side: `DopplerHookMigrator.getPair(asset)` and `getAssetData(...)`
4. Transfers accrued beneficiary fees to `buybackDst`.
5. Returned `BalanceDelta` indicates the amounts paid out; log it for accounting.

## Protocol Owner Fee Collection
Both Rehype variants track a protocol-owner fee bucket.

1. Fees accumulate in `getHookFees[poolId].airlockOwnerFees0` and `airlockOwnerFees1`.
2. Call `claimAirlockOwnerFees(asset)` from the current `airlock.owner()` address.
3. Only the current Airlock owner can claim this bucket.
4. Returns `(fees0, fees1)` indicating transferred amounts.

## Fee routing behavior
- `FeeRoutingMode.DirectBuyback` transfers buyback-designated outputs directly to `buybackDst`.
- `FeeRoutingMode.RouteToBeneficiaryFees` rolls those outputs into Rehype's internal `beneficiaryFees` buckets instead.
- Rehype beneficiary fees are internal hook accounting that is ultimately claimed to `buybackDst`.
- They are separate from beneficiary-share accounting managed by the initializer, locker, or migrator flow.

## Runtime notes
- Rehype takes a fixed 5% share of the raw hook fee for the Airlock owner, with the remaining 95% routed through buybacks, beneficiary accounting, and LP reinvestment.
- Routing only proceeds once accumulated `fees0` or `fees1` exceed `EPSILON`.
- LP-designated fees are rebalanced and added back into a full-range LP position instead of sitting idle.

## Operational Checklist
- Snapshot `getFeeDistributionInfo`, `getHookFees`, and `getPoolInfo` for the target pool.
- On initializer-side pools, snapshot `getFeeSchedule(poolId)` as well.
- Verify on-chain balances of the hook match `beneficiaryFees` to avoid payout underflows.
- Ensure `buybackDst` is set correctly, since it multiplexes both buybacks and beneficiary payouts.
- Confirm whether the hook is initializer-side or migrator-side before assuming `customFee` or `setFeeDistribution(...)` behavior.
- If protocol-owner fee claiming is part of your flow, confirm `airlock.owner()` before calling `claimAirlockOwnerFees(asset)`.
