# Configuration Checklist

## Migrator init inputs
- fee / tickSpacing / lockDuration
- beneficiaries for locker behavior
- `proceedsRecipient`
- `proceedsShare`

## Split configuration invariants
- `proceedsRecipient != address(0)`
- `proceedsShare <= 0.5e18`
- token pair order normalized as `(token0, token1)`
- `isToken0` reflects whether asset is token0

## Top-up distributor prerequisites
- Ensure `setPullUp(migrator, true)` is configured for the target migrator
- Top-ups are funded in numeraire via `topUp(asset, numeraire, amount)`
