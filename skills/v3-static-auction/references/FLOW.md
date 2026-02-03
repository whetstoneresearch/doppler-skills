# V3 Static Auction Lifecycle

## Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Initialize  │ --> │   Active    │ --> │    Exit     │
│             │     │  (Static)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
     Airlock          No changes         Price at far
    calls init                            tick required
```

## Phase 1: Initialization

**Entry point**: `initialize()` called by Airlock
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 95-153)

### Step-by-step Flow

#### 1. Decode and Validate Parameters
```solidity
InitData memory initData = abi.decode(data, (InitData));
require(maxShareToBeSold <= WAD, MaxShareToBeSoldExceeded(...));
require(tickLower < tickUpper, InvalidTickRangeMisordered(...));
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 102-107)

#### 2. Get Tick Spacing from Factory
```solidity
int24 tickSpacing = factory.feeAmountTickSpacing(fee);
if (tickSpacing == 0) revert InvalidFee(fee);
checkPoolParams(tickLower, tickSpacing);
checkPoolParams(tickUpper, tickSpacing);
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 109-113)

#### 3. Determine Token Ordering
```solidity
(address token0, address token1) = asset < numeraire
    ? (asset, numeraire)
    : (numeraire, asset);
```
Uniswap V3 always stores `token0 < token1`. The `asset` (token being sold) may be either.
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 115)

#### 4. Calculate Token Split
```solidity
uint256 numTokensToSell = FullMath.mulDiv(totalTokensOnBondingCurve, maxShareToBeSold, WAD);
uint256 numTokensToBond = totalTokensOnBondingCurve - numTokensToSell;
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 117-118)

#### 5. Get or Create Pool
```solidity
pool = factory.getPool(token0, token1, fee);
require(getState[pool].isInitialized == false, PoolAlreadyInitialized());

if (pool == address(0)) {
    pool = factory.createPool(token0, token1, fee);
}
uint160 sqrtPriceX96 = TickMath.getSqrtPriceAtTick(isToken0 ? tickLower : tickUpper);
try IUniswapV3Pool(pool).initialize(sqrtPriceX96) { } catch { }
```
- If pool exists, reuses it (but checks not already initialized by Doppler)
- Initial price set at the "close tick" (where auction starts)
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 120-130)

#### 6. Calculate Position Distribution
```solidity
(LpPosition[] memory lbpPositions, uint256 reserves) =
    calculateLogNormalDistribution(tickLower, tickUpper, tickSpacing, isToken0, numPositions, numTokensToSell);

lbpPositions[numPositions] =
    calculateLpTail(numPositions, tickLower, tickUpper, isToken0, reserves, numTokensToBond, tickSpacing);
```
Creates `numPositions + 1` LP positions (bonding curve + tail).
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 144-148)

#### 7. Mint All Positions
```solidity
mintPositions(asset, numeraire, fee, pool, lbpPositions, numPositions);
```
Iterates through all positions and calls `pool.mint()` for each.
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 150, 363-381)

## Phase 2: Active (Static)

During this phase:
- **No rebalancing occurs** - positions remain exactly as minted
- Swaps move the price through the bonding curve
- Fees accumulate in positions

### Lockable Variant: Fee Collection

For `LockableUniswapV3Initializer` with status `Locked`:

```solidity
function collectFees(address pool) external returns (uint256, uint256)
```

1. Must be in `Locked` status
2. Burns 0 liquidity to "poke" each position (triggers fee accounting)
3. Collects accumulated fees from all positions
4. Distributes fees to beneficiaries proportionally
5. Last beneficiary receives any rounding dust

[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 263-298)

## Phase 3: Exit

**Entry point**: `exitLiquidity()` called by Airlock
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 156-214)

### Exit Conditions

**Price must reach the far tick**:

```solidity
int24 farTick = isToken0 ? getState[pool].tickUpper : getState[pool].tickLower;
require(asset == token0 ? tick >= farTick : tick <= farTick,
    CannotMigrateInsufficientTick(farTick, tick));
```

| Token Being Sold | Direction | Exit Condition |
|------------------|-----------|----------------|
| token0 | Price increases | `tick >= tickUpper` |
| token1 | Price decreases | `tick <= tickLower` |

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 182-183)

### Exit Flow

1. **Mark as exited** (prevents double-exit)
   ```solidity
   require(getState[pool].isExited == false, PoolAlreadyExited());
   getState[pool].isExited = true;
   ```

2. **Recalculate positions** (same algorithm as init)
   ```solidity
   (LpPosition[] memory lbpPositions, uint256 reserves) = calculateLogNormalDistribution(...);
   lbpPositions[numPositions] = calculateLpTail(...);
   ```

3. **Burn all positions and collect**
   ```solidity
   (amount0, amount1, balance0, balance1) = burnPositionsMultiple(pool, lbpPositions, numPositions);
   ```

4. **Calculate fees**
   ```solidity
   fees0 = uint128(balance0 - amount0);
   fees1 = uint128(balance1 - amount1);
   ```

5. **Transfer to caller** (Airlock)
   ```solidity
   ERC20(token0).safeTransfer(msg.sender, balance0);
   ERC20(token1).safeTransfer(msg.sender, balance1);
   ```

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 169-213)

## Lockable State Transitions

```
Uninitialized ──initialize()──> Initialized ──exitLiquidity()──> Exited
      │                              │
      │                              │ (if beneficiaries.length > 0)
      │                              v
      └─────initialize()────────> Locked ──(no exit possible)
```

**Key difference**: Locked pools cannot call `exitLiquidity()` - they're permanent liquidity.

```solidity
getState[pool].status = beneficiaries.length != 0
    ? PoolStatus.Locked
    : PoolStatus.Initialized;
```
[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 207)

```solidity
require(getState[pool].status == PoolStatus.Initialized, PoolAlreadyExited());
```
[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 232)

## Callback Mechanism

During `mintPositions()`, the pool calls back to transfer tokens:

```solidity
function uniswapV3MintCallback(uint256 amount0Owed, uint256 amount1Owed, bytes calldata data) external {
    CallbackData memory callbackData = abi.decode(data, (CallbackData));
    address pool = factory.getPool(callbackData.asset, callbackData.numeraire, callbackData.fee);

    require(msg.sender == pool, OnlyPool());

    ERC20(callbackData.asset).safeTransferFrom(
        address(airlock),
        pool,
        amount0Owed == 0 ? amount1Owed : amount0Owed
    );
}
```

- Only the actual pool can call this callback
- Tokens are pulled from the Airlock contract
- Transfers whichever amount is non-zero (asset is always one side)

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 216-223)
