"use client";

import { useState } from "react";

// The explainability piece: every agent action can carry a plain-English
// "why" (see reasoning on AgentAction) distinct from its description —
// this is what actually backs up "MAS-compliant, explainable AI" with real
// UI instead of just pitch-deck copy.
export function ReasoningDisclosure({ reasoning }: { reasoning?: string }) {
  const [open, setOpen] = useState(false);
  if (!reasoning) return null;

  return (
    <div className="mt-2.5 text-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-medium text-orbit-muted underline decoration-dotted underline-offset-2"
      >
        {open ? "Hide reasoning" : "Why did Orbit suggest this?"}
      </button>
      {open && <p className="mt-1.5 text-left text-[11px] leading-relaxed text-orbit-muted">{reasoning}</p>}
    </div>
  );
}
