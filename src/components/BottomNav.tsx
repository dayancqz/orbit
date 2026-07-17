"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Home", href: "/dashboard" },
  { label: "Cards", href: null },
  { label: "Orbit", href: "/approvals" },
  { label: "Pay", href: null },
  { label: "Profile", href: null },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex h-[82px] w-full max-w-md items-start gap-1 border-t border-orbit-border bg-orbit-surface pt-2.5">
      {TABS.map((tab) => {
        const active = tab.href !== null && pathname.startsWith(tab.href);
        const inner = (
          <>
            {active && <span className="h-1 w-1 rounded-full bg-orbit-pulse" />}
            <span
              className={`h-[22px] w-[22px] rounded ${active ? "bg-orbit-pulse" : "bg-orbit-border opacity-50"}`}
            />
            <span className={`text-[11px] ${active ? "text-orbit-pulse" : "text-orbit-muted"}`}>
              {tab.label}
            </span>
          </>
        );

        if (!tab.href) {
          return (
            <div
              key={tab.label}
              className="flex flex-1 cursor-not-allowed flex-col items-center gap-1 opacity-40"
            >
              {inner}
            </div>
          );
        }

        return (
          <Link key={tab.label} href={tab.href} className="flex flex-1 flex-col items-center gap-1">
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
