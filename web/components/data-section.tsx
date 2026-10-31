"use client";

import { useMemo } from "react";
import { Activity, Gauge as GaugeIcon, HardDrive, Waves } from "lucide-react";
import { usePool } from "@/hooks/use-pool";
import { usePoolHistory } from "@/hooks/use-pool-history";
import { AreaChart, Ring } from "@/components/visuals/area-chart";
import { SITE, isConfigured } from "@/lib/site";
import { formatBnb } from "@/lib/utils";
import { useI18n } from "@/components/providers/locale-provider";

function bnb(v?: bigint) {
  return v === undefined ? 0 : Number(v) / 1e18;
}

function perSecond(v: number) {
  if (v === 0) return "0";
  if (v < 0.000001) return v.toExponential(2);
  return v.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function FlowBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label-mono text-[8.5px] tracking-[0.2em]">{label}</span>
        <span className="number text-[11px] text-ink-soft">
          {value.toLocaleString("en-US", { maximumFractionDigits: 4 })} BNB
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-[width] duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DataSection() {
  const { pool } = usePool();
  const { t } = useI18n();
  const samples = usePoolHistory(pool?.reserve);

  const releasePerDay = bnb(pool?.releasePerDay);
  const halfLifeHours = pool ? (Number(pool.dripWindow) * Math.LN2) / 3600 : 16.6;

  const rigPct = pool && pool.maxRigs > 0n ? Number((pool.totalRigs * 100n) / pool.maxRigs) / 100 : 0;
  const maxRigs = pool ? Number(pool.maxRigs) : SITE.maxRigs;
  const claimed = pool ? Number(pool.totalRigs) : 0;
  const remaining = Math.max(0, maxRigs - claimed);
  const rigSegments = 24;
  const filledSegments = Math.round((rigPct / 100) * rigSegments);

  const liveSeries = samples.map((s) => s.v);
  const hasLive = isConfigured && liveSeries.some((v) => v > 0);

  const mechanism = useMemo(() => Array.from({ length: 49 }, (_, i) => 1 - i / 48), []);

  const series = hasLive ? liveSeries : mechanism;
  const delta = hasLive && liveSeries.length > 1 ? liveSeries[liveSeries.length - 1] - liveSeries[0] : 0;

  return (
    <section id="data" className="relative py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <span className="label-mono">{t.data.label}</span>
            <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-tightest sm:text-[38px]">
              {t.data.title}
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">
            {t.data.note}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.55fr_0.45fr]">
          {/* main chart */}
          <div className="relative overflow-hidden rounded-lg glass p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="label-mono flex items-center gap-2 text-[9px] tracking-[0.24em]">
                  <Waves className="h-3 w-3 text-mine-amber" />
                  {hasLive ? t.data.chartLive : t.data.chartMech}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  {hasLive ? (
                    <>
                      <span className="number text-[30px] font-semibold gradient-text">{formatBnb(pool?.reserve, 6)}</span>
                      <span className="font-mono text-[11px] text-ink-muted">BNB</span>
                      <span
                        className={`font-mono text-[11px] ${
                          delta >= 0 ? "text-mine-ok" : "text-mine-danger"
                        }`}
                      >
                        {delta >= 0 ? "+" : ""}
                        {delta.toFixed(6)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="number text-[30px] font-semibold text-ink-soft">100%</span>
                      <span className="font-mono text-[11px] text-ink-muted">→ 0%</span>
                    </>
                  )}
                </div>
              </div>
              <span className="rounded-full border border-white/[0.08] px-2.5 py-1 font-mono text-[9px] text-ink-muted">
                {hasLive ? `${samples.length} ${t.data.samples}` : t.data.noLive}
              </span>
            </div>

            <div className="mt-6">
              <AreaChart
                color="#3D7BFF"
                values={series}
                height={210}
                fillId="pool-area"
                yMax={hasLive ? Math.max(...series) * 1.15 || 1 : 1}
                xLabels={hasLive ? [] : ["0h", "6h", "12h", "18h", "24h"]}
                className="h-[232px] w-full"
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <FlowBar
                label={t.data.tax}
                value={bnb(pool?.totalTaxReceived)}
                max={Math.max(bnb(pool?.totalTaxReceived), 1e-9)}
                color="from-mine-amber/70 to-mine-amber-soft"
              />
              <FlowBar
                label={t.data.mined}
                value={bnb(pool?.totalMined)}
                max={Math.max(bnb(pool?.totalTaxReceived), 1e-9)}
                color="from-mine-cyan/70 to-mine-cyan-soft"
              />
            </div>

            <p className="mt-4 border-t border-white/[0.05] pt-3 font-mono text-[10px] leading-relaxed text-ink-faint">
              {hasLive ? t.data.chartNoteLive : t.data.chartNoteMech}
            </p>
          </div>

          {/* metric tiles */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="relative overflow-hidden rounded-lg glass p-5">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-mine-amber" />
                <span className="label-mono text-[9px] tracking-[0.22em]">{t.data.perSecond}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="number text-[20px] font-medium text-mine-amber">
                  {perSecond(releasePerDay / 86400)}
                </span>
                <span className="font-mono text-[9px] text-ink-faint">BNB/s</span>
              </div>
              <div className="relative mt-3 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-mine-amber/0 via-mine-amber/80 to-mine-amber/0 animate-pulse" />
              </div>
            </div>

            <div className="rounded-lg glass p-5">
              <div className="flex items-center gap-2">
                <GaugeIcon className="h-3.5 w-3.5 text-mine-cyan" />
                <span className="label-mono text-[9px] tracking-[0.22em]">{t.data.halfLife}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="number text-[20px] font-medium text-mine-cyan">{halfLifeHours.toFixed(1)}h</div>
                  <div className="mt-1 font-mono text-[9px] text-ink-faint">
                    {t.data.window} {((pool ? Number(pool.dripWindow) : 86400) / 3600).toFixed(0)}h
                  </div>
                </div>
                <Ring value={0.693} size={52} stroke={5} color="#3D7BFF">
                  <span className="font-mono text-[8px] text-ink-muted">x½</span>
                </Ring>
              </div>
            </div>

            <div className="rounded-lg glass p-5">
              <div className="flex items-center gap-2">
                <HardDrive className="h-3.5 w-3.5 text-ink-soft" />
                <span className="label-mono text-[9px] tracking-[0.22em]">{t.data.rigsLeft}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="number text-[20px] font-medium">
                  {remaining}
                </span>
                <span className="font-mono text-[10px] text-ink-faint">/ {maxRigs}</span>
              </div>
              <div className="mt-3 flex gap-[3px]">
                {Array.from({ length: rigSegments }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 flex-1 rounded-[1px] ${
                      i < filledSegments ? "bg-mine-ok/80" : "bg-white/[0.07]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
