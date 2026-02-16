# Configuration Guide

## Initialization Data (Pool Creation)
- [Source: RehypeDopplerHook.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/dopplerHooks/RehypeDopplerHook.sol) (`_onInitialization` function)
- Calldata layout (`abi.encode(...)`):
  1. `address numeraire` – token used for pricing buybacks when the asset is token0/1
  2. `address buybackDst` – recipient for both buybacks and beneficiary fee withdrawals
  3. `uint24 customFee` – fee in parts-per-million (ppm), max `1e6`
  4. `uint256 assetBuybackPercentWad`
  5. `uint256 numeraireBuybackPercentWad`
  6. `uint256 beneficiaryPercentWad`
  7. `uint256 lpPercentWad`
- Validation: the four percentages must sum to `WAD (1e18)`; otherwise `_onInitialization` reverts with `FeeDistributionMustAddUpToWAD()`.
- Hook stores:
  - `getPoolInfo[poolId] = {asset, numeraire, buybackDst}`
  - `getFeeDistributionInfo[poolId] = FeeDistributionInfo`
  - `getHookFees[poolId].customFee = customFee`
  - `getPosition[poolId]` full-range ticks + salt

## Updating Fee Distribution (buybackDst Path)
1. Compute `poolId = PoolKey.toId()`.
2. Call `setFeeDistribution(poolId, asset%, numeraire%, beneficiary%, lp%)` from the `buybackDst` address (enforced by checking `msg.sender == getPoolInfo[poolId].buybackDst`).
3. If the percentages do not sum to `WAD`, the call reverts (`FeeDistributionMustAddUpToWAD`).
4. If the caller is not `buybackDst`, the call reverts with `SenderNotAuthorized`.
5. Recommended guardrails:
   - Keep `lpPercentWad` ≥ `beneficiaryPercentWad` when swap volume is high to avoid starving rebalancing.
   - Ensure at least one of the buyback percentages is non-zero if buybackDst expects inflow.

**Note**: The `setFeeDistributionByBeneficiary()` function has been removed. Fee distribution is now controlled exclusively by `buybackDst`.

## Setting Custom Fees
- Custom fee is stored per pool inside `HookFees.customFee` and applied inside `_collectSwapFees`.
- Default value comes from initialization; to adjust post-launch, expose an initializer-side admin flow invoking `setFeesForPool` on an interface that updates `getHookFees[poolId].customFee` (see `doppler/src/interfaces/IRehypeHook.sol`).
- Keep `customFee <= 50_000` (5%) unless explicitly coordinating with integrators; larger fees drive swaps to revert due to slippage protections.

## Beneficiary Fee Collection
1. Locate the Doppler asset address.
2. Call `collectFees(asset)` directly on the hook contract.
3. Function pulls pool state from `DopplerHookInitializer.getState(asset)` to identify currencies and `poolId`.
4. Transfers `beneficiaryFees0` / `beneficiaryFees1` to `buybackDst` and zeroes storage.
5. Returned `BalanceDelta` indicates the amounts paid out; log it for accounting.

## Airlock Owner Fee Collection (5% Protocol Fee)
The Rehype hook automatically reserves 5% of all swap fees for the Airlock owner (defined by `AIRLOCK_OWNER_FEE_BPS = 500`).

1. Fees accumulate in `getHookFees[poolId].airlockOwnerFees0` and `airlockOwnerFees1`.
2. Call `claimAirlockOwnerFees(asset)` from the current `airlock.owner()` address.
3. Only the airlock owner can claim; otherwise `SenderNotAirlockOwner()` reverts.
4. Returns `(fees0, fees1)` indicating amounts transferred.
5. Emits `AirlockOwnerFeesClaimed(poolId, airlockOwner, fees0, fees1)` event.

## Safety Checklist Before Changes
- Snapshot `getFeeDistributionInfo` and `getHookFees` for the target pool.
- Verify on-chain balances of the hook match `beneficiaryFees` to avoid payout underflows.
- Run at least the unit regression suite (`forge test --match-contract RehypeDopplerHook`) when touching configuration logic.
- Coordinate with governance if `buybackDst` changes, since it multiplexes both buybacks and beneficiary payouts.
