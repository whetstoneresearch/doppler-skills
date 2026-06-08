# SDK Surface

Use the published `@whetstone-research/doppler-sdk` package as the customer-facing integration surface. Repo-local scripts are examples and maintenance tooling, not a stable consumer API.

## Initializer
Exports include:
- constants and account discriminators
- `decodeInitConfig`
- `decodeLaunch`
- `getConfigAddress`
- `getLaunchAddress`
- `getLaunchAuthorityAddress`
- `launchIdFromU64`
- instruction builders for config, launch, swap, migration, and previews
- fetch helpers for launch discovery

## CPMM migrator
Exports include:
- `getCpmmMigratorStateAddress`
- `getMigrationAuthorityAddress`
- `encodeRegisterLaunchCalldata`
- `encodeMigrateCalldata`
- `decodeCpmmMigratorState`

## CPMM core
Use the published SDK Solana exports and generated IDLs for pool, position, oracle, math, and instruction helpers.

Check the installed SDK version and bundled IDLs before using examples, because launch and migrator ABIs can change across package versions.
