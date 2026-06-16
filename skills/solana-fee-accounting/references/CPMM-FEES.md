# CPMM Fees

CPMM swaps split total swap fees between:
- distributable fees owed to positions
- compounded amounts retained in reserves

Per-position fee accounting uses:
- pool global fee growth fields
- position last fee growth snapshots
- position owed fee fields

Protocol fee behavior can mint shares to the protocol fee position based on reserve growth. When auditing fees, include `pool.protocol_fee_position` and `Pool.total_shares`.

Protocol fee ownership and redemption have changed over time. For customer-facing claims, decode the pool and protocol fee position through the SDK/IDL used by the integration rather than relying on copied examples.
