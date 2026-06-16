# Parity Verification

When comparing EVM Doppler and `doppler-sol`, keep mechanics separate.

Useful Solana equivalents:
- EVM Airlock launch lifecycle -> Solana Initializer create/trade/migrate lifecycle
- EVM hook extensibility -> Solana hook CPI return-data programs
- EVM V2-style migration destination -> Solana CPMM migrator into CPMM pool

Non-equivalents:
- EVM `NoOpMigrator` is not the same as Solana `migrator_program = Pubkey::default()`.
- EVM Uniswap V3 static initializer is not the same as Solana CPMM post-launch migration.
- EVM fee lockers and proceeds split are not automatically present in Solana recipient distribution.
- EVM token factory/governance factories do not map to SPL mint creation by Initializer.

For customer-facing parity claims, use deployed behavior, SDK/IDL versions, and decoded account state. Treat unmerged protocol changes as future-looking context only when explicitly requested.
