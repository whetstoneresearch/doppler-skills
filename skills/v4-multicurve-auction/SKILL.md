---
name: v4-multicurve-auction
description: Reference for Doppler V4 multicurve auctions. Use when working with multiple independent curves, shares-based allocation, Migrable vs Locked pools, or static V4 position distribution. Covers curve configuration, beneficiaries, and log-normal distribution.
metadata:
  author: doppler
  version: "1.0"
---

> **Source References**: Code citations link to raw GitHub files pinned to commit `988dab4`. To fetch specific lines: `curl -s "<url>" | sed -n 'START,ENDp'`

# V4 Multicurve Auction

A V4 multicurve auction distributes tokens across **multiple independent curves** with shares-based allocation. Unlike V4 dynamic auctions, multicurve positions are **static** (no rebalancing). Supports both Migrable and Locked pool modes.

## Key Contracts

| Contract | Path | Purpose |
|----------|------|---------|
| UniswapV4MulticurveInitializer | `src/initializers/UniswapV4MulticurveInitializer.sol` | Main multicurve initializer |
| Multicurve | `src/libraries/Multicurve.sol` | Position/curve calculations (library) |
| UniswapV4MulticurveMigrator | `src/migrators/UniswapV4MulticurveMigrator.sol` | Migration with offset adjustment |

## Multicurve vs V4 Dynamic (Comparison)

| Aspect | V4 Multicurve | V4 Dynamic |
|--------|---------------|------------|
| Curves | Multiple independent | Single with 3 slugs |
| Rebalancing | None (static) | Every epoch |
| Configuration | Shares-based | Gamma/epoch-based |
| Position count | Fixed at init | Variable |
| Tick tracker | None | tickAccumulator |
| Exit condition | Price at far tick | Proceeds thresholds |
| Locked mode | With beneficiaries | N/A |

## Quick Facts

| Fact | Value | Source |
|------|-------|--------|
| Precision constant | `WAD = 1e18` | `Multicurve.sol:16` |
| Share validation | Sum must equal WAD exactly | `Multicurve.sol:99` |
| Position salt | `curveIndex * numPositions + positionIndex` | `Multicurve.sol:219` |
| Pool status enum | Uninitialized, Initialized, Locked, Exited | `UniswapV4MulticurveInitializer.sol:57-62` |

## Curve Structure

```solidity
struct Curve {
    int24 tickLower;
    int24 tickUpper;
    uint16 numPositions;
    uint256 shares;    // Must sum to WAD across all curves
}
```

[Source: Multicurve.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/libraries/Multicurve.sol) (lines 29-34)

## Two Pool Modes

| Mode | Condition | Exit Allowed | Use Case |
|------|-----------|--------------|----------|
| **Migrable** | `beneficiaries.length == 0` | Yes (at far tick) | Standard token launches |
| **Locked** | `beneficiaries.length > 0` | No (permanent) | Fee-sharing arrangements |

[Source: UniswapV4MulticurveInitializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV4MulticurveInitializer.sol) (lines 189)

## Parameters Quick Reference

| Parameter | Type | Description |
|-----------|------|-------------|
| `curves[]` | `Curve[]` | Array of independent curve configs |
| `curves[i].shares` | `uint256` | WAD fraction (all must sum to 1e18) |
| `curves[i].numPositions` | `uint16` | Positions within this curve |
| `beneficiaries[]` | `BeneficiaryData[]` | If empty: Migrable; if set: Locked |
| `fee` | `uint24` | Pool fee tier |
| `tickSpacing` | `int24` | Pool tick spacing |

[Detailed parameters](references/PARAMETERS.md)

## Pool Status States

| Status | Condition | Exit Allowed |
|--------|-----------|--------------|
| Uninitialized | Before init | N/A |
| Initialized | No beneficiaries | Yes (at far tick) |
| Locked | With beneficiaries | No (permanent) |
| Exited | After exitLiquidity | N/A |

[Source: UniswapV4MulticurveInitializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV4MulticurveInitializer.sol) (lines 57-62)

## Common Tasks

- **Understanding parameters**: See [PARAMETERS.md](references/PARAMETERS.md)
- **Understanding the lifecycle**: See [FLOW.md](references/FLOW.md)
- **Understanding the math**: See [FORMULAS.md](references/FORMULAS.md)
- **Avoiding pitfalls**: See [GOTCHAS.md](references/GOTCHAS.md)

## Related Skills

- [fee-architecture](../fee-architecture/SKILL.md) - Fee collection and beneficiary distribution
- [token-lifecycle](../token-lifecycle/SKILL.md) - Vesting and inflation mechanics
- [v4-dynamic-auction](../v4-dynamic-auction/SKILL.md) - Dynamic V4 auctions with epoch rebalancing
- [uniswap-fundamentals](../uniswap-fundamentals/SKILL.md) - Tick math and V4 architecture
