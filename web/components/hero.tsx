"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Terminal, Cpu } from "lucide-react";
import { PoolOrb } from "@/components/visuals/pool-orb";
import { Starfield } from "@/components/visuals/starfield";
import { OrbHud, PoolCore, PoolStats, PoolTicker } from "@/components/pool-live";
import { SITE, isConfigured } from "@/lib/site";
import { useI18n } from "@/components/providers/locale-provider";

export function Hero() {
  const { t } = useI18n();
  const [bodyBefore, bodyAfter] = t.hero.body.split(".ai Agent ID");

  return (
    <section className="relative overflow-hidden pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <Starfield className="h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-mine-amber/25 bg-mine-amber/[0.07] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-mine-amber animate-breathe" />
              <span className="label-mono text-[9.5px] tracking-[0.26em] text-mine-amber-soft">
                {t.hero.badge}
              </span>
            </div>

            <h1 className="mt-7 text-balance text-[42px] font-semibold leading-[1.04] tracking-tightest sm:text-[58px]">
              {t.hero.title1}
              <br />
              <span className="gradient-text">{t.hero.title2}</span>
            </h1>

            <p className="mt-6 max-w-xl text-balance text-[14.5px] leading-relaxed text-ink-soft">
              {bodyBefore}
              <span className="text-mine-amber">.ai Agent ID</span>
              {bodyAfter}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/#mine" className="btn btn-primary">
                <Cpu className="h-4 w-4" />
                {t.hero.ctaMine}
              </Link>
              <Link href="/#skill" className="btn btn-ghost">
                <Terminal className="h-4 w-4" />
                {t.hero.ctaSkill}
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-mine-ok" />
                {t.hero.trust1}
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-mine-ok" />
                {t.hero.trust2}
              </span>
              <a
                href={`${SITE.bscScan}/address/${SITE.registry}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted hover:text-mine-cyan"
              >
                {t.hero.gate} {SITE.registry.slice(0, 8)}…{SITE.registry.slice(-4)}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[640px]">
            <PoolOrb className="aspect-square w-full">
              <PoolCore />
            </PoolOrb>
            <OrbHud />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/[0.07] bg-obsidian-900/80 px-3 py-1.5 backdrop-blur">
              <span className="label-mono text-[8.5px] tracking-[0.28em] text-ink-muted">
                {isConfigured ? t.hero.realtime : t.hero.awaiting}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <PoolStats />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <PoolTicker />
            <span className="label-mono text-[8.5px] tracking-[0.24em] text-ink-faint">
              {t.hero.network}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
