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
          bg: "#050a14",
          surface: "#0a0e1a",
          card: "#141d2f",
          card2: "#1a2438",
          border: "#2a3a5c",
          muted: "#b0b8c9",
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
      },
      animation: {
        "globe-spin": "globe-spin 8s linear infinite",
        "globe-spin-reverse": "globe-spin-reverse 12s linear infinite",
        "ring-pulse": "ring-pulse 3s ease-in-out infinite",
        "ring-pulse-2": "ring-pulse 3s ease-in-out infinite 0.8s",
        "ring-pulse-3": "ring-pulse 3s ease-in-out infinite 1.6s",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "float-particle": "float-particle 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
