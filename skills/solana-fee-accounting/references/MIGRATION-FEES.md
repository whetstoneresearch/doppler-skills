# Migration Fees and Distribution

The CPMM migrator moves launch assets into:
- admin base ATA for remaining curve inventory
- recipient ATAs for configured distribution
- CPMM vaults for liquidity

Distribution recipient accounts are order-sensitive and tied to migrator state.

This behavior is distinct from EVM proceeds-split modules. If parity is required, state the difference explicitly and verify the deployed Solana behavior through decoded accounts and transaction logs.
