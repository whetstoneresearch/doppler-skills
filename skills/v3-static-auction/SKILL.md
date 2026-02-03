---
name: v3-static-auction
description: Reference for Doppler V3 static auctions. Use when working with UniswapV3Initializer, LockableUniswapV3Initializer, or any V3-based token launches. Covers initialization parameters, lifecycle, tick math, and common pitfalls.
metadata:
  author: doppler
  version: "1.0"
---

> **Source References**: Code citations link to raw GitHub files pinned to commit `988dab4`. To fetch specific lines: `curl -s "<url>" | sed -n 'START,ENDp'`

# V3 Static Auction

A V3 static auction creates a **fixed bonding curve** on Uniswap V3. Unlike the V4 dynamic auction, positions are minted once at initialization and never rebalanced.

## Key Contracts

| Contract | Path | Purpose |
|----------|------|---------|
| UniswapV3Initializer | `src/initializers/UniswapV3Initializer.sol` | Standard V3 static auction |
| LockableUniswapV3Initializer | `src/initializers/LockableUniswapV3Initializer.sol` | V3 with fee locking and beneficiaries |

## Quick Facts

| Fact | Value | Source |
|------|-------|--------|
| Precision constant | `WAD = 1e18` | `UniswapV3Initializer.sol:42` |
| Max share to sell | 100% (`1e18`) | `UniswapV3Initializer.sol:106` |
| Protocol owner min share | 5% (`WAD / 20`) | `LockableUniswapV3Initializer.sol:476` |
| Distribution type | Linear (equal tokens per position) | `UniswapV3Initializer.sol:278-282` |

## Parameters Reference

| Parameter | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| `fee` | `uint24` | 500, 3000, or 10000 | V3 fee tier |
| `tickLower` | `int24` | Must align to tick spacing | Bonding curve start |
| `tickUpper` | `int24` | Must be > tickLower | Bonding curve end |
| `numPositions` | `uint16` | > 0 | Number of LP positions |
| `maxShareToBeSold` | `uint256` | 0 to 1e18 | % of tokens for sale |
| `beneficiaries` | `BeneficiaryData[]` | Lockable only | Fee recipients |

[Detailed parameters](references/PARAMETERS.md)

## Tick Spacing by Fee

| Fee | Basis Points | Tick Spacing |
|-----|--------------|--------------|
| 500 | 0.05% | 10 |
| 3000 | 0.30% | 60 |
| 10000 | 1.00% | 200 |

[Source: Retrieved via `factory.feeAmountTickSpacing(fee)` at `UniswapV3Initializer.sol:109`]

## Lifecycle

1. **Initialize** - Airlock calls `initialize()`, positions are minted
2. **Active** - No rebalancing; positions remain static
3. **Exit** - Price must reach far tick, then `exitLiquidity()` burns positions

[Detailed flow](references/FLOW.md)

## Exit Requirements

```
Token0 selling: tick >= tickUpper (price increased)
Token1 selling: tick <= tickLower (price decreased)
```

**Critical**: Price MUST reach the far tick. No early exit is possible.

[Source: UniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/UniswapV3Initializer.sol) (lines 182-183)

## Static vs Dynamic

| Aspect | V3 Static | V4 Dynamic |
|--------|-----------|------------|
| Rebalancing | None | Every epoch via `beforeSwap` |
| Position count | Fixed at init | Continuously adjusted |
| Price discovery | Passive (swaps move price) | Active (tick accumulator) |
| Contract | UniswapV3Initializer | Doppler.sol |

## Common Tasks

- **Understanding the math**: See [FORMULAS.md](references/FORMULAS.md)
- **Avoiding pitfalls**: See [GOTCHAS.md](references/GOTCHAS.md)
- **Setting up beneficiaries**: See [PARAMETERS.md](references/PARAMETERS.md)

## Lockable vs Standard

The `LockableUniswapV3Initializer` adds:

1. **PoolStatus enum**: `Uninitialized → Initialized → Locked → Exited`
2. **Beneficiaries**: Fee distribution to multiple addresses
3. **collectFees()**: Withdraw accumulated fees while locked
4. **Protocol owner requirement**: Must receive at least 5%

[Source: LockableUniswapV3Initializer.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/988dab4/src/initializers/LockableUniswapV3Initializer.sol) (lines 96-101, 263-298, 461-486)

## Related Skills

- [fee-architecture](../fee-architecture/SKILL.md) - Fee collection and beneficiary distribution
- [token-lifecycle](../token-lifecycle/SKILL.md) - Vesting and inflation mechanics
- [v4-multicurve-auction](../v4-multicurve-auction/SKILL.md) - V4 multicurve with farTick parameter
- [uniswap-fundamentals](../uniswap-fundamentals/SKILL.md) - Tick math and V3/V4 comparison
