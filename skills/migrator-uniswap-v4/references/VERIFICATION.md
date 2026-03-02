# V4 Migrator Verification

## Checklist

1. Verify Airlock points `liquidityMigrator` to the intended V4 migrator.
2. Verify migration transaction mutates expected V4 destination state.
3. Verify recipient/locker ownership and resulting balances.
4. If split mode is active:
   - verify split recipient payout
   - verify `TopUpDistributor.pullUp(...)` outcomes

## Useful skills

- [verification](../../verification/SKILL.md)
- [proceeds-split-migration](../../proceeds-split-migration/SKILL.md)
- [airlock](../../airlock/SKILL.md)
