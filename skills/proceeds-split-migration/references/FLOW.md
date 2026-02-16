# Migration Flow

1. `initialize(...)` on `UniswapV4MigratorSplit` stores `AssetData` and optional split config.
2. Optional external top-ups accumulate in `TopUpDistributor.topUpOf[token0][token1]`.
3. `migrate(...)` computes balances and calls `_distributeSplit(token0, token1, balance0, balance1)`.
4. `_distributeSplit`:
   - determines numeraire side using `isToken0`
   - transfers split share to recipient
   - calls `TOP_UP_DISTRIBUTOR.pullUp(token0, token1, recipient)`
5. Remaining balances provide liquidity in the destination V4 pool via split migrator logic.

## Event anchors
- `DistributeSplit(token0, token1, recipient, amount)`
- `PullUp(migrator, asset, numeraire, recipient, amount)`
