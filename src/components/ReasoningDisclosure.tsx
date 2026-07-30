"use client";

import { useState } from "react";
import type { AgentName } from "@/lib/types";

// The explainability piece: every agent action can carry a plain-English
// "why" (see reasoning on AgentAction) distinct from its description —
// this is what actually backs up "MAS-compliant, explainable AI" with real
// UI instead of just pitch-deck copy. Styled as a small trace/ledger reveal
// (monospace, agent-colored) rather than a plain text link, since this is
// meant to read as a signature interaction, not a footnote.

const AGENT_STYLES: Record<AgentName, { text: string; dot: string; border: string }> = {
  pulse: { text: "text-orbit-pulse", dot: "bg-orbit-pulse", border: "border-orbit-pulse/30" },
  yield: { text: "text-orbit-yield", dot: "bg-orbit-yield", border: "border-orbit-yield/30" },
  shield: { text: "text-orbit-shield", dot: "bg-orbit-shield", border: "border-orbit-shield/30" },
};
const DEFAULT_STYLE = { text: "text-orbit-accent", dot: "bg-orbit-accent", border: "border-orbit-accent/30" };

export function ReasoningDisclosure({ reasoning, agent }: { reasoning?: string; agent?: AgentName }) {
  const [open, setOpen] = useState(false);
  if (!reasoning) return null;

  const style = agent ? AGENT_STYLES[agent] : DEFAULT_STYLE;

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full border ${style.border} bg-orbit-bg/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${style.text}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {open ? "Hide reasoning" : "Reasoning trace"}
      </button>

      {open && (
        <div className={`mt-1.5 animate-trace-in rounded-xl border ${style.border} bg-orbit-bg/50 p-3`}>
          <p className="font-mono text-[11px] leading-relaxed text-orbit-muted">{reasoning}</p>
        </div>
      )}
    </div>
  );
}
