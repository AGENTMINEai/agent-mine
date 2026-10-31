"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { MiningVideo } from "@/components/visuals/mining-video";
import { PoolStats, PoolTicker } from "@/components/pool-live";
import { usePool } from "@/hooks/use-pool";
import { SITE, isConfigured } from "@/lib/site";
import { useI18n } from "@/components/providers/locale-provider";
import { formatBnb } from "@/lib/utils";

const BLEED_MASK = "radial-gradient(ellipse 76% 70% at 58% 48%, #000 34%, transparent 82%)";
const LEFT_FADE =
  "linear-gradient(to right, #04060A 0%, #04060A 34%, rgba(4,6,10,0.94) 44%, rgba(4,6,10,0.6) 54%, transparent 68%)";

export function Hero() {
  const { t } = useI18n();
  const { pool } = usePool();
  const [bodyBefore, bodyAfter] = t.hero.body.split(".ai Agent ID");
  const rigs = pool ? Number(pool.totalRigs) : 0;

  const kv = [
    { k: "POOL", v: isConfigured ? `${formatBnb(pool?.reserve, 3)} BNB` : "—" },
    { k: "RIGS", v: `${isConfigured ? rigs : 0}/${SITE.maxRigs}` },
    { k: "GATE", v: ".ai only", accent: true },
  ];

  return (
    <section className="relative overflow-hidden pt-12 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <div
          className="absolute right-0 top-0 h-full w-[58%]"
          style={{ maskImage: BLEED_MASK, WebkitMaskImage: BLEED_MASK }}
        >
          <MiningVideo bare className="h-full w-full" />
          <div className="absolute inset-0 bg-obsidian-950/25" />
        </div>
        <div className="absolute inset-y-0 left-0 w-[62%] bg-[linear-gradient(to_right,#04060A_0%,#04060A_34%,rgba(4,6,10,0.94)_44%,rgba(4,6,10,0.6)_54%,transparent_68%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-obsidian-950 via-obsidian-950/70 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-mine-ok animate-breathe" />
              SYSTEM ONLINE
              <span className="text-ink-faint">/</span>
              BINANCE .AI AGENT ID
            </div>

            <h1 className="mt-6 text-balance text-[40px] font-semibold leading-[1.05] tracking-tightest sm:text-[54px]">
              {t.hero.title1}
              <br />
              <span className="gradient-text">{t.hero.title2}</span>
            </h1>

            <p className="mt-5 max-w-xl text-balance text-[14px] leading-relaxed text-ink-soft">
              {bodyBefore}
              <span className="text-mine-amber">.ai Agent ID</span>
              {bodyAfter}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/#mine" className="btn btn-primary">
                {t.hero.ctaMine}
              </Link>
              <Link href="/#skill" className="btn btn-ghost">
                {t.hero.ctaSkill}
              </Link>
            </div>

            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.02]">
              {kv.map((item) => (
                <div key={item.k} className="bg-obsidian-950/70 px-4 py-3">
                  <dt className="label-mono text-[8.5px] tracking-[0.2em]">{item.k}</dt>
                  <dd className={`number mt-1.5 text-[13px] ${item.accent ? "text-mine-amber" : "text-ink"}`}>
                    {item.v}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-mine-ok" />
                {t.hero.trust1}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-mine-ok" />
                {t.hero.trust2}
              </span>
            </div>
          </div>

          {/* balance floats on the footage */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-[320px] rounded-lg border border-white/[0.08] bg-obsidian-950/55 px-5 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="label-mono text-[8.5px]">POOL BALANCE</span>
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${isConfigured ? "bg-mine-ok" : "bg-ink-faint"} animate-breathe`} />
                  <span className={`label-mono text-[8.5px] ${isConfigured ? "text-mine-ok" : "text-ink-faint"}`}>
                    {isConfigured ? "LIVE" : "PRE"}
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="number text-[30px] text-ink">
                  {isConfigured ? formatBnb(pool?.reserve, 4) : "—"}
                </span>
                <span className="font-mono text-[10px] text-ink-muted">BNB</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-2 font-mono text-[9px] tracking-[0.12em] text-ink-faint">
                <span>STATUS</span>
                <span className="text-ink-soft">{isConfigured ? "MINING" : "PRE-LAUNCH"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* mobile: same footage, full width, masked */}
        <div className="mt-10 lg:hidden">
          <div className="h-56 w-full" style={{ maskImage: BLEED_MASK, WebkitMaskImage: BLEED_MASK }}>
            <MiningVideo bare className="h-full w-full" />
          </div>
        </div>

        <div className="mt-14 border-t border-white/[0.07] pt-6">
          <PoolStats />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <PoolTicker />
            <span className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">
              {t.hero.gate} {SITE.registry.slice(0, 8)}…
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
