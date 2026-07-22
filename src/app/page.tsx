"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { GlobeAnimation } from "@/components/GlobeAnimation";

export default function SplashPage() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  function enterOrbit() {
    setEntering(true);
    setTimeout(() => router.push("/signup"), 900);
  }

  return (
    <AppShell withBottomNav={false}>
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,194,199,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <GlobeAnimation />

      <div className="relative px-8 text-center">
        <p className="text-[36px] font-bold leading-none text-white">Orbit</p>
        <p className="mt-1.5 text-xs tracking-wide text-orbit-muted">Your money, always working</p>
      </div>

      <div className="relative flex flex-col items-center gap-3.5 px-8 pb-14 pt-10">
        {entering ? (
          <div className="flex h-[54px] items-center gap-3 text-sm text-orbit-muted">
            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-orbit-pulse/20 border-t-orbit-pulse" />
            Loading your Orbit...
          </div>
        ) : (
          <>
            <button
              onClick={enterOrbit}
              className="h-[54px] w-full rounded-full bg-gradient-to-br from-orbit-pulse to-[#00a8ad] text-base font-semibold text-[#050a14] shadow-lg shadow-orbit-pulse/20 transition hover:shadow-orbit-pulse/40"
            >
              Enter Orbit
            </button>
            <Link href="/login" className="text-[13px] text-orbit-muted">
              Already a member? <span className="font-medium text-orbit-pulse">Log in</span>
            </Link>
          </>
        )}
      </div>
    </AppShell>
  );
}
