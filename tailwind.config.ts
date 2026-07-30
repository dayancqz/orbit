import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orbit: {
          // User-customizable (see src/lib/theme.ts + app/layout.tsx, which
          // sets these CSS variables per-request based on the logged-in
          // user's saved theme/accent).
          bg: "var(--orbit-bg)",
          surface: "var(--orbit-surface)",
          card: "var(--orbit-card)",
          card2: "var(--orbit-card2)",
          border: "var(--orbit-border)",
          muted: "var(--orbit-muted)",
          text: "var(--orbit-text)",
          accent: "rgb(var(--orbit-accent-rgb) / <alpha-value>)",
          "accent-contrast": "var(--orbit-accent-contrast)",
          // Fixed agent brand colors — not user-customizable, since they're
          // how Pulse/Yield/Shield stay visually distinguishable regardless
          // of a user's accent choice.
          pulse: "#22d3ee",
          yield: "#2dd4bf",
          shield: "#ef4444",
        },
      },
      keyframes: {
        "globe-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "globe-spin-reverse": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(-360deg)" },
        },
        "ring-pulse": {
          "0%, 100%": { opacity: "0.08" },
          "50%": { opacity: "0.22" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "float-particle": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "50%": { transform: "translateY(-14px)", opacity: "1" },
        },
        "trace-in": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "cascade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "globe-spin": "globe-spin 8s linear infinite",
        "globe-spin-reverse": "globe-spin-reverse 12s linear infinite",
        "ring-pulse": "ring-pulse 3s ease-in-out infinite",
        "ring-pulse-2": "ring-pulse 3s ease-in-out infinite 0.8s",
        "ring-pulse-3": "ring-pulse 3s ease-in-out infinite 1.6s",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "float-particle": "float-particle 4s ease-in-out infinite",
        "trace-in": "trace-in 0.25s ease-out",
        "cascade-in": "cascade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
