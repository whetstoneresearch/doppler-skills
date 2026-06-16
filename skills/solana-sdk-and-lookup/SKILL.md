---
name: solana-sdk-and-lookup
description: "Use doppler-sol IDLs and the published TypeScript SDK for address derivation, account decoding, launch discovery, migrator payload encoding, and RPC lookup patterns."
license: MIT
metadata:
  author: doppler
  version: "1.0"
---

> **Consumer Source of Truth**: Use the published `@whetstone-research/doppler-sdk` package and generated IDLs. Do not copy deployed addresses or rely on repo-local scripts as an integration API.

# Solana SDK and Lookup

## When to use
- You need to derive Doppler Solana addresses from known inputs.
- You need to fetch or decode launch, CPMM, or migrator accounts.
- You need to build initializer or migrator payloads with the SDK or IDLs.
- You are looking for an asset-keyed EVM helper equivalent.

## Core workflow
1. Use SDK address helpers before manual seed assembly.
2. Use account discriminators plus memcmp filters for discovery.
3. Decode accounts with SDK codecs before making behavioral claims.
4. Use published SDK helpers or IDL-generated clients to build initializer payloads.
5. Treat mint-key lookup as indexer/discovery work, not direct PDA derivation.

## Quick facts
| Need | SDK area |
|---|---|
| Initializer addresses | published `@whetstone-research/doppler-sdk/solana` initializer helpers |
| Launch fetch/decode | published SDK initializer helpers or IDL-generated clients |
| CPMM core helpers | published SDK Solana exports and `idl/*/cpmm.json` |
| CPMM migrator payloads | published SDK Solana exports and `idl/*/cpmm_migrator.json` |
| Launch id helper | `launchIdFromU64` |
| Account discovery | `getProgramAccounts` with discriminator filters |

## Failure modes
- Searching for launch state by base mint only.
- Passing a non-32-byte `launch_id`.
- Building migrator payloads manually and exceeding `MAX_PAYLOAD`.
- Forgetting account discriminator offset `0`.
- Using stale SDK or IDL versions.

## References
- [LOOKUP.md](references/LOOKUP.md)
- [SDK-SURFACE.md](references/SDK-SURFACE.md)
- [PAYLOADS.md](references/PAYLOADS.md)

## Related skills
- [solana-launch-initializer](../solana-launch-initializer/SKILL.md)
- [solana-cpmm](../solana-cpmm/SKILL.md)
- [solana-cpmm-migration](../solana-cpmm-migration/SKILL.md)
- [solana-verification](../solana-verification/SKILL.md)
