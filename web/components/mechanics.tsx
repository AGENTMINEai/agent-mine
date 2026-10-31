"use client";

import Link from "next/link";
import { Anchor, Gauge, ShieldOff, Zap } from "lucide-react";
import { SITE } from "@/lib/site";
import { useI18n } from "@/components/providers/locale-provider";

const ICONS = [Gauge, ShieldOff, Anchor, Zap];

export function Mechanics() {
  const { t } = useI18n();

  return (
    <section id="mechanics" className="relative py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 md:flex-row md:items-end">
          <div>
            <span className="label-mono">04 / {t.mechanics.label}</span>
            <h2 className="mt-3 text-[26px] font-semibold leading-tight tracking-tightest sm:text-[32px]">
              {t.mechanics.title}
            </h2>
          </div>
          <Link href="/docs" className="font-mono text-[11px] text-mine-amber hover:text-mine-amber-soft">
            {t.mechanics.link}
          </Link>
        </div>

        <div className="border-t border-white/[0.07]">
          {t.mechanics.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={item.title}
                className="grid gap-2 border-b border-white/[0.07] py-6 sm:grid-cols-[240px_1fr] sm:gap-8"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-ink-faint" />
                  <span className="text-[13.5px] font-medium">{item.title}</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-muted">{item.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-mine-danger/20 bg-mine-danger/[0.04] px-5 py-4 text-[11.5px] leading-relaxed text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="text-mine-danger/90">{t.mechanics.riskTitle}</span>
            {t.mechanics.risk}
          </span>
          {SITE.vault && (
            <a
              href={`${SITE.bscScan}/address/${SITE.vault}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 font-mono text-[10px] tracking-[0.08em] text-ink-soft hover:text-ink"
            >
              {t.mechanics.bscScan}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
