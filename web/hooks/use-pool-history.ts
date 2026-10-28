"use client";

import { useEffect, useRef, useState } from "react";

export type Sample = { t: number; v: number };

/**
 * Samples the pool reserve into a short in-session series. There is no backend
 * indexer, so this is explicitly "this session", not 24h history.
 */
export function usePoolHistory(reserveWei?: bigint, intervalMs = 15_000) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const latest = useRef<number>(0);

  latest.current = reserveWei === undefined ? 0 : Number(reserveWei) / 1e18;

  useEffect(() => {
    const push = () => {
      setSamples((prev) => {
        const next = [...prev, { t: Date.now(), v: latest.current }];
        return next.length > 120 ? next.slice(next.length - 120) : next;
      });
    };
    push();
    const timer = setInterval(push, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return samples;
}
