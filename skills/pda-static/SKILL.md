---
name: pda-static
description: Reference for static price discovery auctions on legacy networks that only support Uniswap v3.
license: MIT
metadata:
  author: doppler
  version: "2.0"
---

> **Source References**: Use [Doppler deployments](https://github.com/whetstoneresearch/doppler/tree/main/deployments) as the contract source of truth for deployed addresses and revisions.

# Static Price Discovery Auction

## When to use
- The target network is legacy and only supports Uniswap v3 (no Uniswap v4 support)
- You need fixed-curve behavior with no epoch rebalance
- You are debugging far-tick exit gating or beneficiary fee collection in lockable pools

## Prerequisites
- Choose supported fee tier and corresponding tick spacing
- Confirm tick bounds and token ordering implications

## Core workflow
1. Validate `InitData` (ticks, fee, position count, sale share).
2. Initialize positions once through Airlock.
3. Track auction progression passively via market swaps.
4. Exit when far tick is reached (`exitLiquidity`) for migrable pools.
5. For lockable path, use beneficiary fee collection instead of migration exits.

## Quick facts
| Item | Detail |
|---|---|
| Main contracts | `UniswapV3Initializer`, `LockableUniswapV3Initializer` |
| Rebalancing | None |
| Exit requirement | Price reaches far tick |
| Lockable add-ons | Beneficiaries, pool status gating, fee collection |
| Positioning | Legacy fallback for v3-only networks; multicurve and dynamic are preferred on v4-capable networks |

## Failure modes
- Tick bounds not aligned with spacing
- Misinterpreting far-tick direction due to token ordering
- Treating lockable pools as migrable
- Incorrect beneficiary share configuration

## References
- [PARAMETERS.md](references/PARAMETERS.md)
- [FLOW.md](references/FLOW.md)
- [FORMULAS.md](references/FORMULAS.md)
- [GOTCHAS.md](references/GOTCHAS.md)

## Related skills
- [token-lifecycle](../token-lifecycle/SKILL.md)
- [fee-architecture](../fee-architecture/SKILL.md)
- [verification](../verification/SKILL.md)
