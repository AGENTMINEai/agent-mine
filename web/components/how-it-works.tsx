"use client";

import { Link2, Pickaxe, Radio } from "lucide-react";
import { useI18n } from "@/components/providers/locale-provider";

const ICONS = [Link2, Pickaxe, Radio];

export function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id="how" className="relative py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 md:flex-row md:items-end">
          <div>
            <span className="label-mono">02 / {t.how.label}</span>
            <h2 className="mt-3 text-balance text-[26px] font-semibold leading-tight tracking-tightest sm:text-[32px]">
              {t.how.title}
            </h2>
          </div>
          <p className="max-w-sm text-[12.5px] leading-relaxed text-ink-muted">{t.how.note}</p>
        </div>

        <div className="grid md:grid-cols-3">
          {t.how.items.map((step, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={step.title}
                className={`border-white/[0.07] py-7 md:px-6 ${
                  i < 2 ? "md:border-r" : ""
                } ${i > 0 ? "border-t md:border-t-0" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-mine-amber">
                    0{i + 1}
                  </span>
                  <Icon className="h-4 w-4 text-ink-faint" />
                </div>
                <h3 className="mt-4 text-[15px] font-medium">{step.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{step.body}</p>
                <div className="mt-5 font-mono text-[9.5px] tracking-[0.06em] text-ink-faint">
                  {step.tag}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
