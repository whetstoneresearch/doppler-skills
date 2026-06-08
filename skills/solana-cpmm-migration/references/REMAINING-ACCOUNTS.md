# Remaining Accounts

The Initializer sends a standardized account prefix to migrator CPIs, then appends caller-supplied remaining accounts.

Standard prefix:
1. initializer config
2. launch
3. launch authority
4. base mint
5. quote mint
6. base vault
7. quote vault
8. payer
9. token program
10. system program
11. rent

The CPMM migrator consumes additional accounts after that prefix for its state, CPMM config/pool/position/vaults, protocol fee owner and position, admin accounts, token accounts, hook accounts if needed, and recipient ATAs.

Recipient distribution is order-sensitive. Each non-zero recipient consumes the next remaining recipient ATA. Extra recipient accounts can fail migration.
