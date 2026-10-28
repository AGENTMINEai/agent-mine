"use client";

import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { BrandWordmark } from "@/components/visuals/brand-wordmark";
import { useI18n } from "@/components/providers/locale-provider";
import { XIcon } from "@/components/visuals/x-icon";
import { GitHubIcon } from "@/components/visuals/github-icon";

export function SiteFooter() {
  const { t } = useI18n();

  const vault = SITE.vault ? `${SITE.vault.slice(0, 10)}…${SITE.vault.slice(-6)}` : t.footer.toDeploy;
  const gate = `${SITE.registry.slice(0, 10)}…`;

  return (
    <footer className="relative border-t border-white/5 py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="rounded-[9px] bg-gradient-to-br from-[#F0B90B]/60 via-white/10 to-[#4DA6FF]/50 p-px">
                <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-[8px] bg-[#020611]">
                  <Image
                    src="/brand/logo-mark.png"
                    alt=""
                    width={56}
                    height={45}
                    className="h-full w-full object-contain"
                  />
                </span>
              </span>
              <BrandWordmark className="text-[13px]" />
              <a
                href={SITE.x}
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                title="X"
                className="ml-1 grid h-7 w-7 place-items-center rounded-full border border-white/10 text-ink-muted transition-colors hover:border-white/25 hover:bg-white/5 hover:text-ink"
              >
                <XIcon className="h-3 w-3" />
              </a>
              <a
                href={SITE.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                title="GitHub"
                className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-ink-muted transition-colors hover:border-white/25 hover:bg-white/5 hover:text-ink"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-ink-muted">{t.footer.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-14 gap-y-3 text-[12.5px]">
            <Link href="/docs" className="text-ink-soft hover:text-ink">
              {t.footer.docs}
            </Link>
            {SITE.vault ? (
              <a
                href={`${SITE.bscScan}/address/${SITE.vault}`}
                target="_blank"
                rel="noreferrer"
                className="text-ink-soft hover:text-ink"
              >
                {t.footer.vault}
              </a>
            ) : (
              <span className="text-ink-faint">{t.footer.toDeploy}</span>
            )}
            <Link href="/#skill" className="text-ink-soft hover:text-ink">
              {t.footer.skill}
            </Link>
            <a
              href={`${SITE.bscScan}/address/${SITE.registry}`}
              target="_blank"
              rel="noreferrer"
              className="text-ink-soft hover:text-ink"
            >
              {t.footer.registry}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/5 pt-6 text-[11px] text-ink-faint md:flex-row md:items-center md:justify-between">
          <span className="font-mono">
            {t.footer.addresses.replace("{vault}", vault).replace("{gate}", gate)}
          </span>
          <span>{t.footer.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}
