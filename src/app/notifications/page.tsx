import { syncAgentActions } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusChip } from "@/components/StatusChip";
import { formatRelativeTime } from "@/lib/format";
import type { AgentName } from "@/lib/types";

// Reads live DB state (agent actions change via approve/dismiss), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

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

export default async function NotificationsPage() {
  const user = await requireUser();
  const actions = await syncAgentActions(user.id);

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="Notifications" backHref="/dashboard" />
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {actions.length === 0 ? (
          <p className="py-10 text-center text-sm text-orbit-muted">Nothing yet.</p>
        ) : (
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
                <p className="mb-2 text-sm text-white">{a.description}</p>
                {a.requiresApproval && (
                  <StatusChip tone={a.status === "approved" ? "green" : a.status === "dismissed" ? "muted" : "amber"}>
                    {a.status === "pending" ? "Awaiting approval" : a.status === "approved" ? "Approved" : "Dismissed"}
                  </StatusChip>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
