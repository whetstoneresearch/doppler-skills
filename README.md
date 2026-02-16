# doppler-skills

Agent Skills for working with the [Doppler Protocol](https://docs.doppler.lol), sourced from the canonical [`whetstoneresearch/doppler`](https://github.com/whetstoneresearch/doppler) repository.

## What are Agent Skills?

Agent Skills are a lightweight format for extending AI agents with reusable workflows and domain-specific knowledge.

Learn more at [agentskills.io](https://agentskills.io).

## Installation

```bash
npx skills add rustydotwtf/doppler-skills
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `v3-static-auction` | Doppler V3 static auctions (`UniswapV3Initializer`, `LockableUniswapV3Initializer`) |
| `v4-dutch-auction` | Doppler V4 Dutch auctions (`Doppler`) with epoch-based rebalancing |
| `v4-dynamic-auction` | Compatibility alias that redirects to `v4-dutch-auction` |
| `v4-multicurve-auction` | Doppler V4 multicurve auctions (base, scheduled, and decay variants) |
| `doppler-hook-initializer` | Hook-enabled multicurve lifecycle with `DopplerHookInitializer` |
| `proceeds-split-migration` | Migration-time proceeds splits (`ProceedsSplitter`, `TopUpDistributor`, V4 split migrator) |
| `token-lifecycle` | Token creation, vesting, inflation, and factory selection |
| `fee-architecture` | Fee collection and distribution across Airlock, hooks, and lockers |
| `uniswap-fundamentals` | Doppler-focused Uniswap V3/V4 math and architecture concepts |
| `rehype` | Rehype hook operations: buybacks, distributions, and owner-fee claims |
| `verification` | On-chain verification and debugging with cast/viem/RPC/explorers |

## Usage

Skills are auto-discovered by context, or you can request one explicitly:

```text
"Load v4-dutch-auction and explain how epoch rebalancing decides tick movement"
```

## Notes

- `v4-dutch-auction` is the canonical V4 dynamic auction skill.
- `v4-dynamic-auction` is retained for backward compatibility.
- Active guidance is V3/V4-focused unless explicitly requested otherwise.

## License

See individual skill directories for license information.
