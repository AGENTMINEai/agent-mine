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
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-obsidian-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md border border-white/10 bg-[#02050a]">
            <Image
              src="/brand/logo-mark.png"
              alt=""
              width={64}
              height={64}
              priority
              className="h-full w-full object-cover"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <BrandWordmark className="text-[13px]" />
            <span className="mt-1 truncate font-mono text-[8px] tracking-[0.22em] text-ink-faint">
              {t.header.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
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
          <div className="hidden items-center gap-1 sm:flex">
            <a
              href={SITE.x}
              target="_blank"
              rel="noreferrer"
              aria-label="X"
              className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              <XIcon className="h-3.5 w-3.5" />
            </a>
            <a
              href={SITE.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
          </div>
          <LocaleToggle />
          <WalletButton compact />
        </div>
      </div>

      <div className="hidden border-t border-white/[0.05] sm:block">
        <div className="mx-auto flex h-7 max-w-6xl items-center justify-between px-5 font-mono text-[9px] tracking-[0.16em] text-ink-faint">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-mine-ok animate-breathe" />
            SYSTEM ONLINE · BSC MAINNET 56
          </span>
          <span className="hidden md:inline">GATE 0x60B9…022F · NO OWNER · NO WITHDRAW</span>
          <span className="tracking-[0.2em]">v1.0</span>
        </div>
      </div>
    </header>
  );
}
