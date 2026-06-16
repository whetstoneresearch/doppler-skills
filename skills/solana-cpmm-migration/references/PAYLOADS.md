# CPMM Migrator Payloads

Use generated IDLs or published `@whetstone-research/doppler-sdk/solana` helpers when available.

The Initializer stores migrator data as `PayloadBuf` values with a 256-byte maximum. Migrator payloads must fit inside that limit.

## Register launch
`register_launch` stores per-launch migration configuration:
- CPMM config
- initial pool fees
- recipient distribution
- minimum quote raise
- optional migration price floor

## Migrate
`migrate` validates launch partitions, consumes launch vault balances, distributes tokens, and initializes CPMM liquidity.

Keep register and migrate args synchronized. Mismatched supply partitions or recipient expectations are migration-time failures.
