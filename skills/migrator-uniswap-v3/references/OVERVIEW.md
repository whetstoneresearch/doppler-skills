# V3 Migrator Functionality

The V3 migrator path is a conditional fallback for legacy environments where V4 is unavailable and custom fee requirements must be preserved.

## Functional responsibilities

1. Accept migration handoff from Airlock.
2. Consume post-fee balances from the Airlock migration pipeline.
3. Initialize/add Uniswap V3 destination liquidity with required fee-tier semantics.
4. Route resulting liquidity ownership to the configured recipient flow.

## Upstream boundary

Airlock performs fee handling before migrator execution:

- `Airlock.migrate(asset)`
- `_handleFees(...)`
- transfer remaining balances to `liquidityMigrator`
- `liquidityMigrator.migrate(...)`

[Source: Airlock migration flow](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 194-226, 237-252)
