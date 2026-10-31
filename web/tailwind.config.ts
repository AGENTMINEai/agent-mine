import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#04060A",
          900: "#060910",
          850: "#080C14",
          800: "#0B1019",
          750: "#101725",
        },
        ink: {
          DEFAULT: "#E8EDF5",
          soft: "#A7B2C2",
          muted: "#6B7789",
          faint: "#414B5C",
        },
        mine: {
          amber: "#3D7BFF",
          "amber-soft": "#8FB3FF",
          gold: "#2F63D9",
          cyan: "#7CC7FF",
          "cyan-soft": "#C9E4FF",
          danger: "#FF6B6B",
          ok: "#35E08F",
        },
      },
      fontFamily: {
        sans: ["var(--font-ui)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: { tightest: "-0.05em" },
      boxShadow: {
        "glow-blue": "0 0 0 1px rgba(61,123,255,0.35), 0 12px 40px -18px rgba(61,123,255,0.55)",
        panel: "0 30px 80px -40px rgba(0, 0, 0, 0.9)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%, 90%": { opacity: "0.7" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        breathe: "breathe 2.6s ease-in-out infinite",
        "scan-line": "scan-line 3.2s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
        blink: "blink 1.2s steps(1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
