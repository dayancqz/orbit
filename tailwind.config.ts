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
          bg: "#0a0e1a",
          pulse: "#22d3ee",
          yield: "#2dd4bf",
          shield: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
