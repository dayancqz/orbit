import { getDemoUser, syncAgentActions } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { BottomNav } from "@/components/BottomNav";

// Reads live DB state (agent actions change via approve/dismiss), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";
import { AgentCard } from "@/components/AgentCard";
import { Timeline } from "@/components/Timeline";
import Link from "next/link";
import type { PersistedAgentAction, AgentName } from "@/lib/types";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function summaryFor(actions: PersistedAgentAction[], agent: AgentName) {
  const forAgent = actions.filter((a) => a.agent === agent);
  // Prefer something the user still needs to act on over a passive/autonomous
  // update, so the card surfaces what's actually actionable first.
  const needsApproval = forAgent.find((a) => a.status === "pending" && a.requiresApproval);
  const anyPending = forAgent.find((a) => a.status === "pending");
  const top = needsApproval ?? anyPending ?? forAgent[0];

  const FALLBACK: Record<AgentName, string> = {
    pulse: "No upcoming trips detected",
    yield: "No idle money detected",
    shield: "No subscriptions flagged",
  };

  return top?.description ?? FALLBACK[agent];
}

export default async function DashboardPage() {
  const user = await getDemoUser();
  const actions = await syncAgentActions(user.id);
  const pendingAgentCount = new Set(
    actions.filter((a) => a.status === "pending" && a.requiresApproval).map((a) => a.agent)
  ).size;

  return (
    <AppShell>
      <header className="flex h-[72px] shrink-0 items-center justify-between bg-orbit-surface px-6">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-white">Orbit</span>
          <span className="ml-1 h-4 w-4 rounded-full border-2 border-orbit-pulse" />
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-orbit-card2 text-orbit-muted"
            aria-label="Guardrails settings"
          >
            ⚙
          </Link>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orbit-card2 text-orbit-muted">
            🔔
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orbit-card2 text-xs font-medium text-orbit-muted">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      </header>

      <div className="bg-orbit-surface px-6 pb-4 pt-5">
        <h1 className="text-[26px] font-bold text-white">
          {greeting()}, {user.name}
        </h1>
        <p className="mt-1.5 text-sm text-orbit-muted">
          {pendingAgentCount > 0
            ? `${pendingAgentCount} agent${pendingAgentCount === 1 ? "" : "s"} working for you right now`
            : "All caught up — nothing needs your attention"}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-6 pt-4">
        <AgentCard agent="pulse" title={summaryFor(actions, "pulse")} subtitle="Life Planner" href="/pulse" />
        <AgentCard agent="yield" title={summaryFor(actions, "yield")} subtitle="Wealth Optimiser" href="/yield" />
        <AgentCard agent="shield" title={summaryFor(actions, "shield")} subtitle="Spend Guardian" href="/shield" />
      </div>

      <div className="mt-6 px-6">
        <h2 className="mb-2 text-[15px] font-semibold text-white">Recent Activity</h2>
        <Timeline actions={actions.slice(0, 6)} />
      </div>

      <BottomNav />
    </AppShell>
  );
}
