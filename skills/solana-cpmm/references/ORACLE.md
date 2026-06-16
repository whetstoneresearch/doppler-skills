# CPMM Oracle

The CPMM oracle is optional and per pool.

Oracle PDA:

```text
[b"oracle", pool]
```

The oracle is not created automatically at pool initialization. `initialize_oracle` requires an existing pool with non-zero reserves.

Oracle state stores truncated prices, deviation values, cumulative price limbs, timestamps, and a ring buffer of observations. Optional oracle accounts can be passed to swap/liquidity paths for updates or read-only hook context.

When verifying oracle behavior, decode the oracle account through the SDK or IDL and compare it with the pool state used by the transaction.
