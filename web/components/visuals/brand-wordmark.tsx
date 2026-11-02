"use client";

import { useI18n } from "@/components/providers/locale-provider";

export function BrandWordmark({ className = "" }: { className?: string }) {
  const { locale } = useI18n();
  const zh = locale === "zh";

  return (
    <span
      className={`font-display font-semibold uppercase leading-none ${className}`}
      style={{ letterSpacing: zh ? "0.06em" : "0.12em" }}
    >
      <span className="brand-gold">AI</span>
      {zh ? null : " "}
      <span className="brand-blue">{zh ? "矿工" : "MINER"}</span>
    </span>
  );
}
