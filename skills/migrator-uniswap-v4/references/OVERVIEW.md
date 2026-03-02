# V4 Migrator Functionality

Doppler's preferred migration path targets Uniswap V4 and includes two common migrator classes:

1. `UniswapV4MulticurveMigrator`
2. `UniswapV4MigratorSplit`

## Standard migrator path

`UniswapV4MulticurveMigrator` typically:

1. Receives handoff from Airlock.
2. Initializes destination V4 pool state.
3. Adjusts/derives curve positions from migration-time state.
4. Routes resulting positions into locker/recipient flow.

[Source: standard migration flow](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/migrators/UniswapV4MulticurveMigrator.sol) (lines 126-162)

## Split migrator path

`UniswapV4MigratorSplit` adds proceeds split behavior:

1. Stores split configuration at initialization.
2. Distributes configured split share during migration.
3. Pulls accumulated top-ups through `TopUpDistributor.pullUp(...)`.

[Source: split migration flow](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/migrators/UniswapV4MigratorSplit.sol), [Source: FLOW.md](../../proceeds-split-migration/references/FLOW.md)

## Upstream boundary

Airlock controls migration lifecycle and hands remaining balances to the configured migrator after fee accounting.

[Source: Airlock migration flow](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 194-226, 237-252)
