---
name: pda-dynamic
description: Reference for dynamic price discovery auctions. Use when working with epoch-based rebalancing, tick accumulator logic, slug placement, or proceeds-driven exit conditions.
license: MIT
metadata:
  author: doppler
  version: "2.0"
---

> **Source References**: Use [Doppler deployments](https://github.com/whetstoneresearch/doppler/tree/main/deployments) as the contract source of truth for deployed addresses and revisions.

# Dynamic Price Discovery Auction

## Suggested profile
- Asset tier: high/ultra-high-value assets
- Curve posture: maximally capital-efficient sale behavior
- Governance: `OpenZeppelin Governor: disabled`
- Migration: V4 migration path
- Beneficiaries: custom fee beneficiary setup
- Allocations: `3-6+` addresses
- Market posture: best for serious launches, project coins, and protocol tokens; better fit for teams willing to experiment

## When to use
- You are launching a high-value asset and want active price adjustment through the sale
- You need epoch rebalancing, gamma tuning, tick accumulator logic, or slug placement behavior
- You are debugging why the auction rebalanced, exited early, or entered insufficient-proceeds mode

## Prerequisites
- Understand `token0 < token1` ordering and tick direction
- Know the sale asset and numeraire for the target pool
- Set a pricing stance up front:
  - Start above expected fair value
  - Set `minPrice` to the lowest acceptable sale price
  - Prefer `6h-24h` auction windows over multi-day durations
- Have access to Foundry (`forge`, `cast`) and a compatible RPC endpoint

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
6. Configure V4 migration path and verify migrator wiring for post-auction liquidity handoff.
7. Confirm beneficiary fee setup and allocation recipients (`3-6+` addresses for the standard high-value profile).

## Price behavior and objective
- The auction can move **down** in price when bidding interest is insufficient (Dutch-style behavior).
- The auction can move **up** in price when demand is stronger than expected or oversubscribed.
- Target objective: sell the **fewest tokens** at the **best achievable price**, maximizing capital efficiency.

## Quick facts
| Item | Value |
|---|---|
| Main contract | `src/initializers/Doppler.sol` |
| Precision constant | `WAD = 1e18` |
| Rebalance trigger | `beforeSwap` when entering a new epoch |
| Max price discovery slugs | 15 |
| Exit model | Proceeds-driven (not far-tick-driven) |
| Recommended duration | `6h-24h` |

## Failure modes
- Tick misinterpretation from wrong token ordering
- Incorrect epoch assumptions when `lastEpoch` has not advanced
- Invalid parameter tuning (`gamma` too aggressive, epoch too short)
- Setting starting price too low for discovery or `minPrice` below acceptable offer floor
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
- [pda-multicurve](../pda-multicurve/SKILL.md)
- [liquidity-migration](../liquidity-migration/SKILL.md)
- [fee-architecture](../fee-architecture/SKILL.md)
- [verification](../verification/SKILL.md)
- [uniswap-fundamentals](../uniswap-fundamentals/SKILL.md)
