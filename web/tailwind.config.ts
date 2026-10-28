import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#040507",
          900: "#07080C",
          850: "#0A0C11",
          800: "#0E1016",
          750: "#14171F",
        },
        ink: {
          DEFAULT: "#EEF0F5",
          soft: "#B6BAC6",
          muted: "#7B8090",
          faint: "#4E5361",
        },
        mine: {
          amber: "#FFB454",
          "amber-soft": "#FFD9A3",
          gold: "#F2C14E",
          cyan: "#4DE1FF",
          "cyan-soft": "#A8F0FF",
          danger: "#FF6B6B",
          ok: "#54E6A4",
        },
      },
      fontFamily: {
        sans: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: { tightest: "-0.055em" },
      boxShadow: {
        "glow-amber": "0 0 40px -10px rgba(255, 180, 84, 0.55)",
        "glow-cyan": "0 0 40px -10px rgba(77, 225, 255, 0.5)",
        panel: "0 40px 90px -50px rgba(0, 0, 0, 0.95)",
      },
      keyframes: {
        "aurora-a": {
          "0%, 100%": { transform: "translate3d(-4%, -2%, 0) scale(1)" },
          "50%": { transform: "translate3d(6%, 4%, 0) scale(1.12)" },
        },
        "aurora-b": {
          "0%, 100%": { transform: "translate3d(3%, 2%, 0) scale(1.05)" },
          "50%": { transform: "translate3d(-6%, -3%, 0) scale(0.94)" },
        },
        breathe: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-140%)" },
          "100%": { transform: "translateX(240%)" },
        },
        "spin-slow": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        "spin-reverse": { from: { transform: "rotate(360deg)" }, to: { transform: "rotate(0deg)" } },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-9px)" },
        },
        scan: {
          "0%": { transform: "translateY(-120%)", opacity: "0" },
          "12%, 88%": { opacity: "0.9" },
          "100%": { transform: "translateY(520%)", opacity: "0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.55" },
          "70%": { transform: "scale(1.65)", opacity: "0" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "aurora-a": "aurora-a 30s ease-in-out infinite",
        "aurora-b": "aurora-b 38s ease-in-out infinite",
        breathe: "breathe 2.8s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
        "spin-slow": "spin-slow 70s linear infinite",
        "spin-reverse": "spin-reverse 100s linear infinite",
        float: "float 7s ease-in-out infinite",
        scan: "scan 5s ease-in-out infinite",
        "pulse-ring": "pulse-ring 3s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
