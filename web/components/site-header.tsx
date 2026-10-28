"use client";

import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { WalletButton } from "@/components/wallet-button";
import { BrandWordmark } from "@/components/visuals/brand-wordmark";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { useI18n } from "@/components/providers/locale-provider";
import { XIcon } from "@/components/visuals/x-icon";
import { GitHubIcon } from "@/components/visuals/github-icon";

export function SiteHeader() {
  const { t } = useI18n();

  const nav = [
    { href: "/#mine", label: t.nav.mine },
    { href: "/#how", label: t.nav.how },
    { href: "/#skill", label: t.nav.skill },
    { href: "/docs", label: t.nav.docs },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-obsidian-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="relative shrink-0 rounded-[11px] bg-gradient-to-br from-[#F0B90B]/70 via-white/10 to-[#4DA6FF]/60 p-px">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-[10px] bg-[#020611]">
              <Image
                src="/brand/logo-mark.png"
                alt=""
                width={72}
                height={58}
                priority
                className="h-full w-full object-contain"
              />
            </span>
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <BrandWordmark className="text-[14px]" />
            <span className="label-mono mt-1 truncate text-[7.5px] tracking-[0.3em] text-ink-muted">
              {t.header.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[12.5px] text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <a
              href={SITE.x}
              target="_blank"
              rel="noreferrer"
              aria-label="X"
              title="X"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-ink-soft transition-colors hover:border-white/25 hover:bg-white/5 hover:text-ink"
            >
              <XIcon className="h-3.5 w-3.5" />
            </a>
            <a
              href={SITE.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              title="GitHub"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-ink-soft transition-colors hover:border-white/25 hover:bg-white/5 hover:text-ink"
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
          </div>
          <LocaleToggle />
          <WalletButton compact />
        </div>
      </div>
    </header>
  );
}
