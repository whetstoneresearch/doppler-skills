# CPMM PDAs

## Seeds
| PDA | Seeds |
|---|---|
| `AmmConfig` | `[b"config"]` |
| `Pool` | `[b"pool", token0_mint, token1_mint]` |
| `authority` | `[b"authority", pool]` |
| `Position` | `[b"position", pool, owner, position_id_le_bytes]` |
| `protocol_fee_owner` | `[b"protocol_fee_owner", pool]` |
| `protocol_fee_position` | `[b"position", pool, protocol_fee_owner, 0]` |
| `OracleState` | `[b"oracle", pool]` |

Pool mints are canonically ordered by raw pubkey bytes. Passing `token0_mint` and `token1_mint` in the wrong order fails initialization.

## Position IDs
`position_id` is caller-chosen. There is no global counter. A user can own multiple positions for the same pool by choosing distinct ids.

## Protocol position
Every pool stores `protocol_fee_position`. Protocol fee share minting can increase this position's shares, so it must be included in liquidity paths that mint or redeem protocol shares.
