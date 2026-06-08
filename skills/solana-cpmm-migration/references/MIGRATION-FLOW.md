# CPMM Migration Flow

At migration time, the migrator:

1. Validates launch partitioning against migrate args.
2. Validates launch vault and mint consistency.
3. Enforces `min_raise_quote`.
4. Enforces optional `min_migration_price_q64`.
5. Transfers remaining curve base to the admin base ATA.
6. Distributes `base_for_distribution` to configured recipients.
7. Initializes the CPMM pool by CPI.
8. Creates an LP position for `launch_authority`.
9. Adds liquidity using `base_for_liquidity` plus all quote currently in the quote vault.

The destination pool uses CPMM canonical mint ordering. Do not assume base is always token0.
