# V2 Migrator Interface

Canonical contract path: `doppler/src/migrators/UniswapV2Migrator.sol`.

Because this repository does not vendor the Solidity source, generate and verify the exact interface from your deployed build before integration.

## ABI extraction

```bash
forge inspect UniswapV2Migrator abi > migrator-uniswap-v2.abi.json
jq -r '.[] | select(.type=="function") | "\(.name)(\(.inputs | map(.type) | join(",")))"' migrator-uniswap-v2.abi.json
```

## Integration-critical expectation

Airlock calls the configured migrator via `liquidityMigrator.migrate(...)` during `Airlock.migrate(asset)`.

[Source: Airlock migration flow](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 194-226)
