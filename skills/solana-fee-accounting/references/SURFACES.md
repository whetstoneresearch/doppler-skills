# Fee Surfaces

## Initializer
Launch curve trades use `Launch.swap_fee_bps` during `curve_swap_exact_in`.

`LaunchFeeState` stores:
- protocol fee bps
- swap fee bps
- fee beneficiaries
- cumulative base and quote fees
- protocol and beneficiary distribution accounting

The launch account also stores base supply partitions:
- `base_for_distribution`
- `base_for_liquidity`
- `base_for_curve`

Reserved base affects trade reserve math and migration accounting.

## CPMM
CPMM tracks:
- swap fee bps
- fee split bps
- global fee growth
- unclaimed fee buckets
- protocol fee settings
- protocol fee position shares

## CPMM migrator
Migration distributes reserved base and moves liquidity into CPMM. It is not automatically equivalent to EVM proceeds split or fee locker behavior.
