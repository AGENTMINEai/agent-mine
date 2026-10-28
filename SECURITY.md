# Security

## Reporting a vulnerability

Please report exploitable issues privately — open a **security advisory** on this
repository, or contact [@AgentMine_ai](https://x.com/AgentMine_ai) on X. Do not open a
public issue for an unpatched vulnerability.

We will acknowledge within 48 hours and publish a fix note once a patch is deployed.

## Scope

- `contracts/contracts/FlapMiningVault.sol`
- `contracts/contracts/FlapMiningVaultFactory.sol`
- `web/` (read-only client; it never holds keys)

## Design posture

The vault deliberately has no administrative surface:

- no `owner`, no governance, no pause, no upgrade
- no `withdraw` — BNB leaves only through `mine()`
- parameters (`maxRigs`, `minStake`, `dripWindow`, registry) are fixed at deployment
- the tax token can be bound **once**, by the creator, and can never be changed or cleared
- rigs are soulbound and limited to one per wallet

The frontend cannot move funds; it only builds reads and wallet transactions.

## Known limitations

These are documented rather than hidden:

1. **Release timing depends on interactions.** `_updatePool()` runs on tax receipts,
   stake, unstake and mine. With regular tax payments it approximates continuous
   exponential decay. If the pool is completely untouched for longer than `dripWindow`,
   the next update releases the remaining reserve in one step.
2. **`.ai` is transferable.** The gate checks `balanceOf` at claim and at payout, so a
   wallet that sells its Agent ID stops earning. Rigs already claimed stay with their
   wallet and cannot be reassigned.
3. **Stake is withdrawable at any time.** There is no lock-up. Hashrate follows the stake,
   so the design relies on economic incentive rather than a lock.
4. **Not audited.** Treat the verified source as the specification and review it before
   staking.
5. **Yield is volume-dependent.** No APY is promised; when trading stops, releases decay
   toward zero.
