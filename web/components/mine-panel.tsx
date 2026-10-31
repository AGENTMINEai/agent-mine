"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Cpu, Lock, Pickaxe, ShieldCheck } from "lucide-react";
import { useMiner } from "@/hooks/use-miner";
import { Ring } from "@/components/visuals/area-chart";
import { SITE, isConfigured } from "@/lib/site";
import { useI18n } from "@/components/providers/locale-provider";
import { cn, formatBnb, formatTokens, shortAddress, toTokenInput } from "@/lib/utils";

function Field({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/[0.05] py-3 last:border-0">
      <span className="label-mono text-[9px] tracking-[0.22em]">{label}</span>
      <span className={cn("number text-[13px]", accent ?? "text-ink")}>{value}</span>
    </div>
  );
}

export function MinePanel() {
  const m = useMiner();
  const { t } = useI18n();
  const [amount, setAmount] = useState("");

  const minStakeLabel = formatTokens(m.minStake);
  const hasRig = (m.rig?.rigId ?? 0n) > 0n;
  const staked = m.rig?.staked ?? 0n;
  const hash = m.rig?.hash ?? 0n;
  const pending = m.rig?.pending ?? 0n;
  const share = m.pool && m.pool.totalHash > 0n ? Number((hash * 10000n) / m.pool.totalHash) / 100 : 0;

  const maxRigs = m.pool ? Number(m.pool.maxRigs) : SITE.maxRigs;
  const claimed = m.pool ? Number(m.pool.totalRigs) : 0;
  const remaining = Math.max(0, maxRigs - claimed);
  const soldOut = remaining === 0;

  return (
    <section id="mine" className="relative py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/brand/logo-mark.png"
                alt=""
                width={44}
                height={36}
                className="h-6 w-6 rounded-[6px] bg-[#020611] object-contain"
              />
              <span className="label-mono">{t.mine.label}</span>
            </div>
            <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-tightest sm:text-[38px]">
              {t.mine.title}
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">
            {t.mine.note}
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl glass-deep shadow-panel">
          {/* status bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  !m.isConnected
                    ? "bg-ink-faint"
                    : m.hasAgentId
                      ? "bg-mine-ok shadow-[0_0_10px_rgba(84,230,164,0.9)]"
                      : "bg-mine-danger"
                )}
              />
              <span className="font-mono text-[11.5px] text-ink-soft">
                {m.isConnected ? shortAddress(m.address) : t.mine.noWallet}
              </span>
              {m.isConnected && (
                <span className="rounded-full border border-white/[0.08] px-2 py-0.5 font-mono text-[9px] text-ink-muted">
                  {m.hasAgentId ? `.ai × ${m.agentId.toString()}` : t.mine.noAgentBadge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10.5px] text-ink-muted">
                {t.mine.remaining} <span className="text-mine-amber">{remaining}</span>
                <span className="text-ink-faint"> / {maxRigs}</span>
              </span>
              <span className="label-mono text-[8.5px] tracking-[0.24em] text-ink-faint">
                {isConfigured ? t.mine.linked : t.mine.preLaunch}
              </span>
            </div>
          </div>

          {!isConfigured ? (
            <div className="px-6 py-16 text-center">
              <Lock className="mx-auto h-8 w-8 text-ink-faint" />
              <h3 className="mt-4 text-[18px] font-semibold">{t.mine.notConfiguredTitle}</h3>
              <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-ink-muted">
                {t.mine.notConfiguredBody}
              </p>
            </div>
          ) : !m.isConnected ? (
            <div className="px-6 py-16 text-center">
              <Cpu className="mx-auto h-8 w-8 text-mine-amber/70" />
              <h3 className="mt-4 text-[18px] font-semibold">{t.mine.connectTitle}</h3>
              <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-ink-muted">
                {t.mine.connectBody}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button onClick={() => m.connect("binance")} className="btn btn-primary" disabled={m.isConnecting}>
                  {t.mine.connectBinance}
                </button>
                <button onClick={() => m.connect("browser")} className="btn btn-ghost" disabled={m.isConnecting}>
                  {t.mine.connectBrowser}
                </button>
              </div>
            </div>
          ) : !m.hasAgentId ? (
            <div className="px-6 py-14 text-center">
              <Lock className="mx-auto h-8 w-8 text-mine-danger/80" />
              <h3 className="mt-4 text-[18px] font-semibold">{t.mine.noAgentTitle}</h3>
              <p className="mx-auto mt-2 max-w-lg text-[12.5px] leading-relaxed text-ink-muted">
                {t.mine.noAgentBody}
              </p>
              <a
                href="https://www.binance.com/en/web3wallet"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost mt-6"
              >
                {t.mine.learnAgent}
              </a>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              {/* left: rig */}
              <div className="border-b border-white/[0.06] p-6 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="label-mono text-[9px] tracking-[0.24em]">{t.mine.yourRig}</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="number text-[22px] font-semibold">
                        {hasRig ? `#${m.rig!.rigId}` : t.mine.noRig}
                      </span>
                      {hasRig && (
                        <span className="rounded-full border border-mine-ok/30 bg-mine-ok/10 px-2 py-0.5 font-mono text-[9px] text-mine-ok">
                          {t.mine.active}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="label-mono text-[9px] tracking-[0.24em]">{t.mine.pending}</span>
                    <div className="number mt-1 text-[22px] font-semibold gradient-text">
                      {formatBnb(pending, 6)} <span className="text-[10px] text-ink-muted">BNB</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-4 rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <Ring value={share / 100} size={64} stroke={6} color="#FFB454">
                    <span className="number text-[10.5px] text-mine-amber">{share.toFixed(1)}%</span>
                  </Ring>
                  <div>
                    <div className="label-mono text-[9px] tracking-[0.22em]">{t.mine.share}</div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                      {t.mine.shareNote}
                    </p>
                  </div>
                </div>

                <div className="relative mt-3 h-9 overflow-hidden rounded-xl border border-white/[0.06] bg-obsidian-950/60">
                  <div className="absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(61,123,255,0.28),transparent)] animate-pulse" />
                  <div className="relative flex h-full items-center justify-between px-3 font-mono text-[8.5px] tracking-[0.1em] text-ink-faint">
                    <span>TAX</span>
                    <span className="text-mine-amber/70">▸ POOL</span>
                    <span className="text-mine-amber/70">▸ RIG</span>
                    <span>WALLET</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.015] px-4">
                  <Field label={t.mine.staked} value={`${formatTokens(staked)} / ${minStakeLabel}`} />
                  <Field label={t.mine.hashrate} value={formatTokens(hash)} accent="text-mine-cyan" />
                  <Field label={t.mine.tokenBalance} value={formatTokens(m.tokenBalance, m.decimals)} />
                </div>

                {!hasRig ? (
                  <button
                    onClick={() => m.claimRig()}
                    disabled={m.isWriting || soldOut}
                    className="btn btn-primary mt-6 w-full disabled:opacity-50"
                  >
                    <Pickaxe className="h-4 w-4" />
                    {soldOut ? t.mine.soldOut : t.mine.claim}
                  </button>
                ) : staked < m.minStake ? (
                  <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-mine-amber/25 bg-mine-amber/[0.06] px-4 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-mine-amber" />
                    <p className="text-[11.5px] leading-relaxed text-mine-amber-soft/90">
                      {t.mine.warnBelow.replace("{min}", minStakeLabel)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-mine-ok/20 bg-mine-ok/[0.05] px-4 py-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mine-ok" />
                    <p className="text-[11.5px] leading-relaxed text-ink-soft">
                      {t.mine.rigLive}
                    </p>
                  </div>
                )}
              </div>

              {/* right: actions */}
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <span className="label-mono text-[9px] tracking-[0.24em]">{t.mine.stakeLabel}</span>
                </div>

                {!m.hasToken && (
                  <div className="mt-3 rounded-xl border border-mine-amber/25 bg-mine-amber/[0.06] px-3.5 py-2.5 text-[11px] leading-relaxed text-mine-amber-soft/90">
                    {t.mine.tokenPending}
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-white/[0.07] bg-obsidian-900/60 p-1.5">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder={t.mine.placeholder.replace("{min}", minStakeLabel)}
                      inputMode="decimal"
                      className="number w-full bg-transparent text-[18px] outline-none placeholder:text-ink-faint"
                    />
                    <button
                      onClick={() => setAmount(toTokenInput(m.tokenBalance, m.decimals))}
                      className="rounded-lg border border-white/10 px-2 py-1 font-mono text-[9px] text-ink-muted hover:text-ink"
                      type="button"
                    >
                      {t.mine.max}
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-3 pb-2 font-mono text-[10px] text-ink-faint">
                    <span>{SITE.token ? `${SITE.token.slice(0, 6)}…${SITE.token.slice(-4)}` : "TOKEN"}</span>
                    <span>{formatTokens(m.tokenBalance, m.decimals)}</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => amount && m.stake(amount)}
                    disabled={!hasRig || !amount || m.isWriting || !m.hasToken}
                    className="btn btn-primary h-11"
                  >
                    <ArrowUpFromLine className="h-4 w-4" />
                    {t.mine.stake}
                  </button>
                  <button
                    onClick={() => amount && m.unstake(amount)}
                    disabled={!hasRig || !amount || m.isWriting || !m.hasToken}
                    className="btn btn-ghost h-11"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    {t.mine.unstake}
                  </button>
                </div>

                <button
                  onClick={() => m.mine()}
                  disabled={!hasRig || pending === 0n || m.isWriting}
                  className={cn(
                    "btn mt-2 h-11 w-full",
                    pending > 0n ? "btn-primary" : "btn-ghost opacity-60"
                  )}
                >
                  <Pickaxe className="h-4 w-4" />
                  {pending > 0n ? t.mine.mineButton.replace("{amount}", formatBnb(pending, 6)) : t.mine.nothingToMine}
                </button>

                <p className="mt-4 text-[10.5px] leading-relaxed text-ink-faint">
                  {t.mine.footnote}
                </p>

                {(m.status || m.error) && (
                  <div
                    className={cn(
                      "mt-4 rounded-xl border px-3 py-2.5 font-mono text-[10.5px] leading-relaxed",
                      m.error
                        ? "border-mine-danger/30 bg-mine-danger/[0.07] text-mine-danger"
                        : "border-white/10 bg-white/[0.03] text-ink-soft"
                    )}
                  >
                    {m.error ?? m.status}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
