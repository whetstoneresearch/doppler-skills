---
name: solana-cpmm
description: "Reference for doppler-sol CPMM pools, positions, swaps, liquidity, protocol fee positions, oracle accounts, hooks, and PDA-based pool addressing."
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Consumer Source of Truth**: Use the published `@whetstone-research/doppler-sdk` Solana helpers and generated IDLs for pool addresses, instructions, and account decoding.

# Solana CPMM

## When to use
- You are inspecting or integrating post-migration constant-product pools.
- You need pool, authority, position, protocol fee position, or oracle addresses.
- You are debugging swaps, add/remove liquidity, fee accrual, protocol fees, or oracle behavior.

## Mental model
CPMM is the Solana post-migration AMM destination. It is a constant-product pool with SPL vaults, internal LP positions, optional oracle state, optional external hooks, and a protocol fee position.

Do not assume Uniswap V2 LP-token mechanics. Liquidity is tracked in `Position` accounts, and fees accrue through per-position accounting.

## Core workflow
1. Derive the config and pool addresses with SDK helpers, preserving canonical mint ordering.
2. Initialize a pool with token vaults owned by the pool authority PDA.
3. Create user positions by `(pool, owner, position_id)`.
4. Add liquidity into a position and collect accrued fees through that position.
5. Swap exact input amounts through `swap_exact_in`.
6. If configured, update or consult oracle state.
7. Reconcile protocol fee shares through the pool protocol fee position.

## Quick facts
| Item | Detail |
|---|---|
| Program | CPMM |
| Config PDA | `[b"config"]` |
| Pool PDA | `[b"pool", token0_mint, token1_mint]` |
| Mint ordering | raw pubkey byte order |
| Vault authority PDA | `[b"authority", pool]` |
| Position PDA | `[b"position", pool, owner, position_id_le_bytes]` |
| Protocol fee owner PDA | `[b"protocol_fee_owner", pool]` |
| Protocol fee position PDA | `[b"position", pool, protocol_fee_owner, 0]` |
| Oracle PDA | `[b"oracle", pool]` |
| Token support | token-interface: SPL Token or Token-2022 |

## Failure modes
- Deriving a pool with unsorted mints.
- Treating internal positions as transferable LP tokens.
- Ignoring `fees_unclaimed*` when reconciling vault balances against reserves.
- Forgetting the protocol fee position can hold shares.
- Assuming oracle accounts are created automatically with pools.
- Reusing removed routing or `quote_to_numeraire` assumptions; current CPMM no longer has route fields.

## References
- [PDAS.md](references/PDAS.md)
- [POOL-ACCOUNTING.md](references/POOL-ACCOUNTING.md)
- [ORACLE.md](references/ORACLE.md)

## Related skills
- [solana-cpmm-migration](../solana-cpmm-migration/SKILL.md)
- [solana-hooks](../solana-hooks/SKILL.md)
- [solana-fee-accounting](../solana-fee-accounting/SKILL.md)
- [solana-verification](../solana-verification/SKILL.md)
