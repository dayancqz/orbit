import Link from "next/link";
import type { AgentName } from "@/lib/types";
import { PulseMotif } from "./PulseMotif";
import { YieldMotif } from "./YieldMotif";
import { ShieldMotif } from "./ShieldMotif";

const AGENT_META: Record<
  AgentName,
  { label: string; color: string; bg: string; icon: React.ReactNode; motif: React.ReactNode }
> = {
  pulse: {
    label: "ORBIT PULSE",
    color: "text-orbit-pulse",
    bg: "bg-orbit-pulse",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12">
        <polyline points="0,6 3,6 4,2 5,10 6,4 7,8 8,6 12,6" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
      </svg>
    ),
    motif: <PulseMotif className="right-[-20px] top-1/2 h-[85px] w-[85px] -translate-y-1/2" />,
  },
  yield: {
    label: "ORBIT YIELD",
    color: "text-orbit-yield",
    bg: "bg-orbit-yield",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12">
        <polyline points="1,10 5,5 7,7 11,2" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
        <polyline points="8,2 11,2 11,5" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
      </svg>
    ),
    motif: <YieldMotif className="bottom-[-15px] right-[-10px] h-[60px] w-[100px]" />,
  },
  shield: {
    label: "ORBIT SHIELD",
    color: "text-orbit-shield",
    bg: "bg-orbit-shield",
    icon: (
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M6 1 L11 3 L11 7 C11 9.5 6 11.5 6 11.5 C6 11.5 1 9.5 1 7 L1 3 Z" fill="none" stroke="#ef4444" strokeWidth="1.5" />
      </svg>
    ),
    motif: <ShieldMotif className="right-0 top-0 h-full w-[90px]" />,
  },
};

export function AgentCard({
  agent,
  title,
  subtitle,
  href,
}: {
  agent: AgentName;
  title: string;
  subtitle: string;
  href: string;
}) {
  const meta = AGENT_META[agent];

  return (
    <Link
      href={href}
      className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-orbit-border bg-orbit-card py-3.5 pr-3.5"
    >
      {meta.motif}
      <span className={`relative self-stretch w-1 shrink-0 ${meta.bg}`} />
      <span
        className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] ${meta.color}`}
      >
        {meta.icon}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className={`block text-[11px] font-semibold ${meta.color}`}>{meta.label}</span>
        <span className="block truncate text-sm font-semibold text-orbit-text">{title}</span>
        <span className="mt-0.5 block text-xs text-orbit-muted">{subtitle}</span>
      </span>
      <span className="relative text-lg text-orbit-muted">›</span>
    </Link>
  );
}
