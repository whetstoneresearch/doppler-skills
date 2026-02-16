# Fee Distribution

Protocol and integrator fee split during migration.

---

## Overview

When a Doppler pool migrates, LP fees are split between:
1. **Protocol (Whetstone)**: Base fee for using the protocol
2. **Integrator**: Front-end or service that facilitated the launch

---

## Fee Calculation

The `_handleFees()` function in Airlock determines the split:

```solidity
function _handleFees(address token, address integrator, uint256 balance, uint256 fees) internal {
    if (fees > 0) {
        // Option A: 5% of trading fees
        uint256 protocolLpFees = fees / 20;

        // Option B: 0.1% of proceeds (balance minus fees)
        uint256 protocolProceedsFees = (balance - fees) / 1000;

        // Take the larger of the two
        uint256 protocolFees = Math.max(protocolLpFees, protocolProceedsFees);

        // Cap at 20% of trading fees
        uint256 maxProtocolFees = fees / 5;

        if (protocolFees > maxProtocolFees) {
            integratorFees = fees - maxProtocolFees;
            protocolFees = maxProtocolFees;
        } else {
            integratorFees = fees - protocolFees;
        }

        getProtocolFees[token] += protocolFees;
        getIntegratorFees[integrator][token] += integratorFees;
    }
}
```

[Source: Airlock.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 237-252)

---

## Fee Rates

| Calculation | Rate | Description |
|-------------|------|-------------|
| Protocol LP fee | `fees / 20` | 5% of trading fees |
| Protocol proceeds fee | `(balance - fees) / 1000` | 0.1% of proceeds |
| Max protocol cap | `fees / 5` | 20% of trading fees |

**Algorithm**:
```
protocolFees = min(max(5% of fees, 0.1% of proceeds), 20% of fees)
integratorFees = fees - protocolFees
```

---

## Example Scenarios

### Scenario 1: Normal Fee Distribution
- Balance: 100 ETH
- Trading fees: 1 ETH (1%)
- Proceeds: 99 ETH

```
protocolLpFees = 1 / 20 = 0.05 ETH (5% of fees)
protocolProceedsFees = 99 / 1000 = 0.099 ETH (0.1% of proceeds)
protocolFees = max(0.05, 0.099) = 0.099 ETH
maxProtocolFees = 1 / 5 = 0.2 ETH (cap not hit)
integratorFees = 1 - 0.099 = 0.901 ETH
```

### Scenario 2: High Proceeds (Cap Hit)
- Balance: 1000 ETH
- Trading fees: 1 ETH (0.1%)
- Proceeds: 999 ETH

```
protocolLpFees = 1 / 20 = 0.05 ETH
protocolProceedsFees = 999 / 1000 = 0.999 ETH
protocolFees = max(0.05, 0.999) = 0.999 ETH
maxProtocolFees = 1 / 5 = 0.2 ETH (CAP HIT)
protocolFees = 0.2 ETH (capped)
integratorFees = 1 - 0.2 = 0.8 ETH
```

---

## Migration Flow

```
1. Airlock.migrate(asset) called
   │
2. poolInitializer.exitLiquidity(pool)
   │ Returns: sqrtPriceX96, token0, fees0, balance0, token1, fees1, balance1
   │
3. _handleFees(token0, integrator, balance0, fees0)
   │ Splits fees between protocol and integrator
   │
4. _handleFees(token1, integrator, balance1, fees1)
   │ Splits fees between protocol and integrator
   │
5. Transfer remaining balances to liquidityMigrator
   │
6. liquidityMigrator.migrate(...)
```

[Source: Airlock.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 194-226)

---

## Collecting Fees

### Protocol Fees (Owner Only)

```solidity
function collectProtocolFees(address to, address token, uint256 amount) external onlyOwner {
    getProtocolFees[token] -= amount;
    ERC20(token).safeTransfer(to, amount);
}
```

[Source: Airlock.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 278-288)

### Integrator Fees (Integrator Only)

```solidity
function collectIntegratorFees(address to, address token, uint256 amount) external {
    getIntegratorFees[msg.sender][token] -= amount;
    ERC20(token).safeTransfer(to, amount);
}
```

[Source: Airlock.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 296-306)

---

## Integrator Assignment

The integrator is set during `Airlock.create()`:

```solidity
// If no integrator specified, protocol owner becomes integrator
integrator: createData.integrator == address(0) ? owner() : createData.integrator
```

[Source: Airlock.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 182)

---

## Fee Storage

```solidity
// Protocol's accumulated fees per token
mapping(address token => uint256 amount) public getProtocolFees;

// Integrator's accumulated fees per token
mapping(address integrator => mapping(address token => uint256 amount)) public getIntegratorFees;
```

[Source: Airlock.sol](https://raw.githubusercontent.com/whetstoneresearch/doppler/46bad16d/src/Airlock.sol) (lines 121-122)
