import { createConfig, http } from "wagmi";
import { fallback } from "viem";
import { bsc } from "wagmi/chains";
import { injected } from "@wagmi/core";
import type { EIP1193Provider } from "viem";

export type WalletChoice = "binance" | "browser";

type WalletProvider = EIP1193Provider & {
  providers?: WalletProvider[];
  isBinance?: true;
  isBinanceWallet?: true;
  isBinanceChain?: true;
  isMetaMask?: true;
};

type WalletWindow = Window & {
  ethereum?: WalletProvider;
  binancew3w?: WalletProvider & { ethereum?: WalletProvider };
  BinanceChain?: WalletProvider;
};

type EIP6963Detail = { info: { uuid: string; name: string; rdns: string }; provider: WalletProvider };

const announced: EIP6963Detail[] = [];

function announce() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (event) => {
    const detail = (event as CustomEvent<EIP6963Detail>).detail;
    if (!detail?.provider || !detail.info?.uuid) return;
    if (!announced.some((e) => e.info.uuid === detail.info.uuid)) announced.push(detail);
  });
  announce();
}

const isBinance = (p?: WalletProvider) =>
  Boolean(p && (p.isBinance || p.isBinanceWallet || p.isBinanceChain));

const isBinanceAnnouncement = (e: EIP6963Detail) =>
  /binance/i.test(e.info.name) || /binance/i.test(e.info.rdns);

export function getBinanceProvider(): WalletProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as WalletWindow;
  const direct = w.binancew3w?.ethereum ?? w.binancew3w ?? w.BinanceChain;
  if (direct && typeof direct.request === "function") return direct;

  const multi = w.ethereum?.providers;
  if (Array.isArray(multi)) {
    const flagged = multi.find(isBinance);
    if (flagged) return flagged;
  }
  if (isBinance(w.ethereum)) return w.ethereum;

  announce();
  return announced.find(isBinanceAnnouncement)?.provider;
}

export function getBrowserProvider(): WalletProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as WalletWindow;
  const multi = w.ethereum?.providers;
  if (Array.isArray(multi)) {
    const other = multi.find((p) => p && typeof p.request === "function" && !isBinance(p));
    if (other) return other;
  }
  if (w.ethereum && typeof w.ethereum.request === "function" && !isBinance(w.ethereum)) return w.ethereum;
  announce();
  return announced.find((e) => !isBinanceAnnouncement(e))?.provider;
}

export function detectWallets() {
  return { binance: Boolean(getBinanceProvider()), browser: Boolean(getBrowserProvider()) };
}

const KEY = "agentmine.wallet";

function readPreference(): WalletChoice {
  if (typeof window === "undefined") return "binance";
  const stored = window.localStorage.getItem(KEY);
  return stored === "browser" || stored === "binance" ? stored : "binance";
}

let preferred: WalletChoice = readPreference();

export function setWalletPreference(choice: WalletChoice) {
  preferred = choice;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, choice);
}

function resolveTarget() {
  return preferred === "binance"
    ? { id: "binanceWallet", name: "Binance Wallet", provider: getBinanceProvider }
    : { id: "browserWallet", name: "Browser Wallet", provider: getBrowserProvider };
}

export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: [injected({ target: resolveTarget, shimDisconnect: true })],
  transports: {
    [bsc.id]: fallback(
      [
        process.env.NEXT_PUBLIC_BSC_RPC ?? "https://bsc-dataseed1.bnbchain.org",
        "https://bsc.blockrazor.xyz",
        "https://bsc.publicnode.com",
      ].map((url) => http(url, { timeout: 5_000, retryCount: 0 })),
      { rank: false }
    ),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
