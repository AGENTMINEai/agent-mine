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
    <footer className="relative border-t border-white/[0.07] py-12">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-md border border-white/10 bg-[#02050a]">
                <Image src="/brand/logo-mark.png" alt="" width={48} height={48} className="h-full w-full object-cover" />
              </span>
              <BrandWordmark className="text-[12px]" />
              <a
                href={SITE.x}
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="ml-1 grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-white/[0.05] hover:text-ink"
              >
                <XIcon className="h-3 w-3" />
              </a>
              <a
                href={SITE.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="grid h-7 w-7 place-items-center rounded-md text-ink-muted hover:bg-white/[0.05] hover:text-ink"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-muted">{t.footer.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-14 gap-y-2.5 font-mono text-[11px]">
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

        <div className="mt-10 flex flex-col gap-2 border-t border-white/[0.07] pt-5 font-mono text-[9.5px] tracking-[0.12em] text-ink-faint md:flex-row md:items-center md:justify-between">
          <span>{t.footer.addresses.replace("{vault}", vault).replace("{gate}", gate)}</span>
          <span className="max-w-xl md:text-right">{t.footer.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}
