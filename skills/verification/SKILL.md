---
name: verification
description: Guide for verifying on-chain Doppler data and debugging issues using cast, viem, RPC calls, and blockchain explorers. Use when you need to confirm contract state, debug unexpected behavior, or validate calculations.
metadata:
  author: doppler
  version: "1.0"
---

# Verification

Tools and patterns for verifying on-chain Doppler data. Use this skill when you need to:
- Confirm contract state matches expectations
- Debug unexpected swap or rebalance behavior
- Validate price/tick calculations
- Check auction progress and migration readiness

## Tool Decision Tree

```
What are you verifying?
│
├─► Quick single value (balance, view function, current state)
│   └─► Use cast (fastest, no setup required)
│       See: [CAST.md](references/CAST.md)
│
├─► Complex calculation (sqrtPriceX96 to price, tick math, expected sales)
│   └─► Use viem script (JavaScript BigInt precision)
│       See: [VIEM.md](references/VIEM.md)
│
├─► Historical state (past blocks, pre-swap state)
│   └─► Use RPC with archive node
│       See: [RPC.md](references/RPC.md)
│
└─► Transaction details, events, indexed data
    └─► Use block explorers or subgraphs
        See: [EXPLORERS.md](references/EXPLORERS.md)
```

## Quick Reference

| Task | Tool | Command/Pattern |
|------|------|-----------------|
| Read hook state | cast | `cast call $HOOK "state()"` |
| Read pool slot0 | cast | `cast call $POOL "slot0()"` |
| Current epoch | cast | `cast call $HOOK "getCurrentEpoch()"` |
| Convert sqrtPriceX96 to price | viem | `sqrtPriceX96ToPrice()` |
| Check tick alignment | viem | `alignTick()` |
| State at past block | RPC | `eth_call` with block number |
| Find Rebalance events | explorer | Filter by event topic |
| Query pool history | subgraph | GraphQL query |
| Token + pool data | indexer | Doppler GraphQL query (prod: indexer-prod.marble.live, dev: testnet-indexer.doppler.lol) |

## Common Verification Scenarios

| Scenario | What to Check | Reference |
|----------|---------------|-----------|
| Pool initialized correctly | `state()`, `startingTick`, `endingTick`, `isToken0` | [CAST.md](references/CAST.md) |
| Auction progress | `totalTokensSold`, `totalProceeds`, `getCurrentEpoch()` | [CAST.md](references/CAST.md) |
| Price is correct | Convert `sqrtPriceX96` → human price | [VIEM.md](references/VIEM.md) |
| Expected vs actual sales | `getExpectedAmountSold()` vs `totalTokensSold` | [VIEM.md](references/VIEM.md) |
| Migration readiness | `earlyExit`, `insufficientProceeds`, proceeds vs thresholds | [CAST.md](references/CAST.md) |
| Why did rebalance happen | Query `Rebalance` events, check epoch | [EXPLORERS.md](references/EXPLORERS.md) |
| State before a swap | Historical `eth_call` at block N-1 | [RPC.md](references/RPC.md) |

## Doppler State Overview

### State Struct
```solidity
struct State {
    uint40 lastEpoch;              // Last epoch that triggered rebalance
    int256 tickAccumulator;        // Cumulative tick adjustments (dynamic auction)
    uint256 totalTokensSold;       // Tokens sold so far
    uint256 totalProceeds;         // Numeraire received so far
    uint256 totalTokensSoldLastEpoch;  // Tokens sold as of last rebalance
    BalanceDelta feesAccrued;      // Accumulated fees (int128, int128)
}
```

Query via: `cast call $HOOK "state()(uint40,int256,uint256,uint256,uint256,int128,int128)"`

### Key Events

| Event | When Emitted | What It Tells You |
|-------|--------------|-------------------|
| `Rebalance(int24,int24,int24,uint256)` | Epoch advances | currentTick, new tickLower/Upper, epoch |
| `Swap(int24,uint256,uint256)` | After each swap | currentTick, totalProceeds, totalTokensSold |
| `EarlyExit(uint256)` | Max proceeds reached | Auction ended early at epoch |
| `InsufficientProceeds()` | Min proceeds not met | Auction failed, refunds enabled |

### Position Slugs

Doppler maintains three types of liquidity positions:

| Slug | Salt | Purpose |
|------|------|---------|
| Lower | `bytes32(1)` | Redemption liquidity (sold tokens) |
| Upper | `bytes32(2)` | Current epoch sales |
| Price Discovery | `bytes32(3+i)` | Future epoch liquidity (up to 15) |

Query positions: `cast call $HOOK "positions(bytes32)(int24,int24,uint128,uint8)" 0x01`

## Precision Warning

```
CRITICAL: DeFi Decimal Handling
────────────────────────────────────────────────────────
sqrtPriceX96:  price = (sqrtPriceX96 / 2^96)^2
               Adjust for token decimals!

WAD:           1e18 - used for normalized time, shares

Ticks:         price = 1.0001^tick
               Each tick = 0.01% price change

Token decimals: ETH=18, USDC=6, WBTC=8
                ALWAYS check decimals before interpreting prices!
────────────────────────────────────────────────────────
```

See [VIEM.md](references/VIEM.md) for precision-safe conversion functions.

## Critical Constants

```solidity
uint256 constant WAD = 1e18;
int24 constant MAX_TICK_SPACING = 30;
uint256 constant MAX_PRICE_DISCOVERY_SLUGS = 15;
```

## Cross-References

- Tick math formulas: [uniswap-fundamentals/TICK-MATH.md](../uniswap-fundamentals/references/TICK-MATH.md)
- Liquidity calculations: [uniswap-fundamentals/LIQUIDITY.md](../uniswap-fundamentals/references/LIQUIDITY.md)
- V4 dynamic parameters: [v4-dynamic-auction/PARAMETERS.md](../v4-dynamic-auction/references/PARAMETERS.md)
- V3 Static parameters: [v3-static-auction/PARAMETERS.md](../v3-static-auction/references/PARAMETERS.md)

## References

- [CAST.md](references/CAST.md) - Foundry cast command patterns
- [VIEM.md](references/VIEM.md) - Node scripts with viem for complex math
- [RPC.md](references/RPC.md) - Direct RPC calls for archive queries
- [EXPLORERS.md](references/EXPLORERS.md) - Etherscan, subgraphs, indexers
