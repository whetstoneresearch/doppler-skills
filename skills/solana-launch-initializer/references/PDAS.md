# Initializer PDAs

Use published SDK helpers when available unless you need to verify seed bytes manually.

## Seeds
| PDA | Seeds |
|---|---|
| `InitConfig` | `[b"config"]` |
| `Launch` | `[b"launch", namespace, launch_id]` |
| `launch_authority` | `[b"launch_authority", launch]` |
| `LaunchFeeState` | `[b"launch_fee_state", launch]` |

`launch_id` is exactly 32 bytes. The SDK helper `launchIdFromU64` embeds a little-endian `u64` in the first 8 bytes of a 32-byte array.

## Account lookup
There is no asset-keyed `getAssetData` equivalent. To fetch a known launch, derive `Launch` from `(namespace, launch_id)`.

For discovery, use `getProgramAccounts` with:
- account discriminator at offset `0`
- `authority` at offset `8` when filtering by authority

Common published SDK helpers:
- `getConfigAddress`
- `getLaunchAddress`
- `getLaunchAuthorityAddress`
- `fetchLaunch`
- `fetchAllLaunches`
- `fetchLaunchesByAuthority`
- `launchExists`

## Important distinction
`base_mint` and `quote_mint` are fields inside the launch account, not seeds for the launch PDA. If all you have is a mint, discover launch accounts by scanning and decoding, or maintain an external index.
