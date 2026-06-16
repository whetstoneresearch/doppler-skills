# Support Evidence

For customer and integrator support, avoid copying command lists from `doppler-sol`; those are contributor tooling and can drift faster than the protocol interface.

Prefer stable verification surfaces:
- SDK fetch/decode helpers for launch, CPMM, migrator, and oracle accounts
- generated IDLs for instruction arguments and account layouts
- RPC transaction logs for CPI failures and custom errors
- SPL token account balances for vault, recipient, and user balance checks
- explorer or indexer data for customer-facing transaction evidence

Use raw RPC or CLI account reads only when SDK decoding is unavailable or when checking account owner, lamports, or raw bytes.

If the issue requires changing protocol source, switch to the current protocol repo docs or CI for contributor commands instead of relying on this skill.
