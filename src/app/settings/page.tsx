"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { formatSGD } from "@/lib/format";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-orbit-pulse" : "bg-orbit-border"}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

function Stepper({
  value,
  onChange,
  step,
  min,
  max,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  suffix: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-orbit-border bg-orbit-surface px-2 py-1">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-5 w-5 items-center justify-center text-orbit-muted"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="whitespace-nowrap text-[13px] text-white">
        {value} {suffix}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="flex h-5 w-5 items-center justify-center text-orbit-muted"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

function Section({ label, tone, children }: { label: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-orbit-card p-4">
      <div className={`mb-3 flex items-center gap-1.5 text-[11px] font-semibold ${tone}`}>
        <span className={`h-2 w-2 rounded-full ${tone.replace("text-", "bg-")}`} />
        {label}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-orbit-border pb-3 last:border-none last:pb-0">
      <span className="text-sm text-white">{label}</span>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  const [minBalance, setMinBalance] = useState(1500);
  const [monthlyAllocation, setMonthlyAllocation] = useState(3000);
  const [risk, setRisk] = useState<"Conservative" | "Moderate" | "Aggressive">("Conservative");

  const [connectCalendar, setConnectCalendar] = useState(true);
  const [detectLifeEvents, setDetectLifeEvents] = useState(true);
  const [preTripDays, setPreTripDays] = useState(7);

  const [flagAfterDays, setFlagAfterDays] = useState(30);
  const [autoTripMode, setAutoTripMode] = useState(true);
  const [allowNegotiation, setAllowNegotiation] = useState(true);

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="Guardrails" backHref="/dashboard" />
      <p className="px-6 pb-2 pt-1 text-center text-[13px] text-orbit-muted">
        Orbit acts within these rules. Change anytime.
      </p>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-2 pb-6">
        <Section label="ORBIT YIELD" tone="text-orbit-yield">
          <Row label="Minimum account balance">
            <span className="text-sm font-bold text-orbit-yield">{formatSGD(minBalance)}</span>
          </Row>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={minBalance}
            onChange={(e) => setMinBalance(Number(e.target.value))}
            className="accent-orbit-yield"
          />
          <Row label="Monthly spending allocation">
            <input
              type="number"
              value={monthlyAllocation}
              onChange={(e) => setMonthlyAllocation(Number(e.target.value))}
              className="w-24 rounded-lg border border-orbit-border bg-orbit-surface px-2.5 py-1 text-right text-sm text-white"
            />
          </Row>
          <div>
            <p className="mb-2 text-sm text-white">Risk comfort</p>
            <div className="flex gap-1.5">
              {(["Conservative", "Moderate", "Aggressive"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className={`flex-1 rounded-full px-1 py-1.5 text-xs font-medium ${
                    risk === r
                      ? "border border-orbit-yield bg-orbit-yield/20 text-orbit-yield"
                      : "border border-orbit-border text-orbit-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section label="ORBIT PULSE" tone="text-orbit-pulse">
          <Row label="Connect calendar">
            <Toggle on={connectCalendar} onClick={() => setConnectCalendar((v) => !v)} />
          </Row>
          <Row label="Detect life events from spending">
            <Toggle on={detectLifeEvents} onClick={() => setDetectLifeEvents((v) => !v)} />
          </Row>
          <Row label="Pre-trip briefing">
            <Stepper value={preTripDays} onChange={setPreTripDays} step={1} min={1} max={30} suffix="days before" />
          </Row>
        </Section>

        <Section label="ORBIT SHIELD" tone="text-orbit-shield">
          <Row label="Flag unused subscriptions after">
            <Stepper value={flagAfterDays} onChange={setFlagAfterDays} step={5} min={7} max={90} suffix="days" />
          </Row>
          <Row label="Auto Trip Mode before travel">
            <Toggle on={autoTripMode} onClick={() => setAutoTripMode((v) => !v)} />
          </Row>
          <Row label="Allow negotiation suggestions">
            <Toggle on={allowNegotiation} onClick={() => setAllowNegotiation((v) => !v)} />
          </Row>
        </Section>
      </div>

      <div className="border-t border-orbit-border bg-orbit-surface px-6 py-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="h-[52px] w-full rounded-full bg-orbit-pulse text-[15px] font-semibold text-[#0A0F1E]"
        >
          Activate Orbit
        </button>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-orbit-muted">
          Your data is protected under Orbit&apos;s privacy framework and MAS AI Risk Management Guidelines
        </p>
      </div>
    </AppShell>
  );
}
