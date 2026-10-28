"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { useI18n } from "@/components/providers/locale-provider";

export function CopyBlock({ code, label }: { code: string; label?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can be blocked; the text stays selectable */
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-obsidian-950/70">
      {label && (
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
          <span className="label-mono text-[8.5px] tracking-[0.24em]">{label}</span>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 font-mono text-[9.5px] text-ink-muted transition-colors hover:text-ink"
            type="button"
          >
            {copied ? <Check className="h-3 w-3 text-mine-ok" /> : <Copy className="h-3 w-3" />}
            {copied ? t.wallet.copied : t.wallet.copy}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[11.5px] leading-relaxed text-ink-soft">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const COMMANDS = {
  en: `# 1 · install the skill
node agent-mine/cli/install.mjs

# 2 · bind this vault
aimine init --vault 0x… --token 0x…

# 3 · keep the agent mining
aimine watch --interval 300 --min 0.005`,
  zh: `# 1 · 安装技能到你的代理
node agent-mine/cli/install.mjs

# 2 · 绑定这个矿池
aimine init --vault 0x… --token 0x…

# 3 · 让代理常驻挖矿
aimine watch --interval 300 --min 0.005`,
};

export function SkillSection() {
  const { t, locale } = useI18n();
  return (
    <section id="skill" className="relative py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-mine-cyan/25 bg-mine-cyan/[0.06] px-3 py-1.5">
              <Terminal className="h-3 w-3 text-mine-cyan" />
              <span className="label-mono text-[9px] tracking-[0.24em] text-mine-cyan-soft">{t.skill.label}</span>
            </div>
            <h2 className="mt-5 text-balance text-[30px] font-semibold leading-tight tracking-tightest sm:text-[38px]">
              {t.skill.title}
            </h2>
            <p className="mt-5 max-w-lg text-[13.5px] leading-relaxed text-ink-soft">
              {t.skill.body.split("agent-mine")[0]}
              <span className="font-mono text-mine-cyan">agent-mine</span>
              {t.skill.body.split("agent-mine")[1]}
            </p>

            <div className="mt-7 space-y-3">
              {[
                ...t.skill.bullets,
              ].map((line) => (
                <div key={line} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-mine-cyan" />
                  <span className="text-[12.5px] leading-relaxed text-ink-muted">{line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <CopyBlock code={COMMANDS[locale]} label={t.skill.installLabel} />
            <CopyBlock code={t.skill.prompt} label={t.skill.promptLabel} />

            <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
              <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-mine-amber/15 font-mono text-[7px] text-mine-amber">
                !
              </span>
              <p className="text-[11px] leading-relaxed text-ink-muted">
                {t.skill.note}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
