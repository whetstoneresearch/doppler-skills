# V3 Static Auction Parameters

## InitData Struct

### Standard (UniswapV3Initializer)

```solidity
struct InitData {
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    uint16 numPositions;
    uint256 maxShareToBeSold;
}
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 44-50)

### Lockable (LockableUniswapV3Initializer)

```solidity
struct InitData {
    uint24 fee;
    int24 tickLower;
    int24 tickUpper;
    uint16 numPositions;
    uint256 maxShareToBeSold;
    BeneficiaryData[] beneficiaries;
}
```
[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 81-88)

## Parameter Details

### `fee` (uint24)

The Uniswap V3 fee tier. Determines tick spacing.

| Fee Value | Basis Points | Tick Spacing | Use Case |
|-----------|--------------|--------------|----------|
| 500 | 0.05% | 10 | Stable pairs |
| 3000 | 0.30% | 60 | Most common |
| 10000 | 1.00% | 200 | Exotic pairs |

**Validation**: Must return non-zero from `factory.feeAmountTickSpacing(fee)`
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 109-110)

### `tickLower` (int24)

Lower boundary of the bonding curve range.

**Constraints**:
- Must be < `tickUpper`
- Must be divisible by tick spacing

**Validation**:
```solidity
require(tickLower < tickUpper, InvalidTickRangeMisordered(tickLower, tickUpper));
// ...
if (tick % tickSpacing != 0) revert InvalidTickRange(tick, tickSpacing);
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 107, 383-384)

### `tickUpper` (int24)

Upper boundary of the bonding curve range.

**Constraints**:
- Must be > `tickLower`
- Must be divisible by tick spacing

### `numPositions` (uint16)

Number of LP positions to create across the tick range.

**How it works**:
- Tokens are divided equally: `amountPerPosition = totalAmtToBeSold / numPositions`
- Positions span from `closeTick` to `farTick` in equal intervals
- More positions = finer granularity but higher gas costs

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 297)

### `maxShareToBeSold` (uint256)

Percentage of total tokens allocated for sale on the bonding curve.

**Range**: 0 to `WAD` (1e18 = 100%)

**Calculation**:
```solidity
uint256 numTokensToSell = FullMath.mulDiv(totalTokensOnBondingCurve, maxShareToBeSold, WAD);
uint256 numTokensToBond = totalTokensOnBondingCurve - numTokensToSell;
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 117-118)

**Example**:
- `maxShareToBeSold = 0.8e18` (80%)
- 1,000,000 total tokens
- 800,000 for sale, 200,000 for tail position bonding

### `beneficiaries` (BeneficiaryData[]) - Lockable Only

Array of fee recipients with their share allocations.

```solidity
struct BeneficiaryData {
    address beneficiary;
    uint256 shares;
}
```
[Source: StreamableFeesLocker.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/StreamableFeesLocker.sol) (imported at [LockableUniswapV3Initializer.sol:12](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol))

**Validation Rules**:

1. **Ascending order**: Beneficiary addresses must be sorted
   ```solidity
   require(prevBeneficiary < beneficiary.beneficiary, UnorderedBeneficiaries());
   ```

2. **Non-zero shares**: Each beneficiary must have shares > 0
   ```solidity
   require(beneficiary.shares > 0, InvalidShares());
   ```

3. **Total must equal WAD**: All shares must sum to 1e18 (100%)
   ```solidity
   require(totalShares == WAD, InvalidTotalShares());
   ```

4. **Protocol owner minimum**: Protocol owner must receive >= 5%
   ```solidity
   require(beneficiary.shares >= WAD / 20, InvalidProtocolOwnerShares());
   ```

5. **Protocol owner required**: Protocol owner must be in the list
   ```solidity
   require(foundProtocolOwner, InvalidProtocolOwnerBeneficiary());
   ```

[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 461-486)

## Constants

### WAD

```solidity
uint256 constant WAD = 1e18;
```

Used for fixed-point arithmetic. Represents 100% in share calculations.

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 42), [Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 79)

## State Structures

### PoolState (Standard)

```solidity
struct PoolState {
    address asset;
    address numeraire;
    int24 tickLower;
    int24 tickUpper;
    uint16 numPositions;
    bool isInitialized;
    bool isExited;
    uint256 maxShareToBeSold;
    uint256 totalTokensOnBondingCurve;
}
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 58-68)

### PoolState (Lockable)

```solidity
struct PoolState {
    address asset;
    address numeraire;
    int24 tickLower;
    int24 tickUpper;
    uint256 maxShareToBeSold;
    uint256 totalTokensOnBondingCurve;
    BeneficiaryData[] beneficiaries;
    LpPosition[] lpPositions;
    PoolStatus status;
}
```
[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 103-113)

### PoolStatus (Lockable)

```solidity
enum PoolStatus {
    Uninitialized,
    Initialized,
    Locked,
    Exited
}
```
[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 96-101)

### LpPosition

```solidity
struct LpPosition {
    int24 tickLower;
    int24 tickUpper;
    uint128 liquidity;
    uint16 id;
}
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 70-75), [Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 115-120)

---

## Far Tick Concept

V3 static auctions derive the "far tick" from `tickLower`/`tickUpper` based on `isToken0`.

### Definition

The far tick is the farthest boundary that must be reached for migration:

```solidity
int24 farTick = isToken0 ? tickUpper : tickLower;
int24 closeTick = isToken0 ? tickLower : tickUpper;
```

[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 356-357)

### Direction Logic

| isToken0 | Asset | farTick | closeTick | Price movement |
|----------|-------|---------|-----------|----------------|
| `true` | token0 | tickUpper | tickLower | Price rises in token1 terms |
| `false` | token1 | tickLower | tickUpper | Price rises in token0 terms |

### Migration Check

```solidity
int24 farTick = isToken0 ? tickUpper : tickLower;
require(
    isToken0 ? tick >= farTick : tick <= farTick,
    CannotMigrateInsufficientTick(farTick, tick)
);
```

[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 243-244)

### Position Distribution

Positions are distributed from `closeTick` toward `farTick`:

```solidity
LpPosition[] memory positions = new LpPosition[](totalPositions);
int24 rangePerPosition = (farTick - closeTick) / int16(totalPositions);

for (uint256 i; i < totalPositions; ++i) {
    positions[i] = LpPosition({
        tickLower: isToken0 ? closeTick + rangePerPosition * int16(i) : farTick - rangePerPosition * int16(i + 1),
        tickUpper: isToken0 ? closeTick + rangePerPosition * int16(i + 1) : farTick - rangePerPosition * int16(i),
        liquidity: 0,  // Calculated later
        id: uint16(i)
    });
}
```

[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 361-380)

**See also**: [v4-multicurve-auction](../../v4-multicurve-auction/SKILL.md) for V4's explicit farTick parameter
