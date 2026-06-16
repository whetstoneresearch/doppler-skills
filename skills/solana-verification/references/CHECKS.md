# High-Impact Checks

## Initializer
- Launch PDA matches `(namespace, launch_id)`.
- Launch authority PDA matches launch address.
- Phase is correct for the instruction.
- Reserved base partition is excluded from curve reserves.
- Hook and migrator programs match stored launch config.
- Hook and migrator payloads fit `MAX_PAYLOAD`.
- Remaining-account commitment hashes match the accounts supplied by the client.
- Launch fee state PDA matches launch.

## CPMM
- Pool mints are canonically ordered.
- Vault authority PDA matches pool.
- Position owner and position id match derivation.
- Protocol fee position matches `pool.protocol_fee_position`.
- Vault balances reconcile with reserves plus unclaimed fees.

## Migration
- Register and migrate args agree.
- Remaining accounts match migrator account order.
- Recipient ATAs are present only for non-zero recipients.
- Quote raise and optional price floor are satisfied.

## Hooks
- Hook program is allowlisted.
- Action flag is enabled.
- Return data format matches expected surface.
- Missing return data behavior is understood for the action.
