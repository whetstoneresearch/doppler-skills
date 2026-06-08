# SDK Payload Rules

Initializer stores hook and migrator payloads in fixed buffers.

Limits:
- `MAX_PAYLOAD = 256`
- unused bytes are zeroed by program-side buffer handling

Use published SDK encoders or IDL-generated clients when available.

Manual payload encoding is a common source of launch and migration failures. If a migrator instruction fails before its business logic, check discriminator bytes, buffer length, commitment hashes, and account order first.
