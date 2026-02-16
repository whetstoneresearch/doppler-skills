---
name: v4-multicurve-auction
description: Reference for Doppler V4 multicurve auctions across base, scheduled, and decay variants; covers shares-based curve allocation, locked vs migrable pools, and migration constraints.
metadata:
  author: doppler
  version: "2.0"
---

> **Source References**: Code citations link to raw GitHub files pinned to commit `46bad16d`.

# V4 Multicurve Auction

## When to use
- You are configuring or debugging multicurve launches on V4
- You need curve share math and position distribution behavior
- You need locked vs migrable pool semantics

## Prerequisites
- Confirm curve set and share total (`WAD` exact)
- Decide variant:
  - Base multicurve (`UniswapV4MulticurveInitializer`)
  - Scheduled multicurve (`UniswapV4ScheduledMulticurveInitializer`)
  - Decay multicurve (`DecayMulticurveInitializer`)

## Core workflow
1. Build `Curve[]` and validate shares/tick spacing.
2. Initialize pool with selected variant.
3. Confirm status path:
   - `Initialized` (migrable, no beneficiaries)
   - `Locked` (beneficiaries configured)
4. Track progression to far-tick exit (for migrable pools).
5. If locked, use fee collection paths instead of migration exits.

## Quick facts
| Item | Detail |
|---|---|
| Main contracts | `UniswapV4MulticurveInitializer`, `UniswapV4ScheduledMulticurveInitializer`, `DecayMulticurveInitializer` |
| Allocation model | Shares-based across independent curves |
| Rebalancing | None (static positions) |
| Hook variants | Scheduled start-time hook, decay fee-schedule hook |

## Failure modes
- Curve shares not summing to `WAD`
- Tick spacing misalignment
- Treating locked pools as migrable
- Wrong assumptions about scheduled start or decaying fee behavior

## References
- [PARAMETERS.md](references/PARAMETERS.md)
- [FLOW.md](references/FLOW.md)
- [FORMULAS.md](references/FORMULAS.md)
- [GOTCHAS.md](references/GOTCHAS.md)
- [VARIANTS.md](references/VARIANTS.md)

## Related skills
- [v4-dynamic-auction](../v4-dynamic-auction/SKILL.md)
- [doppler-hook-initializer](../doppler-hook-initializer/SKILL.md)
- [fee-architecture](../fee-architecture/SKILL.md)
- [verification](../verification/SKILL.md)
