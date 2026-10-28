"use client";

import { Activity, Coins, Cpu, HardDrive } from "lucide-react";
import { usePool } from "@/hooks/use-pool";
import { CountUp } from "@/components/visuals/count-up";
import { SITE, isConfigured } from "@/lib/site";
import { useI18n } from "@/components/providers/locale-provider";
import { formatBnb } from "@/lib/utils";

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 2)}K`;
  return n.toFixed(0);
}

function bnbValue(v?: bigint) {
  return v === undefined ? 0 : Number(v) / 1e18;
}

export function PoolCore() {
  const { pool } = usePool();
  const { t } = useI18n();
  const reserve = bnbValue(pool?.reserve);

  return (
    <div className="text-center">
      <div className="label-mono mb-2 flex items-center justify-center gap-1.5 text-[9.5px] tracking-[0.34em] text-mine-amber/85">{t.pool.balance}</div>
      <div className="flex min-h-[58px] items-center justify-center gap-1.5">
        {isConfigured ? (
          <>
            <CountUp
              value={reserve}
              format={(n) => n.toLocaleString("en-US", { maximumFractionDigits: 4 })}
              className="number text-[42px] font-semibold leading-none gradient-text drop-shadow-[0_0_18px_rgba(255,190,110,0.35)] sm:text-[54px]"
            />
            <span className="font-mono text-[11px] text-ink-muted">BNB</span>
          </>
        ) : (
          <span className="number text-[15px] font-medium leading-none tracking-[0.18em] text-ink-soft/90 drop-shadow-[0_0_10px_rgba(200,240,255,0.35)] sm:text-[16px]">
            {t.pool.pre}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${isConfigured ? "bg-mine-ok" : "bg-ink-faint"} animate-breathe`} />
        <span className="label-mono text-[8.5px] tracking-[0.26em]">
          {isConfigured ? t.pool.live : t.pool.waiting}
        </span>
      </div>
      <div className="mt-2 font-mono text-[7.5px] tracking-[0.32em] text-ink-faint/70">BSC · 56</div>
    </div>
  );
}

const cardDefs = [
  { key: "reserve", suffix: "BNB", icon: Coins, accent: "text-mine-amber" },
  { key: "release", suffix: "BNB", icon: Activity, accent: "text-mine-amber-soft" },
  { key: "hash", suffix: "", icon: Cpu, accent: "text-mine-cyan" },
  { key: "rigs", suffix: "", icon: HardDrive, accent: "text-ink-soft" },
] as const;

export function PoolStats() {
  const { pool } = usePool();
  const { t } = useI18n();

  const maxRigs = pool ? Number(pool.maxRigs) : SITE.maxRigs;
  const claimed = pool ? Number(pool.totalRigs) : 0;
  const remaining = Math.max(0, maxRigs - claimed);

  const labels: Record<string, string> = {
    reserve: t.pool.reserve,
    release: t.pool.release,
    hash: t.pool.hash,
    rigs: t.pool.rigs,
  };

  const values: Record<string, { value: number; format: (n: number) => string; sub?: string }> = {
    reserve: {
      value: bnbValue(pool?.reserve),
      format: (n) => (isConfigured ? n.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "—"),
    },
    release: {
      value: bnbValue(pool?.releasePerDay),
      format: (n) => (isConfigured ? n.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "—"),
    },
    hash: {
      value: pool ? Number(pool.totalHash) / 1e18 : 0,
      format: (n) => (isConfigured ? compact(n) : "—"),
    },
    rigs: {
      value: remaining,
      format: (n) => `${Math.round(n)}`,
      sub: `/ ${maxRigs}`,
    },
  };

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] md:grid-cols-4">
      {cardDefs.map((card) => {
        const v = values[card.key];
        const Icon = card.icon;
        return (
          <div key={card.key} className="relative bg-obsidian-950/40 px-5 py-5">
            <div className="flex items-center gap-2">
              <Icon className={`h-3.5 w-3.5 ${card.accent}`} />
              <span className="label-mono text-[9px] tracking-[0.24em]">{labels[card.key]}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <CountUp value={v.value} format={v.format} className={`number text-[22px] font-medium ${card.accent}`} />
              {v.sub && <span className="font-mono text-[11px] text-ink-faint">{v.sub}</span>}
              {card.suffix && isConfigured && (
                <span className="font-mono text-[10px] text-ink-faint">{card.suffix}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OrbHud() {
  const { pool } = usePool();
  const { t } = useI18n();

  const maxRigs = pool ? Number(pool.maxRigs) : SITE.maxRigs;
  const claimed = pool ? Number(pool.totalRigs) : 0;
  const remaining = Math.max(0, maxRigs - claimed);

  const items = [
    {
      pos: "left-[14%] top-[16%]",
      align: "text-left",
      label: t.pool.release,
      value: `${formatBnb(pool?.releasePerDay, 4)} BNB`,
    },
    {
      pos: "right-[9%] top-[23%]",
      align: "text-right",
      label: t.pool.hash,
      value: compact(Number(pool?.totalHash ?? 0n) / 1e18),
    },
    {
      pos: "left-[16%] bottom-[19%]",
      align: "text-left",
      label: t.pool.rigs,
      value: `${remaining} / ${maxRigs}`,
    },
    {
      pos: "right-[9%] bottom-[14%]",
      align: "text-right",
      label: t.pool.window,
      value: `${SITE.dripWindowHours}H`,
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 hidden sm:block">
      {items.map((it) => (
        <div key={it.label} className={`absolute ${it.pos} ${it.align}`}>
          <div className="label-mono text-[7.5px] tracking-[0.26em] text-ink-muted/65">{it.label}</div>
          <div className="number mt-1 text-[11px] text-ink-soft">{it.value}</div>
          <div
            className={`mt-1.5 h-px w-9 ${it.align === "text-right" ? "ml-auto" : ""} bg-gradient-to-r ${
              it.align === "text-right" ? "from-transparent to-mine-cyan/45" : "from-mine-cyan/45 to-transparent"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function PoolTicker() {
  const { pool } = usePool();
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10.5px] text-ink-muted">
      <span>
        {t.pool.tax} <span className="text-ink-soft">{formatBnb(pool?.totalTaxReceived)}</span> BNB
      </span>
      <span className="h-2.5 w-px bg-white/10" />
      <span>
        {t.pool.mined} <span className="text-ink-soft">{formatBnb(pool?.totalMined)}</span> BNB
      </span>
      <span className="h-2.5 w-px bg-white/10" />
      <span>
        {t.pool.window} <span className="text-ink-soft">{SITE.dripWindowHours}h</span>
      </span>
    </div>
  );
}
