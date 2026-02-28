# V3 Migrator Interface

Canonical contract path: `doppler/src/migrators/UniswapV3Migrator.sol`.

This repository does not include that Solidity source. Generate the exact ABI from your deployed build and treat it as authoritative.

## ABI extraction

```bash
forge inspect UniswapV3Migrator abi > migrator-uniswap-v3.abi.json
jq -r '.[] | select(.type=="function") | "\(.name)(\(.inputs | map(.type) | join(",")))"' migrator-uniswap-v3.abi.json
```

## Integration-critical expectation

Airlock calls the configured migrator through `liquidityMigrator.migrate(...)` during migration lifecycle execution.

[Source: Airlock migration flow](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 194-226)
