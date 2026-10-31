"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Terminal, Cpu } from "lucide-react";
import { MiningVideo } from "@/components/visuals/mining-video";
import { Starfield } from "@/components/visuals/starfield";
import { PoolCore, PoolStats, PoolTicker } from "@/components/pool-live";
import { SITE } from "@/lib/site";
import { useI18n } from "@/components/providers/locale-provider";

const BLEED_MASK =
  "radial-gradient(ellipse 74% 68% at 58% 48%, #000 36%, transparent 82%)";

export function Hero() {
  const { t } = useI18n();
  const [bodyBefore, bodyAfter] = t.hero.body.split(".ai Agent ID");

  return (
    <section className="relative overflow-hidden pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <Starfield className="h-full w-full" />
      </div>

      {/* cinematic bleed: no frame, edges dissolved into the page */}
      <div
        className="pointer-events-none absolute right-0 top-0 hidden h-full w-[56%] lg:block"
        style={{ maskImage: BLEED_MASK, WebkitMaskImage: BLEED_MASK }}
      >
        <MiningVideo bare className="h-full w-full" />
      </div>
      {/* keep the copy readable: hard fade on the left, soft fade at the bottom */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[64%] bg-[linear-gradient(to_right,#040507_0%,#040507_36%,rgba(4,5,7,0.94)_46%,rgba(4,5,7,0.6)_56%,transparent_70%)] lg:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[46%] bg-gradient-to-t from-obsidian-950 via-obsidian-950/75 to-transparent lg:block" />

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

          {/* balance floats on the video, no card frame around the footage */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-[320px] rounded-2xl border border-white/[0.06] bg-obsidian-950/45 px-5 py-4 backdrop-blur-sm">
              <PoolCore />
            </div>
          </div>
        </div>

        {/* mobile: the same footage, full width, no frame */}
        <div className="mt-10 lg:hidden">
          <div
            className="h-60 w-full"
            style={{ maskImage: BLEED_MASK, WebkitMaskImage: BLEED_MASK }}
          >
            <MiningVideo bare className="h-full w-full" />
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
