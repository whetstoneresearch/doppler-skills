---
name: solana-launch-initializer
description: "Canonical reference for doppler-sol launch creation, bonding-curve trading, hook configuration, migration handoff, authorized no-migrator launches, launch fee state, and initializer PDA semantics."
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Consumer Source of Truth**: Use the published `@whetstone-research/doppler-sdk` Solana helpers and generated IDLs for launch addresses, instructions, and account decoding.

# Solana Launch Initializer

## When to use
- You are creating, inspecting, or supporting a Solana Doppler launch.
- You need the Solana equivalent of the Airlock launch lifecycle.
- You need launch PDA lookup, launch phases, curve swap behavior, or authorized no-migrator semantics.

## Mental model
The Initializer is the Solana launch entrypoint. It creates the base mint, launch vaults, launch state, launch fee state, optional hook configuration, and optional migrator configuration.

Do not map it one-to-one to EVM Airlock modules. Solana uses one initializer program with external CPI hooks and migrators.

## Core workflow
1. Create or fetch the global `InitConfig` address with SDK helpers.
2. Ensure intended migrator and hook programs are allowlisted, unless using `Pubkey::default()` for none.
3. Derive launch, launch authority, and launch fee state addresses from `(namespace, launch_id)` with SDK helpers.
4. Call `initialize_launch` with base supply partitions, curve parameters, trading flags, hook config, payload commitment hashes, fee beneficiaries, and migrator config.
5. Trade through `curve_swap_exact_in` or preview with `preview_swap_exact_in`.
6. If a migrator is configured, call `migrate_launch` after conditions are met.
7. If no migrator is configured, confirm the launch has an authority and treat the initializer curve as the terminal venue.

## Quick facts
| Item | Detail |
|---|---|
| Program | Initializer |
| Config PDA | `[b"config"]` |
| Launch PDA | `[b"launch", namespace, launch_id]` |
| Launch authority PDA | `[b"launch_authority", launch]` |
| Launch fee state PDA | `[b"launch_fee_state", launch]` |
| Trading phase | `PHASE_TRADING = 0` |
| Migrated phase | `PHASE_MIGRATED = 1` |
| Abort phase | `PHASE_ABORTED = 2` |
| Buy direction | `TRADE_DIRECTION_BUY = 0` |
| Sell direction | `TRADE_DIRECTION_SELL = 1` |
| Supported curve | XYK with virtual reserves |
| Payload buffer | `PayloadBuf`, max 256 bytes |

## Failure modes
- Looking up a launch by asset mint instead of `(namespace, launch_id)`.
- Treating `Pubkey::default()` as an allowlisted real program instead of the "none" hook/migrator marker.
- Forgetting reserved base: curve trading excludes `base_for_distribution + base_for_liquidity`.
- Passing migrator payloads or nonzero `base_for_liquidity` for a no-migrator launch.
- Passing nonzero hook or migrator remaining-account commitment hashes when the corresponding path is disabled.
- Creating a permissionless launch without a migrator; permissionless launches require a migrator and non-empty migrate payload.
- Assuming no-migrator is the same as EVM `NoOpMigrator`; it is different by design.
- Omitting hook or migrator remaining accounts required by the configured external program.

## References
- [PDAS.md](references/PDAS.md)
- [WORKFLOW.md](references/WORKFLOW.md)
- [NO-MIGRATOR.md](references/NO-MIGRATOR.md)

## Related skills
- [solana-cpmm-migration](../solana-cpmm-migration/SKILL.md)
- [solana-hooks](../solana-hooks/SKILL.md)
- [solana-sdk-and-lookup](../solana-sdk-and-lookup/SKILL.md)
- [solana-verification](../solana-verification/SKILL.md)
