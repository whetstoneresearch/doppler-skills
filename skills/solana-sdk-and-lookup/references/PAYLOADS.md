# SDK Payload Rules

Initializer stores hook and migrator payloads in fixed buffers.

Limits:
- `MAX_PAYLOAD = 256`
- unused bytes are zeroed by program-side buffer handling

Use published SDK encoders or IDL-generated clients when available.

## Cosigner hook expiry payload

The cosigner hook recognizes only these hook payload shapes:

| Shape | Meaning |
|---|---|
| Empty payload | Expiry disabled; cosigner signature is required while the initializer launch is trading. |
| 42-byte payload | Expiring gate with version, mode, expiry value, and cosigner hint. |

The 42-byte layout is:

```text
byte 0      = version, currently 1
byte 1      = mode, 1 for Unix timestamp or 2 for slot
bytes 2..10 = little-endian u64 expiry value
bytes 10..42 = cosigner pubkey hint
```

Invalid non-empty payloads fall back to signature-required behavior. An encoded disabled mode is not canonical; use an empty payload for no-expiry behavior.

For expiring cosigner launches, compute `hookRemainingAccountsHash` over:

```text
[namespace, cosigner_config, cosigner]
```

`cosigner_config` is the PDA derived from seed `cosigner_hook_config` under the selected cosigner hook program. The cosigner pubkey is duplicated in the payload as a public hint so clients can reconstruct the committed remaining accounts after expiry without holding the cosigner key.

Manual payload encoding is a common source of launch and migration failures. If a hook or migrator instruction fails before its business logic, check discriminator bytes, buffer length, commitment hashes, and account order first.
