---
name: token-lifecycle
description: Reference for Doppler token creation, vesting, and inflation mechanics. Covers DERC20 and CloneDERC20 implementations, linear vesting schedules, and capped inflation.
metadata:
  author: doppler
  version: "1.0"
---

> **Source References**: Code citations link to raw GitHub files pinned to commit `988dab4`. To fetch specific lines: `curl -s "<url>" | sed -n 'START,ENDp'`

# Token Lifecycle

Reference for Doppler token creation, vesting, and inflation mechanics.

---

## Overview

Doppler tokens are ERC20 tokens with built-in:
- **Vesting**: Linear release of pre-allocated tokens over time
- **Inflation**: Capped yearly minting controlled by owner
- **Pool locking**: Prevents transfers to pool until unlocked

Two token implementations exist:
- **DERC20**: Standard deployment with voting rights (20% max vesting)
- **CloneERC20**: Gas-efficient clone deployment (80% max vesting)

---

## Quick Facts

| Property | DERC20 | CloneERC20 |
|----------|--------|------------|
| Max vesting per address | 20% | 80% |
| Max total vesting | 20% | 80% |
| Max yearly inflation | 2% | 2% |
| Voting rights | Yes (ERC20Votes) | No |
| Permit support | Yes (ERC2612) | No |
| Deployment cost | Higher (full bytecode) | Lower (ERC1167 proxy) |

---

## Key Contracts

| Contract | Purpose | Source |
|----------|---------|--------|
| `DERC20` | Full-featured token with voting | `src/tokens/DERC20.sol` |
| `CloneERC20` | Gas-efficient cloneable token | `src/tokens/CloneERC20.sol` |
| `TokenFactory` | Deploys DERC20 via CREATE2 | `src/tokens/TokenFactory.sol` |
| `CloneERC20Factory` | Deploys CloneERC20 via ERC1167 | `src/tokens/CloneERC20Factory.sol` |

---

## Common Tasks

### Check vesting status
```solidity
VestingData memory data = token.getVestingDataOf(account);
uint256 available = token.computeAvailableVestedAmount(account);
```

### Claim vested tokens
```solidity
token.release(); // Claims all available vested tokens to msg.sender
```

### Mint inflation (owner only)
```solidity
token.mintInflation(); // Mints accumulated inflation to owner
```

---

## References

- [VESTING.md](references/VESTING.md) - Vesting mechanics and formulas
- [FACTORIES.md](references/FACTORIES.md) - Token factory deployment patterns

---

## Related Skills

- [fee-architecture](../fee-architecture/SKILL.md) - Fee collection from token pools
- [v4-multicurve-auction](../v4-multicurve-auction/SKILL.md) - Locked pools with beneficiaries
