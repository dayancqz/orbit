"use client";

import { useState } from "react";
import { StatusChip } from "./StatusChip";
import { ReasoningDisclosure } from "./ReasoningDisclosure";
import { formatRelativeTime } from "@/lib/format";
import type { AgentName, PersistedAgentAction } from "@/lib/types";

const AGENT_LABEL: Record<AgentName, string> = {
  pulse: "Orbit Pulse",
  yield: "Orbit Yield",
  shield: "Orbit Shield",
};
const AGENT_DOT: Record<AgentName, string> = {
  pulse: "bg-orbit-pulse",
  yield: "bg-orbit-yield",
  shield: "bg-orbit-shield",
};

export function NotificationsList({
  initialActions,
  initialCursor,
}: {
  initialActions: PersistedAgentAction[];
  initialCursor: string | null;
}) {
  const [actions, setActions] = useState(initialActions);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/actions?cursor=${encodeURIComponent(cursor)}&limit=20`);
    setLoading(false);

    if (!res.ok) {
      setError("Couldn't load more — try again.");
      return;
    }

    const data = await res.json();
    setActions((prev) => [...prev, ...data.actions]);
    setCursor(data.nextCursor);
  }

  if (actions.length === 0) {
    return <p className="py-10 text-center text-sm text-orbit-muted">Nothing yet.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {actions.map((a) => (
          <li key={a.id} className="rounded-2xl border border-orbit-border bg-orbit-card p-3.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-orbit-muted">
                <span className={`h-2 w-2 rounded-full ${AGENT_DOT[a.agent]}`} />
                {AGENT_LABEL[a.agent]}
              </span>
              <span className="shrink-0 text-[11px] text-orbit-muted">{formatRelativeTime(a.timestamp)}</span>
            </div>
            <p className="mb-2 text-sm text-orbit-text">{a.description}</p>
            {a.requiresApproval && (
              <StatusChip tone={a.status === "approved" ? "green" : a.status === "dismissed" ? "muted" : "amber"}>
                {a.status === "pending" ? "Awaiting approval" : a.status === "approved" ? "Approved" : "Dismissed"}
              </StatusChip>
            )}
            <ReasoningDisclosure reasoning={a.reasoning} />
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-center text-xs text-orbit-shield">{error}</p>}

      {cursor && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-3 w-full rounded-full border border-orbit-border py-2.5 text-sm font-medium text-orbit-muted disabled:opacity-60"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </>
  );
}
