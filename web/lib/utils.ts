import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(address?: string, size = 4) {
  if (!address) return "";
  return `${address.slice(0, 2 + size)}…${address.slice(-size)}`;
}

export function formatBnb(value?: bigint, decimals = 5) {
  if (value === undefined) return "—";
  const n = Number(value) / 1e18;
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n < 0.00001) return "<0.00001";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatTokens(value?: bigint, decimals = 18) {
  if (value === undefined) return "—";
  const n = Number(value) / 10 ** decimals;
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 2)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Full-precision decimal string for form inputs — no separators, no rounding. */
export function toTokenInput(value: bigint, decimals = 18) {
  const s = value.toString().padStart(decimals + 1, "0");
  const int = s.slice(0, s.length - decimals);
  const frac = s.slice(s.length - decimals).replace(/0+$/, "");
  return frac ? `${int}.${frac}` : int;
}

export function pctColor(value: number) {
  if (value >= 70) return "text-mine-ok";
  if (value >= 30) return "text-mine-amber";
  return "text-ink-muted";
}
