# V4 Dynamic Auction Lifecycle

## Overview

```
┌────────────┐     ┌─────────────────┐     ┌───────────────┐
│ Initialize │ --> │  Epoch Trading  │ --> │ Exit/Migrate  │
│            │     │  (Rebalancing)  │     │               │
└────────────┘     └─────────────────┘     └───────────────┘
    Pool setup        beforeSwap/           Three paths:
    Initial slugs     afterSwap hooks       - Early exit
                                            - Success
                                            - Insufficient
```

## Phase 1: Initialization

### Step 1: beforeInitialize
**Entry point**: Pool manager calls `_beforeInitialize()`
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 344-358)

```solidity
function _beforeInitialize(address, PoolKey calldata key, uint160) internal override returns (bytes4) {
    if (isInitialized) revert AlreadyInitialized();
    isInitialized = true;
    poolKey = key;

    // Enforce maximum tick spacing
    if (key.tickSpacing > MAX_TICK_SPACING) revert InvalidTickSpacing();

    // Enforce gamma divisibility
    if (gamma % key.tickSpacing != 0) revert InvalidGamma();

    return BaseHook.beforeInitialize.selector;
}
```

### Step 2: afterInitialize
**Entry point**: Pool manager calls `_afterInitialize()`
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 365-374)

```solidity
function _afterInitialize(
    address sender,
    PoolKey calldata key,
    uint160,
    int24 tick
) internal override returns (bytes4) {
    poolManager.updateDynamicLPFee(key, initialLpFee);
    poolManager.unlock(abi.encode(CallbackData({ key: key, sender: sender, tick: tick, isMigration: false })));
    return BaseHook.afterInitialize.selector;
}
```

This triggers `_unlockCallback` which places initial liquidity slugs.

## Phase 2: Epoch Trading (Rebalancing)

### beforeSwap Hook
**Entry point**: Called before every swap
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 394-483)

#### Decision Flow:

```
beforeSwap()
    │
    ├─► earlyExit? ──► revert MaximumProceedsReached
    │
    ├─► before startingTime? ──► revert CannotSwapBeforeStartTime
    │
    ├─► same epoch as lastEpoch? ──► return (no rebalance)
    │
    ├─► after endingTime AND !insufficientProceeds?
    │       │
    │       ├─► totalProceeds < minimumProceeds?
    │       │       └─► Enter INSUFFICIENT PROCEEDS phase
    │       │           - Set insufficientProceeds = true
    │       │           - Clear all positions
    │       │           - Place single lower slug at average price
    │       │
    │       └─► totalProceeds >= minimumProceeds?
    │               └─► revert InvalidSwapAfterMaturitySufficientProceeds
    │
    └─► Normal operation
            │
            ├─► !insufficientProceeds? ──► _rebalance(key)
            │
            └─► insufficientProceeds?
                    ├─► Swap direction = asset→numeraire? ──► Allow (fee = 0)
                    └─► Swap direction = numeraire→asset? ──► revert
```

### Rebalance Logic
**Entry point**: `_rebalance(key)` called from beforeSwap
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 604-777)

#### Step-by-step:

1. **Update epoch tracking** (lines 606-609):
   ```solidity
   uint256 currentEpoch = _getCurrentEpoch();
   uint256 epochsPassed = currentEpoch - uint256(state.lastEpoch);
   state.lastEpoch = uint40(currentEpoch);
   ```

2. **Compute tick accumulator delta** (lines 621-675):
   - Check if undersold or oversold
   - Apply appropriate dynamic auction mode
   - Handle multiple skipped epochs

3. **Update tick accumulator** (lines 679-683):
   ```solidity
   newAccumulator = state.tickAccumulator + accumulatorDelta;
   if (accumulatorDelta != 0) {
       state.tickAccumulator = newAccumulator;
   }
   ```

4. **Compute new tick range** (line 688):
   ```solidity
   (int24 tickLower, int24 tickUpper) = _getTicksBasedOnState(newAccumulator, key.tickSpacing);
   ```

5. **Clear old positions** (lines 706-714):
   ```solidity
   Position[] memory prevPositions = new Position[](NUM_DEFAULT_SLUGS - 1 + numPDSlugs);
   // ... populate from storage
   (BalanceDelta positionDeltas,) = _clearPositions(prevPositions, key);
   ```

6. **Compute new slug data** (lines 732-737):
   ```solidity
   SlugData memory lowerSlug = _computeLowerSlugData(...);
   (SlugData memory upperSlug, uint256 assetRemaining) = _computeUpperSlugData(...);
   SlugData[] memory priceDiscoverySlugs = _computePriceDiscoverySlugsData(...);
   ```

7. **Place new positions** (lines 762-775):
   ```solidity
   _update(newPositions, sqrtPriceX96, sqrtPriceNext, key);
   // Store positions in mapping
   ```

8. **Emit event** (line 776):
   ```solidity
   emit Rebalance(currentTick, tickLower, tickUpper, currentEpoch);
   ```

### afterSwap Hook
**Entry point**: Called after every swap
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 493-583)

#### Responsibilities:

1. **Skip if insufficient proceeds** (line 500):
   ```solidity
   if (insufficientProceeds) return (BaseHook.afterSwap.selector, 0);
   ```

2. **Enforce price bounds** (lines 507-535):
   - If tick above curve top → swap to bring back in range
   - If tick below lower slug → swap to bring back in range

3. **Update totals** (lines 540-572):
   - Track `totalTokensSold` (add when buying asset, subtract when selling)
   - Track `totalProceeds` (add when selling asset, subtract when buying)
   - **Exclude fees** from both calculations

4. **Check early exit** (lines 574-578):
   ```solidity
   if (state.totalProceeds >= maximumProceeds) {
       earlyExit = true;
       emit EarlyExit(_getCurrentEpoch());
   }
   ```

5. **Emit swap event** (line 580):
   ```solidity
   emit Swap(currentTick, state.totalProceeds, state.totalTokensSold);
   ```

## Phase 3: Exit Paths

### Path A: Early Exit
**Trigger**: `totalProceeds >= maximumProceeds` during afterSwap
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 574-577)

**Behavior**:
- `earlyExit = true` is set
- All subsequent swaps revert with `MaximumProceedsReached`
- `migrate()` becomes callable immediately

### Path B: Successful Completion
**Trigger**: `endingTime` reached AND `totalProceeds >= minimumProceeds`

**Behavior**:
- No new swaps allowed (reverts with `InvalidSwapAfterMaturitySufficientProceeds`)
- `migrate()` becomes callable

### Path C: Insufficient Proceeds (Refund Phase)
**Trigger**: `endingTime` reached AND `totalProceeds < minimumProceeds`
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 412-467)

**Behavior**:
1. `insufficientProceeds = true` is set
2. All positions cleared
3. Single lower slug placed at **average clearing price**
4. Only asset→numeraire swaps allowed (users sell back their tokens)
5. Swap fee overridden to 0
6. `migrate()` is NOT callable (pool remains for refunds)

### Migration
**Entry point**: `migrate(recipient)` called by initializer (Airlock)
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 1373-1421)

```solidity
function migrate(address recipient) external returns (...) {
    if (msg.sender != initializer) revert SenderNotInitializer();

    // Check exit conditions
    if (!earlyExit && !(state.totalProceeds >= minimumProceeds && block.timestamp >= endingTime)) {
        revert CannotMigrate();
    }

    // Clear remaining positions via unlock callback
    bytes memory data = poolManager.unlock(
        abi.encode(CallbackData({ key: poolKey, sender: recipient, tick: 0, isMigration: true }))
    );

    // Transfer all tokens to recipient
    // ... includes dust cleanup
}
```

**Returns**:
- `sqrtPriceX96`: Final pool price
- `token0`, `token1`: Token addresses
- `fees0`, `fees1`: Accumulated fees
- `balance0`, `balance1`: Total balances transferred

## Hook Permissions

```solidity
Hooks.Permissions({
    beforeInitialize: true,
    afterInitialize: true,
    beforeAddLiquidity: true,   // Reverts if caller != this
    beforeRemoveLiquidity: false,
    afterAddLiquidity: false,
    afterRemoveLiquidity: false,
    beforeSwap: true,           // Rebalancing logic
    afterSwap: true,            // Accounting logic
    beforeDonate: true,         // Always reverts
    afterDonate: false,
    beforeSwapReturnDelta: false,
    afterSwapReturnDelta: false,
    afterAddLiquidityReturnDelta: false,
    afterRemoveLiquidityReturnDelta: false
})
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 1342-1358)

## Comparison with V3 Lifecycle

| Phase | V3 Static | V4 Dynamic |
|-------|-----------|------------|
| Init | Mint all positions at once | Place initial slugs |
| Active | No changes | Rebalance every epoch |
| Accounting | N/A | afterSwap updates totals |
| Exit trigger | Price at far tick | Proceeds thresholds or time |
| Migration | Always available at exit | Conditional on proceeds |
| Refund | N/A | Insufficient proceeds phase |
