import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { buildThemeVars, DEFAULT_ACCENT, DEFAULT_THEME, isAccentKey, isThemeMode } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Orbit — Your money, always working",
  description: "A persistent, multi-agent AI system that runs your financial life.",
};

// Every page (including logged-out ones) renders with a real theme from the
// first paint — no flash of the wrong colors while a client-side theme
// context spins up. Logged-in users get their saved theme/accent; everyone
// else gets the app default.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const mode = user && isThemeMode(user.themeMode) ? user.themeMode : DEFAULT_THEME;
  const accent = user && isAccentKey(user.accentColor) ? user.accentColor : DEFAULT_ACCENT;
  const vars = buildThemeVars(mode, accent);

  return (
    <html lang="en" style={{ colorScheme: mode }}>
      <body className={inter.className} style={vars as React.CSSProperties}>
        {children}
      </body>
    </html>
  );
}
