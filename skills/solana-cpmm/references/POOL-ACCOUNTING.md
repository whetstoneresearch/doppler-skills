# CPMM Pool Accounting

## Reserves and vaults
`Pool.reserve0` and `Pool.reserve1` are AMM reserves. They exclude distributable fees.

Token vault balances can be larger than reserves because vaults also hold:
- unclaimed LP fees
- protocol-fee-related amounts before collection
- accidental extra tokens that may be skimmed

Do not reconcile reserve math using vault balances without accounting for fee buckets.

## Positions
Liquidity is tracked as shares in `Position` accounts:
- user positions are keyed by owner and position id
- the protocol fee position is a position keyed by pool, protocol fee owner, and position id 0

Fee accrual uses global fee growth fields on the pool and per-position snapshots.

## Swaps
`swap_exact_in` uses exact input and enforces minimum output. If a hook is configured, the hook may reject or adjust fee behavior according to enabled flags.

## Liquidity
Initial liquidity mints shares from `sqrt(amount0 * amount1)`. Later adds mint proportional shares using current reserves and total shares.
