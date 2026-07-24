import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { buildThemeVars, parseAppearance } from "@/lib/theme";

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
  const appearance = parseAppearance(cookies().get("orbit_appearance")?.value);
  const mode = appearance.themeMode;
  const accent = appearance.accentColor;
  const vars = buildThemeVars(mode, accent);

  return (
    <html lang="en" style={{ colorScheme: mode }}>
      <body className={inter.className} style={vars as React.CSSProperties}>
        {children}
      </body>
    </html>
  );
}
