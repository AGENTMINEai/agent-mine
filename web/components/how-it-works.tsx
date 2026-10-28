"use client";

import { Link2, Pickaxe, Radio } from "lucide-react";
import { useI18n } from "@/components/providers/locale-provider";

const ICONS = [Link2, Pickaxe, Radio];
const NUMS = ["01", "02", "03"];

export function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id="how" className="relative py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="label-mono">{t.how.label}</span>
            <h2 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-tightest sm:text-[38px]">
              {t.how.title}
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">{t.how.note}</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {t.how.items.map((step, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={step.title}
                className="group relative overflow-hidden rounded-2xl glass p-6 transition-colors hover:bg-white/[0.045]"
              >
                <div className="absolute right-5 top-5 font-mono text-[11px] text-ink-faint">{NUMS[i]}</div>
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-mine-amber/20 bg-mine-amber/[0.08]">
                  <Icon className="h-4 w-4 text-mine-amber" />
                </div>
                <h3 className="mt-5 text-[16px] font-semibold">{step.title}</h3>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-muted">{step.body}</p>
                <div className="mt-5 border-t border-white/[0.06] pt-3 font-mono text-[10px] text-ink-faint">
                  {step.tag}
                </div>
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-mine-amber/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
