import Link from "next/link";
import { syncAgentActions } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/BottomNav";
import { ActionButtons } from "@/components/ActionButtons";
import { StatusChip } from "@/components/StatusChip";
import type { AgentName } from "@/lib/types";

// Reads live DB state (agent actions change via approve/dismiss), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

const AGENT_DOT: Record<AgentName, string> = {
  pulse: "bg-orbit-pulse",
  yield: "bg-orbit-yield",
  shield: "bg-orbit-shield",
};
const AGENT_TEXT: Record<AgentName, string> = {
  pulse: "text-orbit-pulse",
  yield: "text-orbit-yield",
  shield: "text-orbit-shield",
};
const AGENT_LABEL: Record<AgentName, string> = {
  pulse: "ORBIT PULSE",
  yield: "ORBIT YIELD",
  shield: "ORBIT SHIELD",
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: { history?: string };
}) {
  const user = await requireUser();
  const actions = await syncAgentActions(user.id);
  const showHistory = searchParams?.history === "1";

  const relevant = actions.filter((a) => a.requiresApproval);
  const pending = relevant.filter((a) => a.status === "pending");
  const list = showHistory ? relevant : pending;

  return (
    <AppShell>
      <div className="bg-orbit-surface px-6 pb-2 pt-4 text-center">
        <h1 className="text-[17px] font-semibold text-white">
          {showHistory ? "Past agent decisions" : "Orbit needs your approval"}
        </h1>
        <p className="mt-1 text-[13px] text-orbit-muted">
          {showHistory
            ? `${relevant.length} total action${relevant.length === 1 ? "" : "s"}`
            : `${pending.length} action${pending.length === 1 ? "" : "s"} pending`}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-orbit-muted">
            {showHistory ? "No decisions yet." : "Nothing pending — you're all caught up."}
          </p>
        )}
        {list.map((action) => (
          <div
            key={action.id}
            className="relative overflow-hidden rounded-2xl border border-orbit-border bg-orbit-card py-3.5 pl-[18px] pr-3.5"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${AGENT_DOT[action.agent]}`} />
            <div className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-medium ${AGENT_TEXT[action.agent]}`}>
              <span className={`h-2 w-2 rounded-full ${AGENT_DOT[action.agent]}`} />
              {AGENT_LABEL[action.agent]}
            </div>
            <p className="mb-2.5 text-[15px] font-semibold leading-snug text-white">{action.description}</p>
            {action.status === "pending" ? (
              <ActionButtons actionId={action.id} compact />
            ) : (
              <StatusChip tone={action.status === "approved" ? "green" : "muted"}>
                {action.status === "approved" ? "Approved" : "Dismissed"}
              </StatusChip>
            )}
          </div>
        ))}
      </div>

      <div className="px-6 pb-4 pt-2 text-center">
        <p className="text-xs leading-relaxed text-orbit-muted">
          Orbit never acts without your approval for actions above your set thresholds.
        </p>
        <Link href={showHistory ? "/approvals" : "/approvals?history=1"} className="mt-1.5 block text-xs text-orbit-pulse">
          {showHistory ? "Back to pending approvals" : "View all past agent decisions →"}
        </Link>
      </div>

      <BottomNav />
    </AppShell>
  );
}
