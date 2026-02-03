# doppler-skills

Agent Skills for working with the [Doppler Protocol](https://docs.doppler.lol) - a token launch and liquidity bootstrapping system built on Uniswap V3 and V4.

## What are Agent Skills?

Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows. They provide procedural knowledge and domain-specific context that agents can load on demand.

Learn more at [agentskills.io](https://agentskills.io)

## Installation

Add these skills to your agent using the skills CLI:

```bash
npx skills add rustydotwtf/doppler-skills
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `v3-static-auction` | Reference for Doppler V3 static auctions using UniswapV3Initializer |
| `v4-dynamic-auction` | Reference for Doppler V4 dynamic auctions with epoch-based rebalancing |
| `v4-multicurve-auction` | Reference for Doppler V4 multicurve auctions with shares-based allocation |
| `token-lifecycle` | Token creation, vesting, and inflation mechanics (DERC20, CloneDERC20) |
| `fee-architecture` | Fee collection, distribution, and configuration |
| `uniswap-fundamentals` | Uniswap protocol concepts: tick math, sqrtPriceX96, liquidity formulas, V4 hooks |
| `rehype` | Doppler's Rehype V4 hook for fee splits and buybacks |
| `verification` | Guide for verifying on-chain Doppler data using cast, viem, and RPC calls |

## Supported Agents

These skills work with any [Agent Skills compatible](https://agentskills.io) tool, including:

- Claude Code
- OpenCode
- Cursor
- VS Code (Copilot)
- Gemini CLI
- Amp
- Goose
- And more

## Usage

Once installed, your agent will automatically discover these skills based on task context. You can also explicitly request a skill:

```
"Load the v4-dynamic-auction skill and explain how epoch rebalancing works"
```

## License

See individual skill directories for license information.
