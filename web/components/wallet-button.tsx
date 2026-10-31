"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ChevronDown, LogOut, Wallet } from "lucide-react";
import { detectWallets, setWalletPreference } from "@/lib/wagmi";
import { shortAddress } from "@/lib/utils";
import { useI18n } from "@/components/providers/locale-provider";

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [wallets, setWallets] = useState({ binance: false, browser: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setWallets(detectWallets());
    const t = setInterval(() => setWallets(detectWallets()), 2500);
    return () => clearInterval(t);
  }, []);

  async function connect(choice: "binance" | "browser") {
    setError(null);
    try {
      setWalletPreference(choice);
      const connector = connectors[0];
      if (!connector) throw new Error(t.wallet.noInjected);
      await connectAsync({ connector });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (!mounted) {
    return (
      <button className="btn btn-primary opacity-70" disabled>
        {t.wallet.connect}
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="btn btn-ghost h-10 pl-3 pr-2.5 text-[12px]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-mine-ok shadow-[0_0_8px_rgba(84,230,164,0.9)]" />
          <span className="number">{shortAddress(address)}</span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
        </button>
        {open && (
          <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-lg glass-deep p-1.5 shadow-panel">
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] text-ink-soft hover:bg-white/5"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t.wallet.disconnect}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn btn-primary h-10" disabled={isPending}>
        <Wallet className="h-4 w-4" />
        {compact ? t.wallet.connect : t.wallet.connect}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-lg glass-deep p-1.5 shadow-panel">
          <button
            onClick={() => connect("binance")}
            className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-white/5"
          >
            <span className="text-[13px] font-medium">{t.wallet.binance}</span>
            <span className="label-mono text-mine-amber">{t.wallet.recommended}</span>
          </button>
          <button
            onClick={() => connect("browser")}
            className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-white/5"
          >
            <span className="text-[13px] font-medium">{t.wallet.browser}</span>
            <span className="label-mono">MetaMask / OKX</span>
          </button>
          {!wallets.binance && (
            <p className="px-3 pb-2 pt-1 text-[11px] leading-relaxed text-ink-muted">
              {t.wallet.noWallet}
            </p>
          )}
          {error && <p className="px-3 pb-2 text-[11px] text-mine-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
