"use client";

import Image from "next/image";
import { Backdrop } from "@/components/visuals/backdrop";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BrandWordmark } from "@/components/visuals/brand-wordmark";
import { SITE } from "@/lib/site";
import { useI18n } from "@/components/providers/locale-provider";

const SECTION_IDS = ["overview", "gate", "math", "params", "security", "verify", "risk"];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-28 border-t border-white/[0.07] pt-10 text-[22px] font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export default function DocsPage() {
  const { t } = useI18n();
  const d = t.docs;

  return (
    <>
      <Backdrop />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-[180px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-2.5">
              <span className="label-mono">{d.label}</span>
              {d.toc.map((label, i) => (
                <a
                  key={SECTION_IDS[i]}
                  href={`#${SECTION_IDS[i]}`}
                  className="block text-[12px] text-ink-muted transition-colors hover:text-ink"
                >
                  {label}
                </a>
              ))}
            </div>
          </aside>

          <article className="max-w-2xl">
            <div className="mb-8 flex items-center gap-3">
              <span className="rounded-[10px] bg-gradient-to-br from-[#F0B90B]/60 via-white/10 to-[#4DA6FF]/50 p-px">
                <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-[9px] bg-[#020611]">
                  <Image src="/brand/logo-mark.png" alt="" width={64} height={52} className="h-full w-full object-contain" />
                </span>
              </span>
              <BrandWordmark className="text-[13px]" />
            </div>

            <h1 className="text-[36px] font-semibold leading-tight tracking-tightest">{d.title}</h1>
            <p className="mt-4 text-[13.5px] leading-relaxed text-ink-soft">{d.intro}</p>

            <H id="overview">{d.overviewTitle}</H>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">{d.overviewBody}</p>
            <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-obsidian-950/60 p-5 font-mono text-[11px] leading-relaxed text-ink-muted">
              tax BNB → reserve → drip per second → accPerHash → pending[rig] → mine() → wallet
            </div>

            <H id="gate">{d.gateTitle}</H>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">{d.gateBody}</p>
            <div className="mt-4 space-y-2 font-mono text-[11.5px] text-ink-muted">
              <div>registry = {SITE.registry}</div>
              <div>check = balanceOf(wallet) &gt; 0</div>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">{d.gateNote}</p>

            <H id="math">{d.mathTitle}</H>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <tbody className="font-mono text-[11.5px] text-ink-soft">
                  {d.mathRows.map(([k, v]) => (
                    <tr key={k} className="border-b border-white/[0.05]">
                      <td className="py-2.5 pr-6 text-ink-muted">{k}</td>
                      <td className="py-2.5">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">{d.mathNote}</p>

            <H id="params">{d.paramsTitle}</H>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <tbody className="font-mono text-[11.5px] text-ink-soft">
                  {d.paramsRows.map(([k, v]) => (
                    <tr key={k} className="border-b border-white/[0.05]">
                      <td className="py-2.5 pr-6 text-ink-muted">{k}</td>
                      <td className="py-2.5">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <H id="security">{d.securityTitle}</H>
            <ul className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-ink-soft">
              {d.securityItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <H id="verify">{d.verifyTitle}</H>
            <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-ink-soft">
              <li>
                {d.verifyVault}
                {SITE.vault ? (
                  <a
                    href={`${SITE.bscScan}/address/${SITE.vault}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 font-mono text-[11.5px] text-mine-amber hover:underline"
                  >
                    {SITE.vault}
                  </a>
                ) : (
                  <span className="ml-1 font-mono text-[11.5px] text-ink-faint">{t.footer.toDeploy}</span>
                )}
              </li>
              <li>
                {d.verifyRegistry}
                <a
                  href={`${SITE.bscScan}/address/${SITE.registry}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 font-mono text-[11.5px] text-mine-amber hover:underline"
                >
                  {SITE.registry}
                </a>
              </li>
              <li>{d.verifyNote}</li>
            </ul>

            <H id="risk">{d.riskTitle}</H>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">{d.riskBody}</p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
