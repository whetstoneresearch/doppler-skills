---
name: v4-dynamic-auction
description: Reference for Doppler V4 dynamic auctions. Use when working with `Doppler`, epoch-based rebalancing, tick accumulator logic, slug placement, or dynamic auction exit conditions.
metadata:
  author: doppler
  version: "2.0"
---

> **Source References**: Code citations link to raw GitHub files pinned to commit `46bad16d`.

# V4 Dynamic Auction

## When to use
- Tasks involving `src/initializers/Doppler.sol` or `src/initializers/UniswapV4Initializer.sol`
- Questions about epoch rebalancing, gamma, tick accumulator, slug mechanics, or proceeds thresholds
- Debugging why a dynamic auction rebalanced, exited early, or entered insufficient-proceeds mode

## Prerequisites
- Understand `token0 < token1` ordering and tick direction
- Know the sale asset and numeraire for the target pool
- Have access to Foundry (`forge`, `cast`) and a V4-capable RPC endpoint

## Core workflow
1. Decode the initialization config (`startingTick`, `endingTick`, `gamma`, `epochLength`, `numTokensToSell`, proceeds bounds).
2. Confirm epoch state (`lastEpoch`, `tickAccumulator`, `totalTokensSold`, `totalProceeds`).
3. Evaluate rebalance mode for the current epoch:
   - Max adjustment (no/low sales)
   - Relative adjustment (behind schedule)
   - Oversold adjustment (ahead of schedule)
4. Verify liquidity placement across slug classes:
   - Lower slug (refund support)
   - Upper slug (current epoch sales)
   - Price discovery slugs (future epochs)
5. Determine exit path:
   - Early exit (`maximumProceeds` reached)
   - Success at end time (`minimumProceeds` reached)
   - Insufficient proceeds (refund path)

## Quick facts
| Item | Value |
|---|---|
| Main contract | `src/initializers/Doppler.sol` |
| Precision constant | `WAD = 1e18` |
| Rebalance trigger | `beforeSwap` when entering a new epoch |
| Max price discovery slugs | 15 |
| Exit model | Proceeds-driven (not far-tick-driven) |

## Failure modes
- Tick misinterpretation from wrong token ordering
- Incorrect epoch assumptions when `lastEpoch` has not advanced
- Invalid parameter tuning (`gamma` too aggressive, epoch too short)
- Misreading insufficient-proceeds behavior as a hard failure

## Verification hooks
- Auction state: see `../verification/references/CAST.md`
- Math conversions: see `../verification/references/VIEM.md`
- Event-driven analysis: see `../verification/references/EXPLORERS.md`

## References
- [FLOW.md](references/FLOW.md)
- [PARAMETERS.md](references/PARAMETERS.md)
- [FORMULAS.md](references/FORMULAS.md)
- [GOTCHAS.md](references/GOTCHAS.md)
- Source: `doppler/src/initializers/Doppler.sol`, `doppler/docs/Doppler.md`

## Related skills
- [v4-multicurve-auction](../v4-multicurve-auction/SKILL.md)
- [fee-architecture](../fee-architecture/SKILL.md)
- [verification](../verification/SKILL.md)
- [uniswap-fundamentals](../uniswap-fundamentals/SKILL.md)
