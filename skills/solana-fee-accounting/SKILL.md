---
name: solana-fee-accounting
description: "Reference for doppler-sol launch, CPMM, protocol, and migration fee accounting across Initializer, CPMM, and CPMM migrator flows."
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Consumer Source of Truth**: Use SDK/IDL decoders and on-chain account state for fee reconciliation.

# Solana Fee Accounting

## When to use
- You are reconciling launch curve fees, CPMM LP fees, or protocol fees.
- You are reconciling migration-time distribution or fee harvesting behavior for an integration.
- You need to compare Solana fee behavior to EVM proceeds split or fee locker concepts.

## Mental model
Solana fee accounting is spread across program surfaces:
- Initializer curve trades charge swap fees into `LaunchFeeState`.
- `claim_fees`, `replace_fee_beneficiary`, and `set_fee_policy` operate on launch fee policy and distributions.
- `harvest_migrated_fees` and `distribute_base_allocation_no_migration` cover post-launch fee/allocation flows.
- CPMM swaps split fees between distributable LP fees and compounding reserves.
- CPMM protocol fees can mint shares into a protocol fee position and redeem shares.
- CPMM migrator handles launch distribution and liquidity handoff.

Do not assume EVM `StreamableFeesLocker`, `TopUpDistributor`, or proceeds-split semantics are present unless a current Solana program implements them.

## Core workflow
1. Identify whether the action is launch trading, migration, post-migration CPMM trading, or fee collection.
2. Read the relevant account state directly, not only vault balances.
3. For CPMM, separate reserves from `fees_unclaimed*`.
4. Include protocol fee position shares when checking `total_shares`.
5. For migration, reconcile reserved base partitions and recipient distribution.
6. Check SDK/IDL version and decoded account state before making claims about fee parity.

## Quick facts
| Fee surface | Primary state |
|---|---|
| Launch swap fee | `Launch.swap_fee_bps`, `LaunchFeeState` |
| CPMM swap fee | `Pool.swap_fee_bps` |
| CPMM distributable fee split | `Pool.fee_split_bps`, fee growth fields |
| CPMM protocol fee | config protocol fee settings, protocol fee position |
| Migration distribution | CPMM migrator state and recipient accounts |

## Failure modes
- Reconciling fees from SPL vault balances without subtracting reserves and unclaimed fee buckets.
- Ignoring `LaunchFeeState` or protocol fee position shares.
- Treating recipient distribution as EVM proceeds split parity.
- Assuming launch fee behavior is stable without checking recent `doppler-sol` changes.
- Confusing creator/admin fee claims with LP fee collection.

## References
- [SURFACES.md](references/SURFACES.md)
- [CPMM-FEES.md](references/CPMM-FEES.md)
- [MIGRATION-FEES.md](references/MIGRATION-FEES.md)

## Related skills
- [solana-launch-initializer](../solana-launch-initializer/SKILL.md)
- [solana-cpmm](../solana-cpmm/SKILL.md)
- [solana-cpmm-migration](../solana-cpmm-migration/SKILL.md)
- [solana-verification](../solana-verification/SKILL.md)
