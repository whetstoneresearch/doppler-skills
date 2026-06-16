---
name: solana-cpmm-migration
description: "Configure and verify doppler-sol initializer migrations into CPMM pools, including migrator payloads, state PDAs, migrated pool hook config, recipient distribution, and remaining-account order."
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Consumer Source of Truth**: Use the published `@whetstone-research/doppler-sdk` Solana helpers and generated IDLs for addresses, payloads, and account decoding.

# Solana CPMM Migration

## When to use
- You are integrating a Solana launch that migrates into a CPMM pool.
- You need to build or decode CPMM migrator payloads from a client.
- You are debugging launch vault handoff, recipient distribution, or CPMM pool initialization from transaction/account state.

## Mental model
The CPMM migrator is an external program invoked by the Initializer. It registers per-launch migration parameters during launch initialization, then consumes launch vault balances during migration and creates the destination CPMM pool.

## Core workflow
1. Derive the `CpmmMigratorState` PDA with SDK helpers from the launch address.
2. Encode `register_launch` payload with SDK or IDL builders and pass it as initializer `migrator_init_payload`.
3. Encode `migrate` payload with SDK or IDL builders and store it as initializer `migrator_migrate_payload`.
4. Include CPMM migrator accounts as remaining accounts to `initialize_launch` and `migrate_launch`.
5. At migration, verify min raise, optional price floor, token partitions, recipient accounts, and CPMM pool creation.

## Quick facts
| Item | Detail |
|---|---|
| Program | CPMM migrator |
| Migrator state PDA | `[b"state", launch]` |
| Migration authority PDA | `[b"migration_authority"]` |
| Init instruction | `register_launch` |
| Migration instruction | `migrate` |
| Recipient capacity | 2 recipients |
| Destination | CPMM pool and position |

## Failure modes
- Register and migrate payloads disagree on launch supply partitions.
- Recipient ATAs are missing, out of order, or extra.
- `base_for_liquidity` or `base_for_distribution` does not match launch state.
- Minimum quote raise or migration price floor is not met.
- CPMM pool mints are passed in non-canonical order.
- Remaining accounts omit CPMM, token, ATA, protocol fee, hook, or recipient accounts required by the migrator path.

## References
- [PAYLOADS.md](references/PAYLOADS.md)
- [MIGRATION-FLOW.md](references/MIGRATION-FLOW.md)
- [REMAINING-ACCOUNTS.md](references/REMAINING-ACCOUNTS.md)

## Related skills
- [solana-launch-initializer](../solana-launch-initializer/SKILL.md)
- [solana-cpmm](../solana-cpmm/SKILL.md)
- [solana-fee-accounting](../solana-fee-accounting/SKILL.md)
- [solana-verification](../solana-verification/SKILL.md)
