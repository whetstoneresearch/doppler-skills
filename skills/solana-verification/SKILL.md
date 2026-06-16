---
name: solana-verification
description: "Verify doppler-sol integrations with Solana RPC, SDK decoders, IDLs, transaction logs, and deterministic account checks."
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Consumer Source of Truth**: Use SDK decoders, generated IDLs, RPC reads, explorers/indexers, and transaction logs.

# Solana Verification

## When to use
- Launch, migration, swap, fee, or hook behavior does not match expectations.
- You need chain-backed proof before changing integration code or reporting a protocol issue.
- You need to validate a Solana/EVM parity claim.

## Tool selection
- SDK decoders or IDL-generated clients: safest path for launch, CPMM, migrator, and oracle account state.
- `getProgramAccounts`: discovery with discriminator and memcmp filters.
- `solana account`: raw account inspection.
- IDLs: instruction/account interface checks.
- Program logs: CPI and custom error debugging.

## Core workflow
1. Derive every address with SDK helpers.
2. Fetch and decode account state.
3. Confirm instruction account order and remaining accounts.
4. Recompute expected reserves, partitions, fees, or distributions off-chain.
5. Compare against events/logs and SPL token account balances.
6. If the issue appears protocol-side, reduce it to decoded account state, transaction logs, and minimal reproduction inputs before escalating.

## Quick facts
| Surface | Customer proof |
|---|---|
| Initializer | decoded launch, vaults, fee state, transaction logs |
| CPMM | decoded pool, positions, vaults, oracle account |
| CPMM migrator | decoded migrator state, recipient token accounts, launch phase |
| Hooks | stored hook config, remaining accounts, return data/logs |
| SDK/IDLs | installed SDK version and generated account/instruction layouts |

## Failure modes
- Trusting copied addresses or stale examples instead of SDK-derived addresses.
- Assuming unmerged protocol behavior is available to customers.
- Verifying only vault balances when state fields drive accounting.
- Skipping remaining-account order checks.
- Using stale IDLs or SDK package versions after program ABI changes.

## References
- [SUPPORT-EVIDENCE.md](references/SUPPORT-EVIDENCE.md)
- [CHECKS.md](references/CHECKS.md)
- [PARITY.md](references/PARITY.md)

## Related skills
- [solana-launch-initializer](../solana-launch-initializer/SKILL.md)
- [solana-cpmm](../solana-cpmm/SKILL.md)
- [solana-cpmm-migration](../solana-cpmm-migration/SKILL.md)
- [solana-hooks](../solana-hooks/SKILL.md)
- [solana-fee-accounting](../solana-fee-accounting/SKILL.md)
- [solana-sdk-and-lookup](../solana-sdk-and-lookup/SKILL.md)
