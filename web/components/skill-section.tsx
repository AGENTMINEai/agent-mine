"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy, Terminal } from "lucide-react";
import { useReadContract } from "wagmi";
import { useI18n } from "@/components/providers/locale-provider";
import { vaultAbi } from "@/lib/abi";
import { SITE } from "@/lib/site";

const REPO = "https://github.com/AGENTMINEai/agent-mine.git";
const ZERO = "0x0000000000000000000000000000000000000000";

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
    <div className="relative overflow-hidden rounded-md border border-white/[0.08] bg-black/40">
      {label && (
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
          <span className="label-mono text-[8px] tracking-[0.2em]">{label}</span>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 font-mono text-[9px] text-ink-muted transition-colors hover:text-ink"
            type="button"
          >
            {copied ? <Check className="h-3 w-3 text-mine-ok" /> : <Copy className="h-3 w-3" />}
            {copied ? t.wallet.copied : t.wallet.copy}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink-soft">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function SkillSection() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);

  // Deep link: /#skill opens the panel.
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#skill") setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const tokenRead = useReadContract({
    address: SITE.vault || undefined,
    abi: vaultAbi,
    functionName: "taxToken",
    query: { enabled: Boolean(SITE.vault) },
  });

  const bound = tokenRead.data as `0x${string}` | undefined;
  const token = bound && bound !== ZERO ? bound : "";
  const vault = SITE.vault || "0x…";
  const tokenLabel =
    token || (locale === "zh" ? "0x…（代币绑定后自动填入）" : "0x… (fills in after the token is bound)");

  const commands =
    locale === "zh"
      ? `# 1 · 克隆并安装技能
git clone ${REPO}
node agent-mine/cli/install.mjs

# 2 · 绑定矿池和代币
aimine init --vault ${vault} --token ${tokenLabel}

# 3 · 让代理常驻挖矿
aimine watch --interval 300 --min 0.005`
      : `# 1 · clone and install the skill
git clone ${REPO}
node agent-mine/cli/install.mjs

# 2 · bind this vault and token
aimine init --vault ${vault} --token ${tokenLabel}

# 3 · keep the agent mining
aimine watch --interval 300 --min 0.005`;

  const prompt =
    locale === "zh"
      ? `帮我安装并运行 agent-mine 挖矿技能。第一步先执行：git clone ${REPO} && node agent-mine/cli/install.mjs。装好后运行 aimine init --vault ${vault} --token ${tokenLabel}，再用 aimine doctor 检查我的 .ai，然后认领矿机、按最低质押量质押，最后常驻 aimine watch --interval 300。需要我在手机上确认的交易，告诉我。`
      : `Install and run the agent-mine skill for me. First run: git clone ${REPO} && node agent-mine/cli/install.mjs. Then aimine init --vault ${vault} --token ${tokenLabel}, aimine doctor to check my .ai, claim a rig, stake the minimum, and keep aimine watch --interval 300 running. Tell me when a transaction needs my confirmation in the app.`;

  return (
    <section id="skill" className="relative py-8">
      <div className="mx-auto max-w-6xl px-5">
        <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.015]">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <Terminal className="h-4 w-4 shrink-0 text-mine-amber" />
              <span className="label-mono shrink-0 text-[9px] tracking-[0.2em]">
                03 / {t.skill.label}
              </span>
              <span className="hidden truncate text-[13px] text-ink-soft sm:inline">{t.skill.title}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2.5">
              <span className="hidden font-mono text-[9px] tracking-[0.16em] text-ink-faint sm:inline">
                {open
                  ? locale === "zh"
                    ? "收起"
                    : "COLLAPSE"
                  : locale === "zh"
                    ? "展开"
                    : "EXPAND"}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-ink-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid gap-6 border-t border-white/[0.07] p-5 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="min-w-0">
                  <p className="text-[13px] leading-relaxed text-ink-soft">
                    {t.skill.body.split("agent-mine")[0]}
                    <span className="font-mono text-mine-amber">agent-mine</span>
                    {t.skill.body.split("agent-mine")[1]}
                  </p>
                  <div className="mt-4 space-y-2">
                    {[...t.skill.bullets].map((line) => (
                      <div key={line} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-mine-amber" />
                        <span className="text-[11.5px] leading-relaxed text-ink-muted">{line}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-start gap-2 border-t border-white/[0.06] pt-3">
                    <span className="mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm bg-mine-amber/15 font-mono text-[7px] text-mine-amber">
                      !
                    </span>
                    <p className="text-[10.5px] leading-relaxed text-ink-faint">{t.skill.note}</p>
                  </div>
                </div>

                <div className="min-w-0 space-y-2.5">
                  <CopyBlock code={commands} label={t.skill.installLabel} />
                  <CopyBlock code={prompt} label={t.skill.promptLabel} />
                  <p className="text-[10.5px] leading-relaxed text-ink-faint">{t.skill.hint}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
