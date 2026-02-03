# V4 Dynamic Auction Parameters

## Constructor Parameters

The Doppler hook is configured at deployment with these parameters:

```solidity
constructor(
    IPoolManager poolManager_,
    uint256 numTokensToSell_,
    uint256 minimumProceeds_,
    uint256 maximumProceeds_,
    uint256 startingTime_,
    uint256 endingTime_,
    int24 startingTick_,
    int24 endingTick_,
    uint256 epochLength_,
    int24 gamma_,
    bool isToken0_,
    uint256 numPDSlugs_,
    address initializer_,
    uint24 initialLpFee_
)
```
[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 274-289)

## Parameter Details

### `gamma` (int24)

Maximum tick change for the entire bonding curve. Represents `1.0001^gamma`.

**Constraints**:
- Must be > 0
- Must be divisible by `tickSpacing`
- Must be large enough that `epochLength / timeDelta * gamma > 0`

**Validation** (lines 307-311):
```solidity
if (
    gamma_ <= 0
        || FullMath.mulDiv(FullMath.mulDiv(epochLength_, WAD, timeDelta), uint256(int256(gamma_)), WAD) == 0
) {
    revert InvalidGamma();
}
```

**Additional check** (line 355):
```solidity
if (gamma % key.tickSpacing != 0) revert InvalidGamma();
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 235, 307-312, 355)

### `upperSlugRange` (int24) - Derived

Per-epoch gamma. Calculated automatically in constructor:

```solidity
uint256 normalizedEpochDelta = FullMath.mulDiv(epochLength_, WAD, timeDelta);
upperSlugRange = FullMath.mulDiv(normalizedEpochDelta, uint256(int256(gamma_)), WAD).toInt24();
```

**Formula**: `upperSlugRange = gamma * (epochLength / totalTime)`

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 324-327)

### `numTokensToSell` (uint256)

Total number of tokens available to be sold by the hook.

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 211)

### `minimumProceeds` (uint256)

Proceeds threshold below which triggers refund phase.

- If `totalProceeds < minimumProceeds` at `endingTime`, enters insufficient proceeds mode
- Can be 0 (no minimum)

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 214)

### `maximumProceeds` (uint256)

Proceeds threshold that triggers early exit.

- If `totalProceeds >= maximumProceeds`, sets `earlyExit = true`
- Can be 0 (no maximum / disabled)
- Must be >= `minimumProceeds`

**Validation** (line 321):
```solidity
if (minimumProceeds_ > maximumProceeds_) revert InvalidProceedLimits();
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 217, 321)

### `startingTime` / `endingTime` (uint256)

Unix timestamps for sale start and end.

**Constraints**:
- `startingTime` must be > `block.timestamp` at deployment
- `endingTime` must be > `startingTime`
- `(endingTime - startingTime) % epochLength` must equal 0

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 220-223, 293, 304, 314)

### `startingTick` / `endingTick` (int24)

Initial and final ticks for the dynamic auction.

**Direction depends on isToken0**:
- If `isToken0`: `startingTick > endingTick` (price decreases in asset terms)
- If `!isToken0`: `startingTick < endingTick` (price decreases in asset terms)

**Validation** (lines 297-300):
```solidity
if (startingTick_ != endingTick_) {
    if (isToken0_ && startingTick_ < endingTick_) revert InvalidTickRange();
    if (!isToken0_ && startingTick_ > endingTick_) revert InvalidTickRange();
}
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 226-229, 297-300)

### `epochLength` (uint256)

Duration of each epoch in seconds. Determines rebalance frequency.

**Constraint**: Total time must be evenly divisible by epoch length:
```solidity
if (timeDelta % epochLength_ != 0) revert InvalidEpochLength();
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 232, 314)

### `numPDSlugs` (uint256)

Number of price discovery slugs (positions above the upper slug).

**Constraints**:
- Must be >= 1
- Must be <= 15 (`MAX_PRICE_DISCOVERY_SLUGS`)

```solidity
if (numPDSlugs_ == 0) revert InvalidNumPDSlugs();
if (numPDSlugs_ > MAX_PRICE_DISCOVERY_SLUGS) revert InvalidNumPDSlugs();
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 241, 162, 317-318)

### `isToken0` (bool)

Whether token0 is the asset being sold.

- `true`: Selling token0, receiving token1 (numeraire)
- `false`: Selling token1, receiving token0 (numeraire)

**Impact**: Affects tick direction, rounding, and all position calculations.

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 238)

### `initialLpFee` (uint24)

Initial swap fee for the pool. Set via `poolManager.updateDynamicLPFee()` after initialization.

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 244, 371)

## State Struct

Runtime state tracking:

```solidity
struct State {
    uint40 lastEpoch;              // Last rebalanced epoch (1-indexed)
    int256 tickAccumulator;        // Cumulative tick adjustment (scaled by 1e18)
    uint256 totalTokensSold;       // Total asset tokens sold
    uint256 totalProceeds;         // Total numeraire earned (excluding fees)
    uint256 totalTokensSoldLastEpoch; // Snapshot for dynamic auction calc
    BalanceDelta feesAccrued;      // Accumulated LP + protocol fees
}
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 44-51)

## Position Struct

Individual liquidity position:

```solidity
struct Position {
    int24 tickLower;
    int24 tickUpper;
    uint128 liquidity;
    uint8 salt;    // Identifies slug type (1=Lower, 2=Upper, 3+=PD)
}
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 59-64)

## SlugData Struct

Intermediate representation for computing positions:

```solidity
struct SlugData {
    int24 tickLower;
    int24 tickUpper;
    uint128 liquidity;
}
```

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 30-34)

## Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `WAD` | `1e18` | Unsigned precision multiplier |
| `I_WAD` | `1e18` | Signed precision multiplier |
| `MAX_TICK_SPACING` | `30` | Maximum allowed tick spacing |
| `MAX_PRICE_DISCOVERY_SLUGS` | `15` | Max PD slug count |
| `NUM_DEFAULT_SLUGS` | `3` | Lower + Upper + 1 PD minimum |
| `LOWER_SLUG_SALT` | `bytes32(1)` | Salt for lower slug position |
| `UPPER_SLUG_SALT` | `bytes32(2)` | Salt for upper slug position |
| `DISCOVERY_SLUG_SALT` | `bytes32(3)` | Starting salt for PD slugs |

[Source: Doppler.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/Doppler.sol) (lines 153-171)

## Comparison with V3 Parameters

| V3 Parameter | V4 Equivalent | Notes |
|--------------|---------------|-------|
| `fee` | Part of PoolKey | V4 uses dynamic fees |
| `tickLower` | `startingTick` | Different semantic meaning |
| `tickUpper` | `endingTick` | Different semantic meaning |
| `numPositions` | `numPDSlugs` | V4 has 3 slug types, not N equal positions |
| `maxShareToBeSold` | `numTokensToSell` | V4 sells fixed amount, not percentage |
| N/A | `gamma` | V4-specific: max tick change |
| N/A | `epochLength` | V4-specific: rebalance frequency |
| N/A | `minimumProceeds` | V4-specific: refund threshold |
| N/A | `maximumProceeds` | V4-specific: early exit threshold |

---

## Note: Far Tick vs Ending Tick

V4 dynamic auctions do **not** use a `farTick` parameter like V3 static or V4 multicurve auctions.

**Key differences**:

| Concept | V3/Multicurve | V4 Dynamic |
|---------|---------------|------------|
| Exit trigger | `farTick` reached | Proceeds thresholds |
| Price target | Tick-based | `endingTick` (for calculation only) |
| Migration | Tick comparison | `minimumProceeds`/`maximumProceeds` |

**Why no farTick**:
- V4 dynamic auctions exit based on proceeds collected, not tick position
- `endingTick` defines the price range for calculations, not an exit condition
- Early exit triggers when `totalProceeds >= maximumProceeds`
- Normal exit triggers at `endingTime` if `totalProceeds >= minimumProceeds`

**See also**: [v4-multicurve-auction](../../v4-multicurve-auction/SKILL.md) for tick-based exit logic
