"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabConfig = {
  label: string;
  href: string | null;
  icon: (active: boolean) => JSX.Element;
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? "text-orbit-pulse" : "text-current"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M6.5 9.5V21h11V9.5" />
    </svg>
  );
}

function CardIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? "text-orbit-pulse" : "text-current"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M7 14h2" />
    </svg>
  );
}

function OrbitIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? "text-orbit-pulse" : "text-current"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v4" />
      <path d="M12 16v4" />
      <path d="M4 12h4" />
      <path d="M16 12h4" />
      <path d="M7 7l2 2" />
      <path d="M15 15l2 2" />
    </svg>
  );
}

function PayIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? "text-orbit-pulse" : "text-current"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M3 11h18" />
      <path d="M7 14h1" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? "text-orbit-pulse" : "text-current"}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

const TABS: TabConfig[] = [
  { label: "Home", href: "/dashboard", icon: (active) => <HomeIcon active={active} /> },
  { label: "Cards", href: "/cards", icon: (active) => <CardIcon active={active} /> },
  { label: "Orbit", href: "/approvals", icon: (active) => <OrbitIcon active={active} /> },
  { label: "Pay", href: "/pay", icon: (active) => <PayIcon active={active} /> },
  { label: "Profile", href: "/profile", icon: (active) => <ProfileIcon active={active} /> },
];

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
              className={`flex h-[24px] w-[24px] items-center justify-center rounded-md ${active ? "bg-orbit-pulse/15 text-orbit-pulse" : "text-orbit-muted"}`}
            >
              {tab.icon(active)}
            </span>
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
