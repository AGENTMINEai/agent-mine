"use client";

import Link from "next/link";
import { Anchor, Gauge, ShieldOff, Zap } from "lucide-react";
import { SITE } from "@/lib/site";
import { useI18n } from "@/components/providers/locale-provider";

const ICONS = [Gauge, ShieldOff, Anchor, Zap];

export function Mechanics() {
  const { t } = useI18n();

  return (
    <section id="mechanics" className="relative py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <span className="label-mono">{t.mechanics.label}</span>
            <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-tightest sm:text-[38px]">
              {t.mechanics.title}
            </h2>
          </div>
          <Link href="/docs" className="text-[12.5px] text-mine-amber hover:text-mine-amber-soft">
            {t.mechanics.link}
          </Link>
        </div>

        <div className="mt-11 grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] sm:grid-cols-2">
          {t.mechanics.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div key={item.title} className="bg-obsidian-950/50 p-6">
                <Icon className="h-4 w-4 text-mine-amber" />
                <h3 className="mt-4 text-[14.5px] font-semibold">{item.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">{item.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-mine-danger/15 bg-mine-danger/[0.035] px-5 py-4 text-[11.5px] leading-relaxed text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="text-mine-danger/90">{t.mechanics.riskTitle}</span>
            {t.mechanics.risk}
          </span>
          {SITE.vault && (
            <a
              href={`${SITE.bscScan}/address/${SITE.vault}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 font-mono text-[10.5px] text-ink-soft hover:text-ink"
            >
              {t.mechanics.bscScan}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
