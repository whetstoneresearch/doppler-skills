# V2 Migrator Functionality

The V2 migrator path is the compatibility destination for launches that migrate liquidity into a Uniswap V2-style pool.

## Functional responsibilities

1. Accept migration handoff from Airlock.
2. Consume post-fee token balances from the Airlock migration flow.
3. Initialize and/or add destination V2 liquidity.
4. Route migrated liquidity ownership to the configured recipient flow.

## Upstream boundary

Airlock computes protocol/integrator fees before migrator handoff:

- `Airlock.migrate(asset)`
- `_handleFees(...)` on each side
- transfer remaining balances to `liquidityMigrator`
- `liquidityMigrator.migrate(...)`

[Source: Airlock migration flow](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 194-226, 237-252)
