"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { bsc } from "wagmi/chains";
import { parseUnits } from "viem";
import { agentIdAbi, erc20Abi, vaultAbi } from "@/lib/abi";
import { AGENT_ID_ADDRESS, SITE, isConfigured } from "@/lib/site";
import { detectWallets, setWalletPreference, type WalletChoice } from "@/lib/wagmi";

export type PoolState = {
  reserve: bigint;
  releasePerDay: bigint;
  totalHash: bigint;
  totalRigs: bigint;
  maxRigs: bigint;
  totalTaxReceived: bigint;
  totalMined: bigint;
  lastUpdate: bigint;
  dripWindow: bigint;
};

export type RigInfo = {
  rigId: bigint;
  staked: bigint;
  hash: bigint;
  pending: bigint;
  eligible: boolean;
};

function tuple<T extends Record<string, unknown>>(data: unknown, keys: (keyof T)[]): T | undefined {
  if (!data) return undefined;
  const arr = data as unknown as unknown[];
  const out = {} as Record<string, unknown>;
  keys.forEach(
    (k, i) => (out[k as string] = (data as unknown as Record<string, unknown>)[k as string] ?? arr[i])
  );
  return out as T;
}

const POOL_KEYS: (keyof PoolState)[] = [
  "reserve",
  "releasePerDay",
  "totalHash",
  "totalRigs",
  "maxRigs",
  "totalTaxReceived",
  "totalMined",
  "lastUpdate",
  "dripWindow",
];

const RIG_KEYS: (keyof RigInfo)[] = ["rigId", "staked", "hash", "pending", "eligible"];

export function useMiner() {
  const { address, isConnected, chainId } = useAccount();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const enabled = Boolean(address) && isConfigured;
  const wrongChain = isConnected && chainId !== bsc.id;

  const agentId = useReadContract({
    address: AGENT_ID_ADDRESS,
    abi: agentIdAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const poolRead = useReadContract({
    address: SITE.vault || undefined,
    abi: vaultAbi,
    functionName: "poolState",
    query: { enabled: isConfigured },
  });

  const rigRead = useReadContract({
    address: SITE.vault || undefined,
    abi: vaultAbi,
    functionName: "rigInfo",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const minStakeRead = useReadContract({
    address: SITE.vault || undefined,
    abi: vaultAbi,
    functionName: "minStake",
    query: { enabled: isConfigured },
  });

  const vaultTokenRead = useReadContract({
    address: SITE.vault || undefined,
    abi: vaultAbi,
    functionName: "taxToken",
    query: { enabled: Boolean(SITE.vault) },
  });

  const boundToken = vaultTokenRead.data as `0x${string}` | undefined;
  const tokenAddress =
    boundToken && boundToken !== "0x0000000000000000000000000000000000000000" ? boundToken : SITE.token;
  const hasToken = Boolean(tokenAddress && tokenAddress !== "0x0000000000000000000000000000000000000000");

  const tokenRead = useReadContract({
    address: tokenAddress || undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && hasToken },
  });

  const allowanceRead = useReadContract({
    address: tokenAddress || undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && SITE.vault ? [address, SITE.vault] : undefined,
    query: { enabled: Boolean(address) && hasToken && Boolean(SITE.vault) },
  });

  const decimalsRead = useReadContract({
    address: tokenAddress || undefined,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: hasToken },
  });

  const decimals = decimalsRead.data ?? 18;
  const pool = useMemo(() => tuple<PoolState>(poolRead.data, POOL_KEYS), [poolRead.data]);
  const rig = useMemo(() => tuple<RigInfo>(rigRead.data, RIG_KEYS), [rigRead.data]);
  const minStake = (minStakeRead.data as bigint | undefined) ?? 0n;

  const hasAgentId = (agentId.data as bigint | undefined ?? 0n) > 0n;

  const connect = useCallback(
    async (choice: WalletChoice) => {
      setError(null);
      try {
        setWalletPreference(choice);
        const connector = connectors[0];
        if (!connector) throw new Error("没有检测到钱包");
        await connectAsync({ connector });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [connectAsync, connectors]
  );

  const ensureChain = useCallback(async () => {
    if (wrongChain) await switchChainAsync({ chainId: bsc.id });
  }, [switchChainAsync, wrongChain]);

  const run = useCallback(
    async (label: string, fn: () => Promise<`0x${string}`>) => {
      setError(null);
      setStatus(`${label}：等待钱包确认…`);
      try {
        await ensureChain();
        const hash = await fn();
        setStatus(`${label}：已广播 ${hash.slice(0, 10)}…`);
        return hash;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.length > 240 ? msg.slice(0, 240) + "…" : msg);
        setStatus(null);
        throw e;
      }
    },
    [ensureChain]
  );

  const claimRig = useCallback(
    () =>
      run("认领矿机", () =>
        writeContractAsync({ address: SITE.vault, abi: vaultAbi, functionName: "claimRig" })
      ),
    [run, writeContractAsync]
  );

  const stake = useCallback(
    async (amount: string) => {
      const value = parseUnits(amount, decimals);
      const allowance = (allowanceRead.data as bigint | undefined) ?? 0n;
      if (allowance < value) {
        await run("授权", () =>
          writeContractAsync({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [SITE.vault as `0x${string}`, value],
          })
        );
      }
      return run("质押", () =>
        writeContractAsync({ address: SITE.vault, abi: vaultAbi, functionName: "stake", args: [value] })
      );
    },
    [allowanceRead.data, decimals, run, writeContractAsync]
  );

  const unstake = useCallback(
    (amount: string) => {
      const value = parseUnits(amount, decimals);
      return run("取回", () =>
        writeContractAsync({
          address: SITE.vault,
          abi: vaultAbi,
          functionName: "unstake",
          args: [value],
        })
      );
    },
    [decimals, run, writeContractAsync]
  );

  const mine = useCallback(
    () => run("挖矿", () => writeContractAsync({ address: SITE.vault, abi: vaultAbi, functionName: "mine" })),
    [run, writeContractAsync]
  );

  return {
    address,
    isConnected,
    wrongChain,
    connect,
    disconnect,
    isConnecting,
    isWriting,
    error,
    status,
    clearError: () => setError(null),
    wallets: detectWallets(),
    agentId: (agentId.data as bigint | undefined) ?? 0n,
    hasAgentId,
    pool,
    rig,
    minStake,
    tokenBalance: (tokenRead.data as bigint | undefined) ?? 0n,
    tokenAddress,
    hasToken,
    allowance: (allowanceRead.data as bigint | undefined) ?? 0n,
    decimals,
    claimRig,
    stake,
    unstake,
    mine,
  };
}
