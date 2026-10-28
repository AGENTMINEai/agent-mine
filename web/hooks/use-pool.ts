"use client";

import { useReadContract } from "wagmi";
import { SITE, isConfigured } from "@/lib/site";
import { vaultAbi } from "@/lib/abi";
import type { PoolState } from "@/hooks/use-miner";

export function usePool() {
  const read = useReadContract({
    address: SITE.vault || undefined,
    abi: vaultAbi,
    functionName: "poolState",
    query: { enabled: isConfigured, refetchInterval: 15_000 },
  });

  const data = read.data as unknown as readonly bigint[] | undefined;
  const pool: PoolState | undefined = data
    ? {
        reserve: data[0],
        releasePerDay: data[1],
        totalHash: data[2],
        totalRigs: data[3],
        maxRigs: data[4],
        totalTaxReceived: data[5],
        totalMined: data[6],
        lastUpdate: data[7],
        dripWindow: data[8],
      }
    : undefined;

  return { pool, isLoading: read.isLoading };
}
