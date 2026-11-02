export const AGENT_ID_ADDRESS =
  (process.env.NEXT_PUBLIC_AGENT_ID ??
    "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F") as `0x${string}`;

export const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_VAULT ?? "") as `0x${string}`;
export const TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN ?? "") as `0x${string}`;

export const SITE = {
  name: "AI矿工",
  domain: "agentmine.online",
  title: "AI矿工 · AI MINER — Agent-ID mining on BNB Chain",
  description:
    "AI矿工 (AI MINER) turns trading tax into a mining pool: only wallets holding a Binance .ai Agent ID can claim a rig, and their agent mines the tax around the clock. No admin, no withdrawal — tax can only be mined.",
  registry: AGENT_ID_ADDRESS,
  vault: VAULT_ADDRESS,
  token: TOKEN_ADDRESS,
  maxRigs: Number(process.env.NEXT_PUBLIC_MAX_RIGS ?? 260),
  minStakeLabel: process.env.NEXT_PUBLIC_MIN_STAKE_LABEL ?? "100,000",
  dripWindowHours: Number(process.env.NEXT_PUBLIC_DRIP_HOURS ?? 24),
  x: process.env.NEXT_PUBLIC_X ?? "https://x.com/AgentMine_ai",
  github: process.env.NEXT_PUBLIC_GITHUB ?? "https://github.com/AGENTMINEai/agent-mine",
  docs: "/docs",
  mine: "/mine",
  bscScan: "https://bscscan.com",
} as const;

export const isConfigured = Boolean(SITE.vault);

export const NETWORK_LABEL = "BSC · 56";
