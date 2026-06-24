# Initializer Workflow

## `initialize_config`
Creates `InitConfig` at `[b"config"]`.

Key checks:
- migrator allowlist length fits fixed capacity
- hook allowlist length fits fixed capacity

## `initialize_launch`
Creates the launch state, launch fee state, base mint, base vault, and quote vault.

Key checks:
- migrator and hook are allowlisted unless disabled
- `base_decimals <= MAX_BASE_DECIMALS`
- `base_for_curve = base_total_supply - base_for_distribution - base_for_liquidity`
- `base_for_curve > 0`
- `base_for_liquidity == 0` when no migrator is configured
- hook flags use only the supported `HF_*` bits
- hook and migrator remaining-account commitment hashes are present only when required
- expiring cosigner hook launches commit `hook_remaining_accounts_hash` over `[namespace, cosigner_config, cosigner]`
- metadata accounts are provided when metadata fields require metadata creation
- `curve_virtual_quote > 0`
- `curve_virtual_base > 0`
- `swap_fee_bps` is within config min/max bounds
- curve kind is current XYK format
- fee beneficiaries are valid and stored in `LaunchFeeState`

The base mint authority and freeze authority are the launch authority PDA at creation. After minting `base_total_supply` into the base vault, mint authority and freeze authority are revoked.

## `curve_swap_exact_in`
Trades against the initializer curve while `phase == PHASE_TRADING`.

Buy direction:
- input: quote
- output: base

Sell direction:
- input: base
- output: quote

Curve reserve math excludes reserved base:

```text
reserved_base = base_for_distribution + base_for_liquidity
base_reserve = base_vault.amount - reserved_base
quote_reserve = quote_vault.amount
```

## `migrate_launch`
Marks a launch migrated and invokes the configured migrator with the standard account prefix plus caller-supplied remaining accounts.

The initializer uses signed CPI so migrators can act with `launch_authority` over launch vaults.

Cosigner hooks gate initializer swaps only while the launch remains in the initializer trading phase. After migration, CPMM swaps are governed by the migrated CPMM pool configuration, not by the initializer launch hook.

## Fee state
`LaunchFeeState` is initialized at `[b"launch_fee_state", launch]` and stores protocol fee bps, launch swap fee bps, fee beneficiaries, cumulative base/quote fees, and distributed fee accounting.
