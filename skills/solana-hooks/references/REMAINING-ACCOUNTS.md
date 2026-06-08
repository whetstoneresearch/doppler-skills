# Hook Remaining Accounts

Hook programs often need extra accounts beyond the core instruction account list.

## Initializer
Initializer appends `launch.hook_payload` to the serialized hook context and forwards caller-supplied remaining accounts into the hook CPI.

## CPMM
CPMM expects the hook program account in the instruction accounts and forwards additional remaining accounts to the hook CPI, excluding signer and denied accounts.

## Debugging
If a hook unexpectedly rejects or returns no data:
- verify the stored hook program id
- verify the action flag is enabled
- verify the hook program account is present
- verify each expected policy account is present and ordered correctly
- check whether the current action fails open or fail closed on missing return data
