# Testing & Invariant Guide

## File Map
- `doppler/test/unit/dopplerHooks/RehypeDopplerHook.t.sol` – constructor, initialization, fee distribution, beneficiary flows
- `doppler/test/integration/RehypeDopplerHook.t.sol` – full Airlock stack, swap flows, buybacks
- `doppler/test/invariant/rehype/` – setup, handler, invariants, plus `SPECIFICATION.md` (risk analysis)

## Quick Commands
```bash
# Unit + integration focus
forge test --match-contract RehypeDopplerHook -vv
forge test --match-contract RehypeDopplerHookIntegrationTest -vv

# Invariant suites
forge test --match-contract RehypeInvariants -vvv
forge test --match-contract RehypeInvariantsETH -vvv
```
Add `--ffi` or `--gas-report` as needed; invariants already set `fail_on_revert = false` to capture handler errors.

## Invariant Architecture (from SPECIFICATION.md)
- `RehypeSetup.sol` deploys Airlock, Initializer, Rehype hook.
- `RehypeHandler.sol` performs fuzzed actions: swaps, fee collection, fee distribution changes.
- `RehypeInvariants.t.sol` enforces properties: no unexpected swap reverts, balances stay solvent, fee accounting matches ERC20 balances, LP liquidity bounded.
- Multi-pool variant (`test/invariant/rehype/multi/`) stresses simultaneous pools.

## What To Watch
| Risk | Detector |
| --- | --- |
| Hook spends more tokens than held | Ghost balance comparison in handler + invariant ensuring hook balances ≥ tracked fees |
| Rebalance binary search fails | Invariant ensures `_rebalanceFees` never causes revert; watch for seeds where `MAX_REBALANCE_ITERATIONS` hits ceiling |
| Fee distribution drift | Invariant asserts sums stay at `WAD`; fails immediately if setters misused |
| Settlement failures | Look for `PoolSettlement` errors or negative deltas during `_settleDelta` |

## Debug Workflow
1. Re-run with the failing seed: `forge test --match-contract RehypeInvariants -vv --debug --fork-url ... --seed <seed>`.
2. Inspect handler traces to see which action (swap, collect, rebalance) triggered the revert.
3. Cross-check `_collectSwapFees` maths; ensure custom fee × output amount does not exceed pool manager balance.
4. Validate ERC20 balances for the hook vs. `getHookFees` with `cast call` or Foundry cheatcodes.
5. If the quoter produced `simulation.success = false`, confirm there was enough liquidity or adjust EPSILON thresholds.

## Adding Tests
- Use `forge test --match-path test/invariant/rehype/**/*` when editing handler/setup files.
- Keep new invariants under 500 lines; reference `SPECIFICATION.md` for numbering/style so future auditors can align assumptions.
- Document new risks in `SPECIFICATION.md` whenever invariants expand (e.g., ETH-specific edge cases, multi-currency degeneracy).
