# Deployment Runbook

## Prep
1. Confirm target chain is listed in `doppler/script/deployments.config.toml` with:
   - `chainIds` entry
   - `create_x` (Create3 factory)
   - `doppler_hook_initializer`
   - `uniswap_v4_pool_manager`
   - `is_testnet` flag (script no-ops unless `true`)
2. Ensure the deployer wallet holds gas + permissions to broadcast via CreateX.
3. Export RPC URLs via Foundry config or environment variables.

## Script Overview
- File: `doppler/script/DeployRehypeDopplerHook.s.sol`
- Entrypoint: `DeployRehypeHookScript.run()`
- For each configured chain:
  1. `vm.selectFork(forkOf[chainId])`
  2. Guard: aborts unless `is_testnet` (remove once production-ready)
  3. Computes expected Create3 address using deployer address + static salt
  4. Invokes `ICreateX.deployCreate3` with `RehypeDopplerHook` bytecode + constructor args `(initializer, poolManager)`
  5. Verifies returned address matches deterministic expectation
  6. Writes `rehype_doppler_hook` address back into config

## Running It
```bash
forge script script/DeployRehypeDopplerHook.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --sig "run()" \
  -vvvv
```
- Optional: `--with-gas-price` for custom fee markets.
- Use `--fork-url` in dry-runs to simulate without broadcasting.

## Post-Deploy Checklist
- Record deployed address + tx hash in `doppler/Deployments.md` under the correct chain.
- Tag commit used for deployment (`git rev-parse HEAD`).
- Notify integrators: share `customFee`, beneficiary destination, and any governance requirements.
- If deploying multiple hooks, ensure unique Create3 salts or rotate `msg.sender` (salt includes deployer address).

## Rollback / Redeploy
- Since Create3 is deterministic, redeploying with identical salt overwrites contract code only if factory supports it. Usually a new salt is required; coordinate with protocol leads before attempting.
- To retire an instance, update `initializer.setDopplerHookState` to remove flags and redeploy with the corrected bytecode, then re-register.

## Verification & Monitoring
- Verify source via `forge verify-contract` once published.
- Monitor `getHookFees` and `beneficiaryFees` after first swaps to confirm the hook is wired correctly.
- Track script output logs (it prints `rehypeDopplerHook deployed to:`) in release notes.
