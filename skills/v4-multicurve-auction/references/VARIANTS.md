# Multicurve Variants

## Base variant
- Contract: `src/initializers/UniswapV4MulticurveInitializer.sol`
- Use when launch does not need start-time gating or decaying LP fee schedule.

## Scheduled variant
- Contracts:
  - `src/initializers/UniswapV4ScheduledMulticurveInitializer.sol`
  - `src/initializers/UniswapV4ScheduledMulticurveInitializerHook.sol`
- Adds `startingTime` in init data and enforces schedule via hook state.

## Decay variant
- Contracts:
  - `src/initializers/DecayMulticurveInitializer.sol`
  - `src/initializers/DecayMulticurveInitializerHook.sol`
- Uses dynamic fee flag and linear fee descent (`startFee -> fee`) over `durationSeconds`.
- Enforces `startFee >= fee` and caps fee with `MAX_LP_FEE` in the initializer path.

## Test anchors
- `test/integration/V4MulticurveInitializer.t.sol`
- `test/integration/V4ScheduledMulticurveInitializer.t.sol`
- `test/integration/V4DecayMulticurveInitializer.t.sol`
- `test/integration/DecayMulticurveInitializer.t.sol`
