# Configuration Guide

## Initialization Data (Pool Creation)
- [Source: RehypeDopplerHook](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/dopplerHooks/RehypeDopplerHook.sol)
- [Source: RehypeDopplerHookMigrator](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/dopplerHooks/RehypeDopplerHookMigrator.sol)
- Calldata layout (`abi.encode(...)` of `InitData`):
  1. `address numeraire` – token used for pricing buybacks when the asset is token0/1
  2. `address buybackDst` – recipient for buybacks and beneficiary fee withdrawals
  3. `uint24 customFee` – fee in parts-per-million (ppm), max `1e6`
  4. `FeeRoutingMode feeRoutingMode`
  5. `FeeDistributionInfo feeDistributionInfo`:
     - `assetFeesToAssetBuybackWad`
     - `assetFeesToNumeraireBuybackWad`
     - `assetFeesToBeneficiaryWad`
     - `assetFeesToLpWad`
     - `numeraireFeesToAssetBuybackWad`
     - `numeraireFeesToNumeraireBuybackWad`
     - `numeraireFeesToBeneficiaryWad`
     - `numeraireFeesToLpWad`
- Validation:
  - Asset-fee row must sum to `WAD (1e18)`
  - Numeraire-fee row must sum to `WAD (1e18)`

## Updating Fee Distribution (Migrator Variant Only)
`RehypeDopplerHook` does not expose an external `setFeeDistribution(...)` function.

For deployments using `RehypeDopplerHookMigrator`:

1. Compute `poolId = PoolKey.toId()`.
2. Call `setFeeDistribution(poolId, assetFeesToAssetBuybackWad, assetFeesToNumeraireBuybackWad, assetFeesToBeneficiaryWad, assetFeesToLpWad, numeraireFeesToAssetBuybackWad, numeraireFeesToNumeraireBuybackWad, numeraireFeesToBeneficiaryWad, numeraireFeesToLpWad)` from the `buybackDst` address.
3. If either 4-field row does not sum to `WAD`, the call reverts (`FeeDistributionMustAddUpToWAD`).
4. If the caller is not `buybackDst`, the call reverts with `SenderNotAuthorized`.
5. Recommended guardrails:
    - Keep LP allocation healthy (`assetFeesToLpWad`, `numeraireFeesToLpWad`) relative to beneficiary allocation when swap volume is high.
    - Ensure at least one buyback destination is non-zero per row when `buybackDst` expects inflow.

**Note**: The `setFeeDistributionByBeneficiary()` function has been removed. Fee distribution is now controlled exclusively by `buybackDst`.

## Setting Custom Fees
- Custom fee is configured per pool at initialization.
- Keep `customFee <= 50_000` (5%) unless explicitly coordinating with integrators; larger fees drive swaps to revert due to slippage protections.

## Beneficiary Fee Collection
1. Locate the Doppler asset address.
2. Call `collectFees(asset)` directly on the hook contract.
3. Function pulls pool state from `DopplerHookInitializer.getState(asset)` to identify currencies and `poolId`.
4. Transfers accrued beneficiary fees to `buybackDst`.
5. Returned `BalanceDelta` indicates the amounts paid out; log it for accounting.

## Protocol Owner Fee Collection
The rehypothecation hook (`RehypeDopplerHook`) tracks a protocol-owner fee bucket.

1. Fees accumulate in `getHookFees[poolId].airlockOwnerFees0` and `airlockOwnerFees1`.
2. Call `claimAirlockOwnerFees(asset)` from the current `airlock.owner()` address.
3. Only the current Airlock owner can claim this bucket.
4. Returns `(fees0, fees1)` indicating transferred amounts.

## Operational Checklist
- Snapshot `getFeeDistributionInfo` and `getHookFees` for the target pool.
- Verify on-chain balances of the hook match `beneficiaryFees` to avoid payout underflows.
- Ensure `buybackDst` is set correctly, since it multiplexes both buybacks and beneficiary payouts.
- If protocol-owner fee claiming is part of your flow, confirm `airlock.owner()` before calling `claimAirlockOwnerFees(asset)`.
