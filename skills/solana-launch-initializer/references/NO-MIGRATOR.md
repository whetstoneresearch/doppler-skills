# No-Migrator Launches

Solana no-migrator launches use `migrator_program = Pubkey::default()` and require a launch authority.

Semantics:
- authority is present
- no migrator init hook
- no migration destination program
- migrator payloads must be empty
- `base_for_liquidity` must be zero
- launch remains on the initializer curve as the terminal venue

This is not mechanically equivalent to EVM `NoOpMigrator`.

EVM `NoOpMigrator` is an explicit module that can be validated and initialized as a migrator. Solana no-migrator is the absence of a migrator program.

If authority is omitted, configure a migrator and non-empty migrate payload.
