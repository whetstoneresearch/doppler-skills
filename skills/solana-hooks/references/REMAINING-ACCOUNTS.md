# Hook Remaining Accounts

Hook programs often need extra accounts beyond the core instruction account list.

## Initializer
Initializer appends `launch.hook_payload` to the serialized hook context and forwards caller-supplied remaining accounts into the hook CPI.

For the cosigner hook, the committed swap remaining-account list is:

```text
[namespace, cosigner_config, cosigner]
```

- `namespace` is the launch namespace stored on the launch.
- `cosigner_config` is the PDA derived from seed `cosigner_hook_config` under the selected cosigner hook program.
- `cosigner` is the configured cosigner pubkey. Before expiry it must be a readonly signer. After expiry it can be passed readonly without a signature, but it is still part of the committed account list.

Cosigner hook integrations should derive the config PDA under the selected hook program id from the deployment configuration.

## CPMM
CPMM expects the hook program account in the instruction accounts and forwards additional remaining accounts to the hook CPI, excluding signer and denied accounts.

## Debugging
If a hook unexpectedly rejects or returns no data:
- verify the stored hook program id
- verify the action flag is enabled
- verify the hook program account is present
- verify each expected policy account is present and ordered correctly
- for cosigner hooks, verify the hash was computed over `[namespace, cosigner_config, cosigner]`
- check whether the current action fails open or fail closed on missing return data
