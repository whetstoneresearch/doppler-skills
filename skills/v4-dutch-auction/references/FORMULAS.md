# V4 Dutch Auction Formulas

## Epoch Calculation

```solidity
function _getCurrentEpoch() internal view returns (uint256) {
    if (block.timestamp < startingTime) return 1;
    return (block.timestamp - startingTime) / epochLength + 1;
}
```

**Note**: Epochs are 1-indexed.

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 791-794)

## Normalized Time Elapsed

```solidity
function _getNormalizedTimeElapsed(uint256 timestamp) internal view returns (uint256) {
    return FullMath.mulDiv(timestamp - startingTime, WAD, endingTime - startingTime);
}
```

Returns elapsed time as a fraction of total time, scaled by 1e18.

**Example**: If 50% of time has passed, returns `0.5e18`.

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 798-800)

## Expected Amount Sold

Linear progression of expected sales:

```solidity
function _getExpectedAmountSoldWithEpochOffset(int256 offset) internal view returns (uint256) {
    return FullMath.mulDiv(
        _getNormalizedTimeElapsed(
            uint256((int256(_getCurrentEpoch()) + offset - 1) * int256(epochLength) + int256(startingTime))
        ),
        numTokensToSell,
        WAD
    );
}
```

**Formula**: `expectedSold = (timeElapsed / totalTime) * numTokensToSell`

**Offsets**:
- `offset = 0`: Expected sold by end of previous epoch
- `offset = 1`: Expected sold by end of current epoch
- `offset = -1`: Expected sold by end of epoch before previous

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 806-814)

## Tick Accumulator

The tick accumulator tracks cumulative price adjustments across epochs. It's stored as a signed 256-bit integer scaled by 1e18.

### Three Dynamic Auction Modes

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 621-675)

#### Mode 1: Max Adjustment

**Condition**: `initialNetSold < 0 && lteExpectedSoldInFirstEpoch`
(Sold fewer tokens than at the last rebalance AND behind schedule)

```solidity
accumulatorDelta += _getMaxTickDeltaPerEpoch();
```

#### Mode 2: Relative Adjustment

**Condition**: `lteExpectedSoldInFirstEpoch` (behind schedule but made some sales)

```solidity
accumulatorDelta += _getMaxTickDeltaPerEpoch()
    * int256(WAD - FullMath.mulDiv(totalTokensSold_, WAD, expectedSoldFirstEpoch)) / I_WAD;
```

**Formula**: `delta = maxDelta * (1 - actualSold / expectedSold)`

**Example**: If sold 80% of expected, apply 20% of max adjustment.

#### Mode 3: Oversold

**Condition**: `!lteExpectedSoldInFirstEpoch` (ahead of schedule)

```solidity
accumulatorDelta += int256(currentTick - expectedTick) * I_WAD;
```

The curve moves UP (worse prices for buyers) by the difference between current and expected tick.

### Max Tick Delta Per Epoch

```solidity
function _getMaxTickDeltaPerEpoch() internal view returns (int256) {
    // ... get current tick ...

    int24 effectiveStartingTick;
    if (isToken0) {
        effectiveStartingTick = currentTick > startingTick ? currentTick : startingTick;
    } else {
        effectiveStartingTick = currentTick < startingTick ? currentTick : startingTick;
    }

    return int256(endingTick - effectiveStartingTick) * I_WAD
           / int256((endingTime - startingTime) / epochLength);
}
```

**Formula**: `maxDelta = (endingTick - effectiveStartingTick) * 1e18 / numEpochs`

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 818-832)

### Multiple Skipped Epochs

If multiple epochs pass without swaps, the accumulator catches up:

```solidity
while (epochsPassed > 1) {
    epochsPassed--;
    uint256 expectedSold = _getExpectedAmountSoldWithEpochOffset(-int256(epochsPassed - 1));

    if (totalTokensSold_ < expectedSold) {
        accumulatorDelta += _getMaxTickDeltaPerEpoch()
            * int256(WAD - FullMath.mulDiv(totalTokensSold_, WAD, expectedSold)) / I_WAD;
    }
}
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 667-675)

## Tick Range from Accumulator

```solidity
function _getTicksBasedOnState(
    int256 accumulator,
    int24 tickSpacing
) internal view returns (int24 lower, int24 upper) {
    int24 accumulatorDelta = (accumulator / I_WAD).toInt24();
    int24 adjustedTick = startingTick + accumulatorDelta;
    lower = _alignComputedTickWithTickSpacing(adjustedTick, tickSpacing);

    if (isToken0) {
        upper = lower + gamma;
    } else {
        upper = lower - gamma;
    }
}
```

**Key insight**: `gamma` determines the constant width of the bonding curve.

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 886-900)

## Tick Alignment

Same algorithm as V3, rounds according to isToken0:

```solidity
function _alignComputedTickWithTickSpacing(int24 tick, int24 tickSpacing) internal view returns (int24) {
    if (isToken0) {
        // Round DOWN
        if (tick < 0) {
            return (tick - tickSpacing + 1) / tickSpacing * tickSpacing;
        } else {
            return tick / tickSpacing * tickSpacing;
        }
    } else {
        // Round UP
        if (tick < 0) {
            return tick / tickSpacing * tickSpacing;
        } else {
            return (tick + tickSpacing - 1) / tickSpacing * tickSpacing;
        }
    }
}
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 838-858)

## Slug Calculations

### Lower Slug (Refund Support)

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 913-945)

**Normal case** (sufficient proceeds):
```solidity
slug.tickLower = tickLower;  // Global lower
slug.tickUpper = currentTick;
slug.liquidity = _computeLiquidity(!isToken0, sqrtPriceLower, sqrtPriceUpper, requiredProceeds);
```

**Insufficient proceeds case**: Uses average clearing price (see below).

### Required Proceeds

```solidity
function _computeRequiredProceeds(
    uint160 sqrtPriceLower,
    uint160 sqrtPriceUpper,
    uint256 amount
) internal view returns (uint256 requiredProceeds) {
    uint128 liquidity;
    if (isToken0) {
        liquidity = LiquidityAmounts.getLiquidityForAmount0(sqrtPriceLower, sqrtPriceUpper, amount);
        requiredProceeds = SqrtPriceMath.getAmount1Delta(sqrtPriceLower, sqrtPriceUpper, liquidity, true);
    } else {
        liquidity = LiquidityAmounts.getLiquidityForAmount1(sqrtPriceLower, sqrtPriceUpper, amount);
        requiredProceeds = SqrtPriceMath.getAmount0Delta(sqrtPriceLower, sqrtPriceUpper, liquidity, true);
    }
}
```

**Purpose**: Calculate how much numeraire is needed to support selling back `amount` of asset tokens.

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 865-878)

### Upper Slug (Current Epoch)

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 957-994)

```solidity
int256 tokensSoldDelta = int256(_getExpectedAmountSoldWithEpochOffset(1)) - int256(totalTokensSold_);

if (tokensSoldDelta > 0) {
    // Behind schedule - place liquidity
    tokensToLp = min(tokensSoldDelta, assetAvailable);
    int24 accumulatorDelta = max(upperSlugRange, key.tickSpacing);
    slug.tickLower = currentTick;
    slug.tickUpper = currentTick + accumulatorDelta;  // (or - if !isToken0)
    slug.liquidity = _computeLiquidity(isToken0, sqrtLower, sqrtUpper, tokensToLp);
} else {
    // Ahead of schedule - no upper slug
    slug.tickLower = currentTick;
    slug.tickUpper = currentTick;
    slug.liquidity = 0;
}
```

### Price Discovery Slugs (Future Epochs)

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 1004-1059)

```solidity
// Determine how many slugs to place (bounded by remaining epochs)
uint256 pdSlugsToLp = numPDSlugs;
for (uint256 i = numPDSlugs; i > 0; --i) {
    if (_getEpochEndWithOffset(i - 1) != _getEpochEndWithOffset(i)) break;
    --pdSlugsToLp;
}

// Calculate slug width
int24 slugRangeDelta = (tickUpper - upperSlug.tickUpper) / int24(pdSlugsToLp);
slugRangeDelta = max(slugRangeDelta, tickSpacing);  // or min if !isToken0

// Tokens per slug = one epoch's worth
uint256 tokensToLp = FullMath.mulDiv(epochT1toT2Delta, numTokensToSell, WAD);

// Place slugs equidistantly
for (uint256 i; i < pdSlugsToLp; ++i) {
    slugs[i].tickLower = tick;
    tick = _alignComputedTickWithTickSpacing(tick + slugRangeDelta, tickSpacing);
    slugs[i].tickUpper = tick;
    slugs[i].liquidity = _computeLiquidity(isToken0, sqrtLower, sqrtUpper, tokensToLp);
}
```

## Insufficient Proceeds: Average Price

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 1301-1339)

```solidity
function _computeLowerSlugInsufficientProceeds(
    PoolKey memory key,
    uint256 totalProceeds_,
    uint256 totalTokensSold_,
    int24 currentTick
) internal view returns (SlugData memory slug) {
    uint160 targetPriceX96;

    if (totalTokensSold_ == 0) {
        targetPriceX96 = 0;
    } else if (isToken0) {
        // Price = proceeds / tokensSold (Q96 format)
        targetPriceX96 = _computeTargetPriceX96(totalProceeds_, totalTokensSold_ - fees0);
    } else {
        targetPriceX96 = _computeTargetPriceX96(totalTokensSold_ - fees1, totalProceeds_);
    }

    if (targetPriceX96 == 0) {
        slug.tickLower = slug.tickUpper = currentTick;
        slug.liquidity = 0;
    } else {
        // Convert price to tick
        slug.tickUpper = _alignComputedTickWithTickSpacing(
            TickMath.getTickAtSqrtPrice(uint160(sqrt(targetPriceX96) << 48)),
            tickSpacing
        );
        slug.tickLower = isToken0 ? slug.tickUpper - tickSpacing : slug.tickUpper + tickSpacing;
        slug.liquidity = _computeLiquidity(!isToken0, sqrtLower, sqrtUpper, totalProceeds_);
    }
}
```

**Key formula**: `averagePrice = totalProceeds / totalTokensSold`

## Fee Exclusion in Accounting

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 537-572)

```solidity
uint24 swapFee = protocolFee.calculateSwapFee(lpFee);

// When user buys asset (amount positive):
state.totalTokensSold += uint128(amount0);

// When user sells asset (amount negative):
uint256 tokensSoldLessFee = FullMath.mulDiv(uint128(-amount0), MAX_SWAP_FEE - swapFee, MAX_SWAP_FEE);
state.totalTokensSold -= tokensSoldLessFee;
```

**Why**: Fees are collected by the hook but not reinvested into the bonding curve. This prevents fee accumulation from distorting the expected sales curve.

## Liquidity Calculation Helper

```solidity
function _computeLiquidity(
    bool forToken0,
    uint160 lowerPrice,
    uint160 upperPrice,
    uint256 amount
) internal pure returns (uint128) {
    amount = amount != 0 ? amount - 1 : amount;  // Avoid rounding errors

    if (forToken0) {
        return LiquidityAmounts.getLiquidityForAmount0(lowerPrice, upperPrice, amount);
    } else {
        return LiquidityAmounts.getLiquidityForAmount1(lowerPrice, upperPrice, amount);
    }
}
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/initializers/Doppler.sol) (lines 1080-1094)
