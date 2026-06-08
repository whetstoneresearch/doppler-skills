# Hook Flags

Hook flags are bitmasks stored on the launch or pool. They decide which actions invoke the hook program.

## Initializer flags
Use SDK or IDL constants for:
- `HF_BEFORE_SWAP`
- `HF_AFTER_SWAP`
- `HF_BEFORE_CREATE`
- `HF_AFTER_CREATE`
- `HF_BEFORE_MIGRATE`
- `HF_AFTER_MIGRATE`
- `HF_FORWARD_READONLY_SIGNERS`

Current Initializer swap behavior is centered on before/after swap.

## CPMM flags
Use SDK or IDL constants for CPMM hook flags.

The CPMM hook can run around:
- swaps
- add liquidity
- remove liquidity

Confirm exact flag names in the SDK or IDL version used by the customer integration before encoding transactions.
