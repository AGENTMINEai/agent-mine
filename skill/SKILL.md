---
name: agent-mine
description: |
  Use when the user wants to mine BNB from an Agent Mine tax pool on BNB Chain — claim a mining rig,
  stake the project token for hashrate, claim mined BNB, or keep an agent running as an autonomous miner.
  Only Binance Agentic Wallets that hold a .ai Agent ID can mine.
  Triggers: 挖矿, 矿机, 矿池, 税收挖矿, agent mine, mine, mining rig, claim rig, hashrate, 算力, 质押挖矿,
  stake and mine, auto mine, 代理挖矿, 帮我挖, aimine.
metadata:
  author: agentmine
  version: '1.0.0'
  requires:
    bins: [baw, node]
  install:
    - kind: node
      package: '@binance/agentic-wallet'
      bins: [baw]
      label: Binance Agentic Wallet CLI
    - kind: script
      script: cli/install.mjs
      label: agent-mine skill + aimine CLI
---

# Agent Mine

Agent Mine is a FLAP tax vault that pays out **only to Binance Agentic Wallets holding a `.ai` Agent ID**, and only as
**mining rewards** — the contract has no owner, no pause, and no withdrawal function. Tax BNB can leave it one way:
someone mines it.

The user's agent *is* the miner. This skill drives the `aimine` CLI, which reads BSC directly and signs through `baw`.

Read [references/mining.md](references/mining.md) before explaining the economics.

---

## Command routing

| User intent | Command |
|---|---|
| Set up / connect a vault | `aimine init --vault <vault> --token <token>` |
| "Am I ready to mine?" / any error | `aimine doctor` |
| My rig, my hashrate, what I can claim | `aimine status` |
| Pool size, daily release, rig count | `aimine pool` |
| Claim my rig (needs `.ai`) | `aimine rig` |
| Stake tokens for hashrate | `aimine stake <amount>` |
| Take tokens back | `aimine unstake <amount>` |
| Mine once | `aimine mine [--min-bnb 0.005]` |
| Mine continuously (agent mode) | `aimine watch --interval 300 --min 0.005` |

Add `--json` for machine-readable output. Add `--dry` to preview a transaction without broadcasting.

---

## First run

```bash
git clone https://github.com/AGENTMINEai/agent-mine.git
node agent-mine/cli/install.mjs      # installs this skill + the aimine bin
aimine init --vault 0x… --token 0x…
aimine doctor
```

`aimine doctor` must be all-green before anything else. Typical blockers:

| Symptom | Fix |
|---|---|
| `baw session` not CONNECTED | `baw auth signin`, confirm in the Binance App |
| `developer mode` off | Binance App → Wallet → Agentic Wallet → Settings → Developer Mode |
| `.ai Agent ID` is 0 | The wallet has no `.ai` — this product cannot be used with it |
| `rig` not claimed | `aimine rig` |
| `stake` below minimum | `aimine stake <at least minStake>` |

---

## Hard rules

- **Never send BNB to the vault address directly.** `receive()` treats every transfer as tax for all miners; a manual
  transfer is a donation to the pool, not a deposit for the sender.
- **The vault cannot be upgraded, paused, or drained.** Do not promise the user any recovery path; there is none.
- **Hashrate is exactly the staked token balance.** Never invent multipliers, boosts, or APY. Quote only
  `aimine status --json` numbers.
- **Do not unstake below `minStake` without saying so first.** It does not lose mined rewards, but hashrate drops to 0
  and the rig stops earning.
- **Mining requires the `.ai` at claim time.** If the user transfers or sells the Agent ID, `mine` reverts until they
  hold one again. Pending rewards are not lost.
- **Spending is a user decision.** Never choose an amount to stake yourself; ask, then execute.
- **One rig per wallet, soulbound.** It cannot be transferred, sold, or duplicated. Do not try.
- **Respect the wallet limits.** `baw` Developer Mode has a daily USD quota; mining every 30s can burn it. Default to
  `--interval 300` and `--min 0.005` BNB.
- **A `PENDING_CONFIRMATION` status is not a failure.** It means Binance risk review wants a tap in the App. Tell the
  user to confirm; do not retry in a loop.
- **Report real numbers and the tx hash.** No slogans, no projected returns.

---

## The mining loop (what the agent should do)

1. `aimine doctor --json` — stop and report if anything fails.
2. `aimine status --json`:
   - `rig.id == 0` → run `aimine rig`, then re-read.
   - `rig.staked < immutable.minStake` → tell the user the minimum and ask how much to stake.
3. `aimine watch --interval 300 --min 0.005` — emits NDJSON, one event per line:
   - `tick` — pending balance each cycle
   - `mine` — broadcast result + tx hash
   - `confirm_required` — needs a tap in the Binance App
   - `error` — surface the message, keep the loop alive
4. Every few hours, summarize: mined this session, current hashrate, pool reserve, what changed.

`watch` never exits on its own. Stop it when the user asks.

---

## Talking to the user

- Lead with mined BNB and the tx hash, then hashrate and pool state.
- If the user asks "how much will I earn", give the live inputs instead of a promise:
  pool reserve, daily release, the user's hashrate, total hashrate. Let them do the division.
- If volume dries up, the pool drains and rewards go to zero. Say that plainly when asked.

---

## Errors

`aimine` prints `{ "success": false, "error": "…" }` on failure. Common causes:

| Error | Meaning |
|---|---|
| `preview rejected: [351803] High risk transaction` | Binance risk engine blocked it; nothing was sent |
| `preview rejected: [351805]` + gas wording | Simulation ran out of gas; report it, do not retry blindly |
| `Vault__NoAgentId` | No `.ai` at claim time |
| `Vault__NoRig` | Run `aimine rig` first |
| `Vault__BelowMinStake` | Stake is below the vault minimum |
| `Vault__NothingToMine` | Pending is 0; wait for the pool to drip |
| `Vault__SoldOut` | Rig cap reached; mining is closed for new wallets |
| `PENDING_CONFIRMATION` | Tap confirm in the Binance App |
