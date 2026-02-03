# V3 Static Auction Formulas

## Token Split Calculation

```solidity
uint256 numTokensToSell = FullMath.mulDiv(totalTokensOnBondingCurve, maxShareToBeSold, WAD);
uint256 numTokensToBond = totalTokensOnBondingCurve - numTokensToSell;
```

**Example**:
- `totalTokensOnBondingCurve = 1,000,000`
- `maxShareToBeSold = 0.8e18` (80%)
- `numTokensToSell = 800,000`
- `numTokensToBond = 200,000`

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 117-118)

## Linear Distribution Algorithm

Despite the function name `calculateLogNormalDistribution`, this creates a **linear distribution** with equal token amounts per position.

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 283-361)

### Amount Per Position

```solidity
uint256 amountPerPosition = FullMath.mulDiv(totalAmtToBeSold, WAD, totalPositions * WAD);
```

Simplifies to: `amountPerPosition = totalAmtToBeSold / totalPositions`

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 297)

### Position Tick Calculation

For each position `i` (0 to numPositions-1):

```solidity
int24 startingTick = isToken0
    ? closeTick + int24(uint24(FullMath.mulDiv(i, uint256(uint24(spread)), totalPositions)))
    : closeTick - int24(uint24(FullMath.mulDiv(i, uint256(uint24(spread)), totalPositions)));
```

Where:
- `closeTick` = starting price (tickLower for token0, tickUpper for token1)
- `farTick` = ending price (tickUpper for token0, tickLower for token1)
- `spread` = tickUpper - tickLower

**Result**: Positions are evenly distributed from closeTick toward farTick.

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 304-306)

### Liquidity Calculation

```solidity
uint128 liquidity = isToken0
    ? LiquidityAmounts.getLiquidityForAmount0(startingSqrtPriceX96, farSqrtPriceX96, amountPerPosition)
    : LiquidityAmounts.getLiquidityForAmount1(farSqrtPriceX96, startingSqrtPriceX96, amountPerPosition);
```

Each position gets the liquidity amount needed to provide exactly `amountPerPosition` tokens.

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 318-324)

### Reserves Tracking

```solidity
reserves += (isToken0
    ? SqrtPriceMath.getAmount1Delta(
        farSqrtPriceX96,
        startingSqrtPriceX96,
        liquidity,
        false  // round DOWN to undercount
    )
    : SqrtPriceMath.getAmount0Delta(
        startingSqrtPriceX96,
        farSqrtPriceX96,
        liquidity,
        false  // round DOWN to undercount
    ));
```

**Why undercount?** The reserves are used to calculate the tail position. Undercounting ensures there's always enough liquidity in the tail.

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 334-346)

## Tick Alignment Algorithm

Aligns ticks to valid tick spacing boundaries.

```solidity
function alignTickToTickSpacing(bool isToken0, int24 tick, int24 tickSpacing) internal pure returns (int24)
```

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 225-245)

### Token0 (Round DOWN)

```solidity
if (tick < 0) {
    return (tick - tickSpacing + 1) / tickSpacing * tickSpacing;
} else {
    return tick / tickSpacing * tickSpacing;
}
```

**Examples** (tickSpacing = 60):
- tick = 150 → rounds to 120 (down)
- tick = -150 → rounds to -180 (down, toward more negative)

### Token1 (Round UP)

```solidity
if (tick < 0) {
    return tick / tickSpacing * tickSpacing;
} else {
    return (tick + tickSpacing - 1) / tickSpacing * tickSpacing;
}
```

**Examples** (tickSpacing = 60):
- tick = 150 → rounds to 180 (up)
- tick = -150 → rounds to -120 (up, toward less negative)

### Why Different Rounding?

- **Token0**: Price increases as tick increases. Round down = conservative (more positions in curve).
- **Token1**: Price decreases as tick increases. Round up = conservative (accounts for flip).

## Tail Position

### What is a Tail Position?

The tail position is the **final LP position** that extends beyond the bonding curve range to the pool's tick boundaries. It serves three purposes:

1. **Continuous liquidity**: Ensures liquidity exists beyond the auction range
2. **V2 price parity**: Bridges concentrated V3 positions with constant-product pricing
3. **Token bonding**: Holds the `numTokensToBond` allocation (tokens not sold in the auction)

### Token Allocation

```solidity
uint256 numTokensToSell = FullMath.mulDiv(totalTokensOnBondingCurve, maxShareToBeSold, WAD);
uint256 numTokensToBond = totalTokensOnBondingCurve - numTokensToSell;  // Goes to tail
```

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 117-118)

**Total positions created**: `numPositions + 1` (bonding curve positions + 1 tail)

### calculateLpTail() Function

```solidity
function calculateLpTail(
    uint16 id,
    int24 tickLower,
    int24 tickUpper,
    bool isToken0,
    uint256 reserves,
    uint256 bondingAssetsRemaining,  // numTokensToBond
    int24 tickSpacing
) internal pure returns (LpPosition memory lpTail)
```

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 249-276)

### Tail Tick Determination

```solidity
int24 tailTick = isToken0 ? tickUpper : tickLower;
```

The tail starts where the bonding curve ends (the "far tick"):
- **Token0 selling**: Tail starts at `tickUpper` (price has risen)
- **Token1 selling**: Tail starts at `tickLower` (price has fallen in token1 terms)

### Liquidity Calculation

```solidity
uint128 lpTailLiquidity = LiquidityAmounts.getLiquidityForAmounts(
    sqrtPriceAtTail,
    TickMath.MIN_SQRT_PRICE,
    TickMath.MAX_SQRT_PRICE,
    isToken0 ? bondingAssetsRemaining : reserves,
    isToken0 ? reserves : bondingAssetsRemaining
);
```

Uses full price range (MIN to MAX) to calculate optimal liquidity.

### Position Range

```solidity
int24 posTickLower = isToken0
    ? tailTick
    : alignTickToTickSpacing(isToken0, TickMath.MIN_TICK, tickSpacing);

int24 posTickUpper = isToken0
    ? alignTickToTickSpacing(isToken0, TickMath.MAX_TICK, tickSpacing)
    : tailTick;
```

| Selling | Tail Position Range |
|---------|---------------------|
| Token0 | `[tickUpper, MAX_TICK]` |
| Token1 | `[MIN_TICK, tickLower]` |

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 270-271)

## Position Structure

Each position is stored as:

```solidity
LpPosition({
    tickLower: farSqrtPriceX96 < startingSqrtPriceX96 ? farTick : startingTick,
    tickUpper: farSqrtPriceX96 < startingSqrtPriceX96 ? startingTick : farTick,
    liquidity: liquidity,
    id: uint16(i)
})
```

The tick ordering ensures `tickLower < tickUpper` as required by Uniswap V3.

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 349-354)

## Fee Calculation on Exit

```solidity
(amount0, amount1, balance0, balance1) = burnPositionsMultiple(pool, lbpPositions, numPositions);

fees0 = uint128(balance0 - amount0);
fees1 = uint128(balance1 - amount1);
```

- `amount0/1` = principal returned from burning
- `balance0/1` = total collected (principal + fees)
- `fees0/1` = difference (accumulated trading fees)

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 207-210)

## Fee Distribution (Lockable)

```solidity
uint256 amount0 = fees0ToDistribute * shares / WAD;
uint256 amount1 = fees1ToDistribute * shares / WAD;
```

Last beneficiary receives any rounding dust:
```solidity
if (i == beneficiaries.length - 1) {
    amount0 += fees0ToDistribute > amount0Distributed
        ? fees0ToDistribute - amount0Distributed
        : 0;
    // ...
}
```

[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 280-291)

## Validation Formula

```solidity
require(totalAssetsSold <= totalAmtToBeSold, CannotMintZeroLiquidity());
```

Ensures positions don't over-allocate tokens (can happen with rounding).

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 358)
