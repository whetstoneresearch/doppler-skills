# Lookup Patterns

## Known launch
If you know `namespace` and `launch_id`, derive the launch PDA:

```text
[b"launch", namespace, launch_id]
```

Use the published SDK `initializer.getLaunchAddress(namespace, launchId)` helper. Manual seed derivation is for explaining or verifying the SDK output, not for copy-pasted client code.

## Authority discovery
Use `fetchLaunchesByAuthority` or a `getProgramAccounts` memcmp filter:
- discriminator at offset `0`
- authority at offset `8`

Permissionless launches have authority equal to `Pubkey::default()`.

## Mint discovery
Launch PDA seeds do not include `base_mint` or `quote_mint`. To find launches by mint, use an indexer or scan/decode launch accounts and filter decoded fields.

## Account discriminators
Use SDK or IDL discriminator helpers when available instead of hard-coding discriminator bytes.
