# V3 Static Auction Gotchas

Critical edge cases and common pitfalls when working with V3 static auctions.

## 1. Token Ordering (asset vs token0/token1)

**The Problem**: Uniswap V3 always stores tokens as `token0 < token1` by address. Your "asset" (token being sold) may be either.

**The Code**:
```solidity
(address token0, address token1) = asset < numeraire ? (asset, numeraire) : (numeraire, asset);
// ...
bool isToken0 = asset == token0;
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 115, 123)

**Impact**:
- `isToken0` determines tick direction logic
- Tick alignment rounding direction flips
- Exit condition comparison flips
- Position range calculations flip

**What to Watch**:
- Always check `isToken0` before assuming tick relationships
- When asset is token1, ticks are "inverted" from intuition
- Tests often use explicit handling:
  ```solidity
  int24 tickLower = isToken0 ? -DEFAULT_UPPER_TICK : DEFAULT_LOWER_TICK;
  int24 tickUpper = isToken0 ? -DEFAULT_LOWER_TICK : DEFAULT_UPPER_TICK;
  ```

---

## 2. Exit Condition is Strict (No Early Exit)

**The Problem**: You CANNOT exit liquidity until price reaches the far tick. There is no emergency exit.

**The Code**:
```solidity
int24 farTick = isToken0 ? getState[pool].tickUpper : getState[pool].tickLower;
require(asset == token0 ? tick >= farTick : tick <= farTick,
    CannotMigrateInsufficientTick(farTick, tick));
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 182-183)

**Impact**:
- If price never reaches far tick, liquidity is **permanently locked**
- No admin override or emergency withdrawal exists
- Must wait for market to move price

**Exit Requirements by Token**:
| Selling | Required Condition | Price Movement |
|---------|-------------------|----------------|
| token0 | `tick >= tickUpper` | Price must increase |
| token1 | `tick <= tickLower` | Price must decrease |

**Mitigation**: Choose tick ranges carefully based on realistic price expectations.

---

## 3. Tick Alignment Precision Loss

**The Problem**: With large tick spacing (e.g., 200 for 1% fee), rounding can collapse multiple positions into the same tick.

**The Code**:
```solidity
startingTick = alignTickToTickSpacing(isToken0, startingTick, tickSpacing);

if (startingTick != farTick) {
    // Only create position if not collapsed to far tick
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 309-311)

**Example**:
- tickSpacing = 200
- numPositions = 50
- spread = 1000 ticks
- Position spacing = 20 ticks (less than tickSpacing!)
- Result: Many positions round to same tick, effectively reducing position count

**Impact**:
- Fewer effective positions than expected
- Potential zero-liquidity positions
- `CannotMintZeroLiquidity()` error if all positions collapse

**Mitigation**:
- Use appropriate numPositions for your tick spacing
- Rule of thumb: `spread / numPositions >= tickSpacing`

---

## 4. Reserves Intentional Undercounting

**The Problem**: The reserves calculation deliberately rounds DOWN, which can leave small token amounts stranded.

**The Code**:
```solidity
reserves += (isToken0
    ? SqrtPriceMath.getAmount1Delta(
        farSqrtPriceX96,
        startingSqrtPriceX96,
        liquidity,
        false  // <-- round DOWN
    )
    : ...
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 334-346)

**Why**: Undercounting ensures the tail position always has enough liquidity. Over-counting could cause the tail position mint to fail.

**Impact**:
- Small dust amounts may remain unused
- Not a bug - intentional safety margin
- Amounts are negligible relative to total

---

## 5. Callback Security (Only Pool Can Call)

**The Problem**: The mint callback transfers tokens from Airlock. It must only accept calls from the actual pool.

**The Code**:
```solidity
function uniswapV3MintCallback(...) external {
    CallbackData memory callbackData = abi.decode(data, (CallbackData));
    address pool = factory.getPool(callbackData.asset, callbackData.numeraire, callbackData.fee);

    require(msg.sender == pool, OnlyPool());

    ERC20(callbackData.asset).safeTransferFrom(address(airlock), pool, ...);
}
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 216-223)

**Security Model**:
1. Pool address is derived from factory (not from callback data)
2. `msg.sender` must match derived pool
3. Prevents malicious contracts from draining Airlock

**What to Watch**:
- Never modify to trust callback data for pool address
- Factory address is immutable and trusted

---

## 6. Pre-existing Pool Handling

**The Problem**: A Uniswap V3 pool for the token pair might already exist (created by someone else).

**The Code**:
```solidity
pool = factory.getPool(token0, token1, fee);
require(getState[pool].isInitialized == false, PoolAlreadyInitialized());

if (pool == address(0)) {
    pool = factory.createPool(token0, token1, fee);
}

try IUniswapV3Pool(pool).initialize(sqrtPriceX96) { } catch { }
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 120-130)

**Behavior**:
- If pool exists → reuse it
- If pool doesn't exist → create it
- If pool already initialized with different price → `try/catch` ignores error
- Doppler tracks its own state separately (`getState[pool].isInitialized`)

**Impact**:
- Pool might have existing liquidity from others
- Initial price might differ from intended sqrtPriceX96
- Cannot re-initialize same pool via Doppler

**Mitigation**: Check pool state before launching if concerned about existing liquidity.

---

## 7. Locked Pools Cannot Exit

**The Problem**: In `LockableUniswapV3Initializer`, pools with beneficiaries are permanently locked.

**The Code**:
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

**Impact**:
- `Locked` pools can NEVER call `exitLiquidity()`
- Liquidity is permanent
- Can only collect fees via `collectFees()`

**Use Case**: This is intentional for permanent liquidity pools with ongoing fee distribution.

---

## 8. Beneficiary Validation Edge Cases

**The Problem**: Beneficiary array has strict ordering and share requirements.

**Validation Rules**:
```solidity
require(prevBeneficiary < beneficiary.beneficiary, UnorderedBeneficiaries());
require(beneficiary.shares > 0, InvalidShares());
require(totalShares == WAD, InvalidTotalShares());
require(beneficiary.shares >= WAD / 20, InvalidProtocolOwnerShares()); // 5% min
require(foundProtocolOwner, InvalidProtocolOwnerBeneficiary());
```
[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 471-485)

**Common Mistakes**:
1. **Unordered addresses**: Beneficiaries MUST be in ascending address order
2. **Missing protocol owner**: Airlock owner MUST be in the list
3. **Insufficient protocol share**: Protocol owner needs >= 5%
4. **Shares don't sum to WAD**: Must equal exactly 1e18

---

## 9. Zero Liquidity Positions

**The Problem**: If `totalAmtToBeSold` is 0, positions are created with 0 liquidity.

**The Code**:
```solidity
uint128 liquidity;
if (totalAmtToBeSold != 0) {
    liquidity = isToken0 ? ... : ...;
}
```
[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 316-324)

**Use Case**: This is used during exit to recalculate position ranges for burning (don't need liquidity values, just tick ranges).

**Watch Out**: Don't pass `totalAmtToBeSold = 0` during initialization unless you want empty positions.

---

## 10. Fee Dust Distribution

**The Problem**: Integer division in fee distribution can leave dust.

**The Code**:
```solidity
uint256 amount0 = fees0ToDistribute * shares / WAD;
// ...
if (i == beneficiaries.length - 1) {
    amount0 += fees0ToDistribute > amount0Distributed
        ? fees0ToDistribute - amount0Distributed
        : 0;
}
```
[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 281-291)

**Behavior**: Last beneficiary in the array receives all rounding dust.

**Impact**: Ordering of beneficiaries affects who gets dust (negligible amounts, but deterministic).
