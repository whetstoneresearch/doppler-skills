---
name: solana-hooks
description: "Integrate and verify doppler-sol external hook programs for Initializer curve swaps and CPMM swaps/liquidity actions, including cosigner-hook expiry payloads, CPI return data, and remaining-account behavior."
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Consumer Source of Truth**: Use SDK/IDL constants and deployed hook configuration for flags, account order, and return-data decoding.

# Solana Hooks

## When to use
- You are integrating an external policy hook for a Solana Doppler launch or CPMM pool.
- You need to reason about Initializer hook flags or CPMM hook flags.
- You need to configure or debug cosigner hook gating.
- A swap or liquidity operation fails due to CPI return data or missing remaining accounts.

## Mental model
Hooks are Solana-native external programs invoked by CPI. They receive a serialized context and return policy decisions through Solana return data.

This is the closest Solana analog to EVM hook extensibility, but it is not a Uniswap v4 hook model.

## Core workflow
1. Confirm the hook program is allowlisted in the relevant on-chain config.
2. Store the hook program id and flags on the launch or pool.
3. Pass the hook program account and any hook-specific remaining accounts to the user instruction.
4. Decode the hook context and return data when debugging.
5. Verify whether the path fails open or fails closed for missing return data.

## Quick facts
| Surface | Actions |
|---|---|
| Initializer | curve swap hook before/after swap, plus create/migrate hook flags for configured flows |
| CPMM | before/after swap, add liquidity, remove liquidity |
| Return data | `allow` plus optional fee override fields depending on surface |
| Initializer missing return data | tolerated as allow/no change |
| CPMM before-action missing return data | error when hook is enabled |
| CPMM after-action missing return data | tolerated |
| Cosigner hooks | Empty payload keeps signature gating active until migration; 42-byte payload can expire by timestamp or slot |

## Failure modes
- Hook program not allowlisted at configuration time.
- Hook account omitted even though stored launch/pool config requires it.
- Remaining accounts not forwarded in the order expected by the hook.
- Treating an empty cosigner payload as an expired gate; it is the legacy signature-required mode.
- Hashing the wrong cosigner remaining-account list; expiring cosigner launches commit to `[namespace, cosigner_config, cosigner]`.
- Assuming Initializer and CPMM missing-return-data behavior is identical.
- Treating Initializer hook fee overrides as persistent configuration.

## References
- [RETURN-DATA.md](references/RETURN-DATA.md)
- [FLAGS.md](references/FLAGS.md)
- [REMAINING-ACCOUNTS.md](references/REMAINING-ACCOUNTS.md)

## Related skills
- [solana-launch-initializer](../solana-launch-initializer/SKILL.md)
- [solana-cpmm](../solana-cpmm/SKILL.md)
- [solana-verification](../solana-verification/SKILL.md)
