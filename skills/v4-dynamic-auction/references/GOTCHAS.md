# V4 Dynamic Auction Gotchas

Critical edge cases and common pitfalls when working with V4 dynamic auctions.

## 1. Token Ordering (Same as V3)

**The Problem**: Uniswap V4 uses `token0 < token1` ordering. The `isToken0` flag determines all direction logic.

**Impact**:
- Tick direction flips
- Rounding direction changes
- Position range calculations invert
- Expected tick comparisons reverse

**The Code**:
```solidity
if (isToken0_ && startingTick_ < endingTick_) revert InvalidTickRange();
if (!isToken0_ && startingTick_ > endingTick_) revert InvalidTickRange();
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 298-299)

**Rule of thumb**:
- `isToken0 = true`: startingTick > endingTick (price decreases)
- `isToken0 = false`: startingTick < endingTick (price decreases)

---

## 2. Epoch Boundary Timing

**The Problem**: Rebalance only happens ONCE per epoch, triggered by the first swap in that epoch.

**The Code**:
```solidity
if (_getCurrentEpoch() <= uint256(state.lastEpoch)) {
    return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
}
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 404-407)

**Impact**:
- If no swaps occur for multiple epochs, rebalance catches up all at once
- Dynamic auction adjustments compound for skipped epochs
- First swap in new epoch may experience significant price movement

**The catch-up loop**:
```solidity
while (epochsPassed > 1) {
    epochsPassed--;
    // Apply dynamic auction for each missed epoch
}
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 667-675)

---

## 3. Insufficient Proceeds Phase is Permanent

**The Problem**: Once `insufficientProceeds = true`, the pool enters a restricted refund mode that cannot be reversed.

**The Code**:
```solidity
if (state.totalProceeds < minimumProceeds) {
    insufficientProceeds = true;
    emit InsufficientProceeds();
    // ... repositions to average price ...
}
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 415-458)

**Behavior**:
- Only asset→numeraire swaps allowed (users sell back tokens)
- Swap fee overridden to 0
- `migrate()` is NOT callable
- Pool remains open indefinitely for refunds

**Key difference from V3**: V3 has no refund mechanism - liquidity is permanently locked if price doesn't reach target.

---

## 4. Early Exit Blocks All Swaps

**The Problem**: Once `maximumProceeds` is reached, ALL swaps are blocked.

**The Code**:
```solidity
if (earlyExit) revert MaximumProceedsReached();
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 400)

**Impact**:
- No further trading possible after early exit
- Users cannot sell back tokens
- Must call `migrate()` to extract liquidity

---

## 5. Fee Exclusion Changes Accounting

**The Problem**: LP and protocol fees are NOT included in `totalTokensSold` or `totalProceeds`.

**The Code**:
```solidity
uint256 tokensSoldLessFee = FullMath.mulDiv(uint128(-amount0), MAX_SWAP_FEE - swapFee, MAX_SWAP_FEE);
state.totalTokensSold -= tokensSoldLessFee;
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 545-546)

**Impact**:
- Expected sales curve is based on pre-fee amounts
- Actual tokens received by users = amount - fees
- This is intentional - prevents fee accumulation from distorting the auction

**Fees are tracked separately**:
```solidity
state.feesAccrued = add(state.feesAccrued, feeDeltas);
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 1121)

---

## 6. Price Bounds Enforcement (Corrective Swaps)

**The Problem**: afterSwap may execute additional swaps to keep price in range.

**The Code**:
```solidity
bool tickAboveCurve = isToken0 ? currentTick > topOfCurveTick : currentTick < topOfCurveTick;
bool tickBelowCurve = isToken0 ? currentTick < tickLower : currentTick > tickLower;

if (tickAboveCurve) {
    poolManager.swap(key, SwapParams({...}), "");  // Move price back down
} else if (tickBelowCurve) {
    poolManager.swap(key, SwapParams({...}), "");  // Move price back up
}
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 507-535)

**Impact**:
- Large swaps may trigger small corrective swaps
- These corrective swaps use `amountSpecified = 1`
- Users don't pay for these, but they affect final tick

---

## 7. Gamma Must Be Divisible by Tick Spacing

**The Problem**: Gamma validation happens in two places - constructor and beforeInitialize.

**Constructor check** (line 307-311):
```solidity
if (
    gamma_ <= 0
        || FullMath.mulDiv(FullMath.mulDiv(epochLength_, WAD, timeDelta), uint256(int256(gamma_)), WAD) == 0
) {
    revert InvalidGamma();
}
```

**beforeInitialize check** (line 355):
```solidity
if (gamma % key.tickSpacing != 0) revert InvalidGamma();
```

**Impact**: Pool creation fails if gamma is not compatible with tick spacing. This is checked AFTER the hook is deployed.

---

## 8. beforeSwap Only Triggers Rebalance (Not Init)

**The Problem**: Initial liquidity is placed in `afterInitialize`, not `beforeSwap`.

**Sequence**:
1. `beforeInitialize` - Validation only
2. `afterInitialize` - Places initial slugs via `_unlockCallback`
3. `beforeSwap` - Rebalance only if new epoch

**Impact**: If you're looking for where initial positions are placed, check `_unlockCallback`, not `_rebalance`.

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (line 372 triggers unlock callback)

---

## 9. Migration Caller Restriction

**The Problem**: Only the `initializer` address can call `migrate()`.

**The Code**:
```solidity
function migrate(address recipient) external returns (...) {
    if (msg.sender != initializer) revert SenderNotInitializer();
    // ...
}
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 1385)

**Impact**:
- `initializer` is set at deployment (typically the Airlock contract)
- Cannot be changed after deployment
- If Airlock contract is compromised or has bugs, migration may be blocked

---

## 10. Start Time Guard

**The Problem**: No swaps allowed before `startingTime`.

**The Code**:
```solidity
if (block.timestamp < startingTime) revert CannotSwapBeforeStartTime();
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 402)

**Additional constructor check**:
```solidity
if (block.timestamp > startingTime_) revert InvalidStartTime();
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 293)

**Impact**: Pool can be initialized before start time, but swaps are blocked.

---

## 11. Max Tick Spacing Limit

**The Problem**: V4 Doppler enforces `tickSpacing <= 30`.

**The Code**:
```solidity
if (key.tickSpacing > MAX_TICK_SPACING) revert InvalidTickSpacing();
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 350)

**Impact**: Cannot use high tick spacing pools (e.g., 200 for 1% fee) with Doppler hooks.

---

## 12. Donations Always Revert

**The Problem**: The `beforeDonate` hook always reverts.

**The Code**:
```solidity
function _beforeDonate(...) internal pure override returns (bytes4) {
    revert CannotDonate();
}
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 377-385)

**Impact**: Cannot donate tokens to the pool to add liquidity outside of normal operations.

---

## 13. Zero Liquidity Slug Handling

**The Problem**: If a slug has zero liquidity, its ticks are set equal.

**The Code**:
```solidity
if (slug.liquidity == 0) {
    slug.tickLower = slug.tickUpper;
}
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 942-944)

**Why**: Prevents swaps from entering empty ranges, which would otherwise cause accounting issues.

---

## 14. Comparison with V3 Gotchas

| Gotcha | V3 Static | V4 Dynamic |
|--------|-----------|------------|
| Token ordering | Same issue | Same issue |
| Exit condition | Must reach far tick | Proceeds thresholds |
| Tick alignment | Same rounding logic | Same rounding logic |
| Early exit | Not possible | Automatic at maxProceeds |
| Refund mechanism | None | Insufficient proceeds phase |
| Fee handling | N/A | Excluded from totals |
| Rebalancing | N/A | Once per epoch only |
