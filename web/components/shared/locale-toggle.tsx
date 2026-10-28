"use client";

import { useI18n } from "@/components/providers/locale-provider";

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center rounded-full border border-white/10 bg-white/[0.02] p-0.5">
      {(["en", "zh"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          aria-pressed={locale === value}
          className={`rounded-full px-2 py-1 font-mono text-[10px] leading-none transition-colors ${
            locale === value ? "bg-white/10 text-ink" : "text-ink-muted hover:text-ink-soft"
          }`}
        >
          {value === "en" ? "EN" : "中"}
        </button>
      ))}
    </div>
  );
}
