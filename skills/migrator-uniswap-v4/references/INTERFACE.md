# V4 Migrator Interface

Canonical contract paths:

- `doppler/src/migrators/UniswapV4MulticurveMigrator.sol`
- `doppler/src/migrators/UniswapV4MigratorSplit.sol`

## Known multicurve migrate entrypoint

```solidity
function migrate(
    uint160 sqrtPriceX96,
    address token0,
    address token1,
    address recipient
) external payable returns (uint256)
```

[Source: UniswapV4MulticurveMigrator](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/migrators/UniswapV4MulticurveMigrator.sol) (lines 126-162)

## Split migrator interface guidance

Use ABI extraction for exact split-migrator signatures and initialization fields used by your deployment.

```bash
forge inspect UniswapV4MigratorSplit abi > migrator-uniswap-v4-split.abi.json
jq -r '.[] | select(.type=="function") | "\(.name)(\(.inputs | map(.type) | join(",")))"' migrator-uniswap-v4-split.abi.json
```

## Integration-critical expectation

Airlock calls the configured migrator via `liquidityMigrator.migrate(...)` during `Airlock.migrate(asset)`.

[Source: Airlock migration flow](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 194-226)
