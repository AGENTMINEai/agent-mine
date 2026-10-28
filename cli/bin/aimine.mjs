#!/usr/bin/env node
/**
 * aimine — Agent Mine command line.
 *
 * Zero dependencies. Reads BSC directly over HTTPS (no proxy) and signs through
 * the Binance Agentic Wallet CLI (`baw`), which needs the proxy env vars for the
 * Binance backend.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import http from "node:http";
import { spawnSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VERSION = "1.0.0";
const CHAIN_ID = 56;
const BINANCE_CHAIN_ID = "56";
const AGENT_ID_REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";

const RPCS = [
  process.env.AIMINE_RPC,
  "https://bsc-dataseed1.bnbchain.org",
  "https://bsc.blockrazor.xyz",
  "https://bsc.publicnode.com",
].filter(Boolean);

const SEL = {
  approve: "0x095ea7b3",
  allowance: "0xdd62ed3e",
  balanceOf: "0x70a08231",
  decimals: "0x313ce567",
  stake: "0xa694fc3a",
  unstake: "0x2e17de78",
  mine: "0x99f4b251",
  claimRig: "0x53add457",
  pendingOf: "0xf44136a1",
  poolState: "0x641ad8a9",
  rigInfo: "0x4d50713e",
  hasAgentId: "0x4eab3ef2",
  taxToken: "0x1fc928ae",
  minStake: "0x375b3c0a",
  maxRigs: "0x8742673c",
  dripWindow: "0x5287be1c",
};

// ---------------------------------------------------------------------------
// Tiny utilities
// ---------------------------------------------------------------------------

const nowIso = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    } else out._.push(a);
  }
  return out;
}

function loadConfig() {
  const files = [
    path.join(process.cwd(), ".aimine.json"),
    path.join(os.homedir(), ".aimine.json"),
  ];
  let cfg = {};
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    try {
      cfg = { ...cfg, ...JSON.parse(fs.readFileSync(f, "utf8")) };
    } catch {
      /* ignore malformed config */
    }
  }
  return cfg;
}

function saveConfig(cfg) {
  const target = path.join(process.cwd(), ".aimine.json");
  fs.writeFileSync(target, JSON.stringify(cfg, null, 2) + "\n");
  return target;
}

function pad64(hexNo0x) {
  return hexNo0x.replace(/^0x/, "").padStart(64, "0");
}

function encodeAddress(addr) {
  return pad64(addr.toLowerCase());
}

function encodeUint(v) {
  return BigInt(v).toString(16).padStart(64, "0");
}

function word(hex, i) {
  const body = hex.replace(/^0x/, "");
  return "0x" + body.slice(i * 64, (i + 1) * 64);
}

const toBig = (hex) => BigInt(hex === "0x" ? 0 : hex);
const toAddr = (hex) => "0x" + hex.replace(/^0x/, "").slice(24);
const toBool = (hex) => toBig(hex) !== 0n;

function addCommas(s) {
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatUnits(v, decimals = 18, dp = 6) {
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const s = abs.toString().padStart(decimals + 1, "0");
  const int = s.slice(0, s.length - decimals);
  let frac = s.slice(s.length - decimals, s.length - decimals + dp).replace(/0+$/, "");
  if (frac.length === 0) frac = "";
  return `${neg ? "-" : ""}${addCommas(int)}${frac ? "." + frac : ""}`;
}

function parseUnits(str, decimals = 18) {
  const s = String(str).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error(`invalid amount: ${str}`);
  const [i, f = ""] = s.split(".");
  if (f.length > decimals) throw new Error(`too many decimals (max ${decimals})`);
  return BigInt(i) * 10n ** BigInt(decimals) + BigInt(f.padEnd(decimals, "0") || "0");
}

function short(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
}

// ---------------------------------------------------------------------------
// JSON-RPC (direct, no proxy — BSC RPC is reachable without one)
// ---------------------------------------------------------------------------

function httpJson(url, body) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const data = JSON.stringify(body);
    const req = lib.request(
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(data),
        },
        timeout: 15000,
      },
      (res) => {
        let buf = "";
        res.on("data", (d) => (buf += d));
        res.on("end", () => {
          try {
            resolve(JSON.parse(buf));
          } catch {
            reject(new Error(`bad RPC response: ${buf.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("RPC timeout")));
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

let activeRpc = RPCS[0];

async function rpc(method, params) {
  let lastErr;
  for (const url of [activeRpc, ...RPCS.filter((u) => u !== activeRpc)]) {
    try {
      const res = await httpJson(url, { jsonrpc: "2.0", id: 1, method, params });
      if (res.error) throw new Error(res.error.message || JSON.stringify(res.error));
      activeRpc = url;
      return res.result;
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`all RPCs failed: ${lastErr?.message}`);
}

async function ethCall(to, data) {
  return rpc("eth_call", [{ to, data }, "latest"]);
}

async function getCode(addr) {
  return rpc("eth_getCode", [addr, "latest"]);
}

async function waitForReceipt(hash, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await rpc("eth_getTransactionReceipt", [hash]);
    if (r) return r;
    await sleep(1500);
  }
  return null;
}

// ---------------------------------------------------------------------------
// baw bridge
// ---------------------------------------------------------------------------

function baw(args) {
  const env = { ...process.env };
  if (!env.NODE_USE_ENV_PROXY) env.NODE_USE_ENV_PROXY = "1";

  const isWin = process.platform === "win32";
  const res = spawnSync("baw", args, {
    encoding: "utf8",
    env,
    shell: isWin, // resolves baw.cmd on Windows
    maxBuffer: 16 * 1024 * 1024,
  });

  if (res.error) {
    throw new Error(
      `cannot run baw (${res.error.code || res.error.message}). Install it with: npm i -g @binance/agentic-wallet`
    );
  }
  const out = (res.stdout || "").trim();
  if (!out) {
    throw new Error(`baw ${args[0]} returned nothing. stderr: ${(res.stderr || "").trim()}`);
  }
  try {
    return JSON.parse(out);
  } catch {
    throw new Error(`baw ${args[0]} returned non-JSON: ${out.slice(0, 300)}`);
  }
}

function walletAddress() {
  if (process.env.AIMINE_WALLET) return process.env.AIMINE_WALLET;
  const res = baw(["wallet", "address", "--json"]);
  if (!res.success) throw new Error(res.error?.message || "baw wallet address failed");
  const list = res.data?.addresses || [];
  const hit =
    list.find((a) => String(a.binanceChainId) === BINANCE_CHAIN_ID) ||
    list.find((a) => /bnb/i.test(a.chainName || ""));
  if (!hit?.address) throw new Error("no BSC address in this Agentic Wallet");
  return hit.address;
}

function previewAndExecute({ to, data, value = 0n, from, dry = false }) {
  const preview = baw([
    "contract-call",
    "preview",
    "--binanceChainId",
    BINANCE_CHAIN_ID,
    "--from",
    from,
    "--to",
    to,
    "--value",
    BigInt(value).toString(),
    "--inputData",
    data,
    "--json",
  ]);

  if (!preview.success) {
    const err = preview.error || {};
    const detail = err.data ? JSON.stringify(err.data) : "";
    throw new Error(`preview rejected: [${err.code || "?"}] ${err.message || "unknown"} ${detail}`.trim());
  }

  const d = preview.data;
  const info = {
    requestId: d.requestId,
    requireConfirmation: !!d.requireConfirmation,
    gasLimit: d.gasLimit ?? null,
    risks: d.risks?.riskDetails || [],
    addressRisks: d.risks?.addresses || {},
  };

  if (dry) return { ...info, dry: true };

  const exec = baw(["contract-call", "execute", "--requestId", info.requestId, "--json"]);
  if (!exec.success) {
    const err = exec.error || {};
    throw new Error(`execute failed: [${err.code || "?"}] ${err.message || "unknown"}`);
  }

  return {
    ...info,
    orderId: exec.data?.orderId,
    status: exec.data?.status,
    txHash: exec.data?.txHash,
    message: exec.data?.message,
  };
}

async function sendAndWait(opts) {
  const out = previewAndExecute(opts);
  if (out.dry) return out;
  if (out.status === "PENDING_CONFIRMATION") {
    return out; // user must tap in the Binance App
  }
  if (out.txHash) {
    const receipt = await waitForReceipt(out.txHash);
    out.receipt = receipt
      ? { status: receipt.status, blockNumber: Number(BigInt(receipt.blockNumber)) }
      : null;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Chain reads
// ---------------------------------------------------------------------------

async function readDecimals(token) {
  try {
    return Number(toBig(await ethCall(token, SEL.decimals)));
  } catch {
    return 18;
  }
}

async function readStatus(cfg) {
  const vault = cfg.vault;
  const token = cfg.token;
  const from = cfg.wallet;

  const [agentIdBal, tokenBal, allowance, rigInfo, poolRaw, decimals, taxToken, minStake, maxRigs, dripWindow] =
    await Promise.all([
      ethCall(cfg.registry || AGENT_ID_REGISTRY, SEL.balanceOf + encodeAddress(from)),
      ethCall(token, SEL.balanceOf + encodeAddress(from)),
      ethCall(token, SEL.allowance + encodeAddress(from) + encodeAddress(vault)),
      ethCall(vault, SEL.rigInfo + encodeAddress(from)),
      ethCall(vault, SEL.poolState),
      readDecimals(token),
      ethCall(vault, SEL.taxToken),
      ethCall(vault, SEL.minStake),
      ethCall(vault, SEL.maxRigs),
      ethCall(vault, SEL.dripWindow),
    ]);

  return {
    wallet: from,
    agentId: toBig(agentIdBal),
    token: {
      address: token,
      balance: toBig(tokenBal),
      allowance: toBig(allowance),
      decimals,
    },
    rig: {
      id: Number(toBig(word(rigInfo, 0))),
      staked: toBig(word(rigInfo, 1)),
      hash: toBig(word(rigInfo, 2)),
      pending: toBig(word(rigInfo, 3)),
      eligible: toBool(word(rigInfo, 4)),
    },
    pool: {
      reserve: toBig(word(poolRaw, 0)),
      releasePerDay: toBig(word(poolRaw, 1)),
      totalHash: toBig(word(poolRaw, 2)),
      totalRigs: toBig(word(poolRaw, 3)),
      maxRigs: toBig(word(poolRaw, 4)),
      totalTaxReceived: toBig(word(poolRaw, 5)),
      totalMined: toBig(word(poolRaw, 6)),
      lastUpdate: toBig(word(poolRaw, 7)),
      dripWindow: toBig(word(poolRaw, 8)),
    },
    immutable: {
      taxToken: toAddr(taxToken),
      minStake: toBig(minStake),
      maxRigs: toBig(maxRigs),
      dripWindow: toBig(dripWindow),
    },
  };
}

function jsonSafe(s) {
  return JSON.parse(
    JSON.stringify(s, (_k, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdInit(args, cfg) {
  const vault = args.vault || cfg.vault;
  const token = args.token || cfg.token;
  if (!vault) fail("用法: aimine init --vault 0x矿池 --token 0x代币");

  const code = await getCode(vault);
  if (code === "0x") fail(`矿池地址没有合约代码: ${vault}`);

  const onchainToken = toAddr(await ethCall(vault, SEL.taxToken));
  const resolvedToken = token || onchainToken;
  if (token && onchainToken.toLowerCase() !== token.toLowerCase()) {
    fail(`代币不匹配：矿池绑定的是 ${onchainToken}，你传的是 ${token}`);
  }

  const next = {
    vault,
    token: resolvedToken,
    registry: args.registry || cfg.registry || AGENT_ID_REGISTRY,
    rpc: args.rpc || cfg.rpc || RPCS[1],
    chainId: CHAIN_ID,
  };
  const file = saveConfig(next);

  const out = { success: true, config: next, file };
  print(out, args, () => {
    console.log("AGENT MINE · 初始化完成");
    console.log(`  矿池    ${vault}`);
    console.log(`  代币    ${resolvedToken}`);
    console.log(`  门禁    ${next.registry}  (.ai Agent ID)`);
    console.log(`  配置    ${file}`);
    console.log("");
    console.log("下一步: aimine doctor");
  });
}

async function cmdDoctor(args, cfg) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });

  add("config", !!(cfg.vault && cfg.token), cfg.vault ? `${short(cfg.vault)}` : "缺少 .aimine.json，先跑 aimine init");

  try {
    const st = baw(["wallet", "status", "--json"]);
    add("baw session", st.success && st.data?.status === "CONNECTED", st.data?.status || "未登录");
  } catch (e) {
    add("baw session", false, e.message);
  }

  try {
    const s = baw(["wallet", "settings", "--json"]);
    add("developer mode", !!s.data?.devMode?.enabled, s.data?.devMode?.enabled ? "已开启" : "在币安 App 里开启 Developer Mode");
    const left = s.data?.devMode?.dailyLimit != null ? `${s.data.devMode.dailyLimit} USD/日` : "";
    add("devMode 限额", true, left);
    add(
      "abnormal txn",
      true,
      s.data?.abnormalTxnHandling === "NeedConfirmation"
        ? "NeedConfirmation（矿池调用命中风控时需手机确认）"
        : String(s.data?.abnormalTxnHandling)
    );
  } catch (e) {
    add("wallet settings", false, e.message);
  }

  if (cfg.vault) {
    try {
      const code = await getCode(cfg.vault);
      add("vault code", code !== "0x", code === "0x" ? "地址没有合约" : `${(code.length - 2) / 2} bytes`);
    } catch (e) {
      add("vault code", false, e.message);
    }
  }

  if (cfg.vault && cfg.token) {
    try {
      cfg.wallet = walletAddress();
      const st = await readStatus(cfg);
      add(".ai Agent ID", st.agentId > 0n, `${st.agentId} 个`);
      add("rig", st.rig.id > 0, st.rig.id > 0 ? `#${st.rig.id} 算力 ${formatUnits(st.rig.hash)}` : "还没认领，跑 aimine rig");
      add(
        "stake",
        st.rig.staked >= st.immutable.minStake,
        `${formatUnits(st.rig.staked)} / 最低 ${formatUnits(st.immutable.minStake)}`
      );
      add(
        "token balance",
        st.token.balance > 0n,
        `${formatUnits(st.token.balance, st.token.decimals)} ${short(cfg.token)}`
      );
    } catch (e) {
      add("chain read", false, e.message);
    }
  }

  const ok = checks.every((c) => c.ok);
  const out = { success: ok, checks };
  print(out, args, () => {
    console.log("AGENT MINE · 体检");
    for (const c of checks) {
      console.log(`  ${c.ok ? "✓" : "✗"} ${c.name.padEnd(16)} ${c.detail || ""}`);
    }
    console.log("");
    console.log(ok ? "全部通过，可以开挖。" : "有未通过项，先按上面的提示处理。");
  });
  if (!ok) process.exitCode = 1;
}

async function cmdStatus(args, cfg) {
  cfg.wallet = walletAddress();
  const st = await readStatus(cfg);
  const out = {
    success: true,
    ...jsonSafe(st),
    formatted: {
      pendingBnb: formatUnits(st.rig.pending),
      stakedTokens: formatUnits(st.rig.staked, st.token.decimals),
      hash: formatUnits(st.rig.hash, st.token.decimals),
      poolReserveBnb: formatUnits(st.pool.reserve),
      releasePerDayBnb: formatUnits(st.pool.releasePerDay),
      totalHash: formatUnits(st.pool.totalHash, st.token.decimals),
    },
  };
  print(out, args, () => {
    console.log("AGENT MINE · 矿机状态");
    console.log(`  钱包      ${st.wallet}`);
    console.log(`  Agent ID  ${st.agentId > 0n ? "✓ " + st.agentId + " 个" : "✗ 没有 .ai，无法启动矿机"}`);
    console.log(
      `  矿机      ${st.rig.id ? "#" + st.rig.id : "未认领"}   质押 ${formatUnits(st.rig.staked, st.token.decimals)}   算力 ${formatUnits(st.rig.hash, st.token.decimals)}`
    );
    console.log(`  待领取    ${formatUnits(st.rig.pending)} BNB`);
    console.log(
      `  矿池      ${formatUnits(st.pool.reserve)} BNB   每日释放 ${formatUnits(st.pool.releasePerDay)} BNB   全网算力 ${formatUnits(st.pool.totalHash, st.token.decimals)}`
    );
    console.log(
      `  矿机数    ${st.pool.totalRigs}/${st.pool.maxRigs}   累计税收 ${formatUnits(st.pool.totalTaxReceived)} BNB   已挖出 ${formatUnits(st.pool.totalMined)} BNB`
    );
  });
}

async function cmdPool(args, cfg) {
  const raw = await ethCall(cfg.vault, SEL.poolState);
  const pool = {
    reserve: toBig(word(raw, 0)),
    releasePerDay: toBig(word(raw, 1)),
    totalHash: toBig(word(raw, 2)),
    totalRigs: toBig(word(raw, 3)),
    maxRigs: toBig(word(raw, 4)),
    totalTaxReceived: toBig(word(raw, 5)),
    totalMined: toBig(word(raw, 6)),
    lastUpdate: toBig(word(raw, 7)),
    dripWindow: toBig(word(raw, 8)),
  };
  const out = { success: true, pool: jsonSafe(pool) };
  print(out, args, () => {
    console.log("AGENT MINE · 矿池");
    console.log(`  储备        ${formatUnits(pool.reserve)} BNB`);
    console.log(`  每日释放    ${formatUnits(pool.releasePerDay)} BNB`);
    console.log(`  释放窗口    ${Number(pool.dripWindow) / 3600} 小时`);
    console.log(`  矿机        ${pool.totalRigs}/${pool.maxRigs}`);
    console.log(`  累计税收    ${formatUnits(pool.totalTaxReceived)} BNB`);
    console.log(`  已挖出      ${formatUnits(pool.totalMined)} BNB`);
  });
}

async function cmdRig(args, cfg) {
  cfg.wallet = walletAddress();
  const out = await sendAndWait({ to: cfg.vault, data: SEL.claimRig, from: cfg.wallet });
  print({ success: true, action: "claimRig", ...jsonSafe(out) }, args, () => {
    console.log(`认领矿机 ${out.txHash ? "→ " + out.txHash : "→ " + out.status}`);
    if (out.status === "PENDING_CONFIRMATION") console.log("去币安 App 确认这笔交易。");
  });
}

async function cmdStake(args, cfg) {
  const amountStr = args._[1] || args.amount;
  if (!amountStr) fail("用法: aimine stake <代币数量>");
  cfg.wallet = walletAddress();

  const decimals = await readDecimals(cfg.token);
  const amount = parseUnits(amountStr, decimals);

  const allowance = toBig(await ethCall(cfg.token, SEL.allowance + encodeAddress(cfg.wallet) + encodeAddress(cfg.vault)));
  if (allowance < amount) {
    console.error(`授权不足，先 approve ${formatUnits(amount, decimals)} …`);
    const approveData = SEL.approve + encodeAddress(cfg.vault) + encodeUint(amount);
    const ap = await sendAndWait({ to: cfg.token, data: approveData, from: cfg.wallet });
    if (ap.status === "PENDING_CONFIRMATION") {
      print({ success: true, action: "approve", ...jsonSafe(ap) }, args, () =>
        console.log("授权需要手机确认，确认后重新运行 stake。")
      );
      return;
    }
    if (ap.receipt && ap.receipt.status !== "0x1") fail("授权交易失败");
  }

  const data = SEL.stake + encodeUint(amount);
  const out = await sendAndWait({ to: cfg.vault, data, from: cfg.wallet });
  print({ success: true, action: "stake", amount: amount.toString(), ...jsonSafe(out) }, args, () => {
    console.log(`质押 ${formatUnits(amount, decimals)} → ${out.txHash || out.status}`);
    if (out.status === "PENDING_CONFIRMATION") console.log("去币安 App 确认这笔交易。");
  });
}

async function cmdUnstake(args, cfg) {
  const amountStr = args._[1] || args.amount;
  if (!amountStr) fail("用法: aimine unstake <代币数量>");
  cfg.wallet = walletAddress();

  const decimals = await readDecimals(cfg.token);
  const amount = parseUnits(amountStr, decimals);
  const data = SEL.unstake + encodeUint(amount);
  const out = await sendAndWait({ to: cfg.vault, data, from: cfg.wallet });
  print({ success: true, action: "unstake", amount: amount.toString(), ...jsonSafe(out) }, args, () => {
    console.log(`取回 ${formatUnits(amount, decimals)} → ${out.txHash || out.status}`);
  });
}

async function cmdMine(args, cfg) {
  cfg.wallet = walletAddress();
  const pending = toBig(await ethCall(cfg.vault, SEL.pendingOf + encodeAddress(cfg.wallet)));

  if (pending === 0n) {
    print({ success: true, action: "mine", skipped: true, reason: "nothing to mine" }, args, () =>
      console.log("没有可挖的 BNB。")
    );
    return;
  }
  if (args["min-bnb"]) {
    const min = parseUnits(args["min-bnb"]);
    if (pending < min) {
      print(
        { success: true, action: "mine", skipped: true, reason: "below threshold", pending: pending.toString() },
        args,
        () => console.log(`待挖 ${formatUnits(pending)} BNB，低于阈值 ${args["min-bnb"]}，跳过。`)
      );
      return;
    }
  }

  const out = await sendAndWait({ to: cfg.vault, data: SEL.mine, from: cfg.wallet });
  print(
    { success: true, action: "mine", mined: pending.toString(), minedBnb: formatUnits(pending), ...jsonSafe(out) },
    args,
    () => {
      console.log(`挖出 ${formatUnits(pending)} BNB → ${out.txHash || out.status}`);
      if (out.status === "PENDING_CONFIRMATION") console.log("这笔被风控拦住，去币安 App 点确认。");
    }
  );
}

async function cmdWatch(args, cfg) {
  cfg.wallet = walletAddress();
  const interval = Math.max(30, Number(args.interval || 300));
  const min = parseUnits(String(args.min || "0.005"));
  let mined = 0n;
  let cycles = 0;

  console.log(
    JSON.stringify({
      event: "watch.start",
      vault: cfg.vault,
      wallet: cfg.wallet,
      intervalSeconds: interval,
      minBnb: formatUnits(min),
      at: nowIso(),
    })
  );

  const tick = async () => {
    cycles++;
    try {
      const pending = toBig(await ethCall(cfg.vault, SEL.pendingOf + encodeAddress(cfg.wallet)));
      console.log(
        JSON.stringify({
          event: "tick",
          n: cycles,
          pending: pending.toString(),
          pendingBnb: formatUnits(pending),
          at: nowIso(),
        })
      );

      if (pending >= min) {
        const out = await sendAndWait({ to: cfg.vault, data: SEL.mine, from: cfg.wallet });
        if (out.status !== "PENDING_CONFIRMATION") mined += pending;
        console.log(
          JSON.stringify({
            event: "mine",
            status: out.status,
            txHash: out.txHash || null,
            amountBnb: formatUnits(pending),
            sessionMinedBnb: formatUnits(mined),
            at: nowIso(),
          })
        );
        if (out.status === "PENDING_CONFIRMATION") {
          console.log(JSON.stringify({ event: "confirm_required", at: nowIso() }));
        }
      }
    } catch (e) {
      console.log(JSON.stringify({ event: "error", message: e.message, at: nowIso() }));
    }
    setTimeout(tick, interval * 1000);
  };

  await tick();
}

// ---------------------------------------------------------------------------
// Output + dispatch
// ---------------------------------------------------------------------------

function print(obj, args, human) {
  if (args.json) console.log(JSON.stringify(obj, null, 2));
  else human();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = loadConfig();
  if (args.vault) cfg.vault = args.vault;
  if (args.token) cfg.token = args.token;
  if (args.registry) cfg.registry = args.registry;
  if (!cfg.registry) cfg.registry = AGENT_ID_REGISTRY;

  const cmd = args._[0];

  if (!cmd || cmd === "help" || args.help) {
    console.log(`aimine ${VERSION} — 币安 Agent ID 专属矿场

  aimine init --vault 0x… --token 0x…     写入 .aimine.json
  aimine doctor                           体检：钱包 / .ai / devMode / 矿池
  aimine status                           矿机与矿池状态
  aimine pool                             只看矿池
  aimine rig                              认领矿机（需 .ai）
  aimine stake <数量>                     质押代币 → 算力
  aimine unstake <数量>                   取回质押
  aimine mine [--min-bnb 0.005]           把待挖的 BNB 提到钱包
  aimine watch [--interval 300] [--min 0.005]   代理常驻挖矿（NDJSON）

通用参数：
  --json        机器可读输出
  --dry         只预览，不广播
  --vault 0x…   覆盖矿池地址
  --token 0x…   覆盖代币地址
`);
    return;
  }

  if (cmd === "init") return cmdInit(args, cfg);
  if (cmd === "doctor") return cmdDoctor(args, cfg);

  if (!cfg.vault) fail("没有配置矿池。先运行: aimine init --vault 0x… --token 0x…");
  if (!cfg.token) fail("没有配置代币。先运行: aimine init --vault 0x… --token 0x…");

  switch (cmd) {
    case "status":
      return cmdStatus(args, cfg);
    case "pool":
      return cmdPool(args, cfg);
    case "rig":
      return cmdRig(args, cfg);
    case "stake":
      return cmdStake(args, cfg);
    case "unstake":
      return cmdUnstake(args, cfg);
    case "mine":
      return cmdMine(args, cfg);
    case "watch":
      return cmdWatch(args, cfg);
    default:
      fail(`未知命令: ${cmd}。运行 aimine help`);
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ success: false, error: e.message }));
  process.exit(1);
});
