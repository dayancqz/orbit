import { getGuardrails, loadLifeGraph, syncAgentActions } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { findTripEvent } from "@/lib/agents/pulse";
import { isUnused } from "@/lib/agents/shield";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ActionButtons } from "@/components/ActionButtons";
import { StatusChip } from "@/components/StatusChip";
import { formatSGD, daysSince } from "@/lib/format";
import type { PersistedAgentAction } from "@/lib/types";

// Reads live DB state (agent actions change via approve/dismiss), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

// Mirrors isUnused()'s decision exactly, so a subscription's chip never
// disagrees with whether it actually has Cancel/Keep buttons.
function usageLabel(
  sub: { usageScore: number; lastUsedAt?: string },
  flagAfterDays: number
): { text: string; tone: "green" | "amber" | "red" } {
  if (isUnused(sub, flagAfterDays)) {
    const since = sub.lastUsedAt ? daysSince(sub.lastUsedAt) : null;
    return { text: since !== null ? `Unused ${since} days` : "Unused", tone: "red" };
  }
  if (sub.usageScore >= 0.7) return { text: "Used regularly", tone: "green" };
  return { text: "Low usage", tone: "amber" };
}

export default async function ShieldPage() {
  const user = await requireUser();
  const [graph, actions, settings] = await Promise.all([
    loadLifeGraph(user.id),
    syncAgentActions(user.id),
    getGuardrails(user.id),
  ]);
  const trip = findTripEvent(graph);
  const tripModeActive = trip && actions.some((a) => a.id === `shield_tripmode_${trip.id}`);

  const activeSubs = graph.subscriptions.filter((s) => s.status !== "cancelled");
  const monthlyTotal = activeSubs.reduce((sum, s) => sum + s.monthlyAmount, 0);
  const flaggedCount = activeSubs.filter((s) => isUnused(s, settings.flagAfterDays)).length;
  const cancelledSubs = graph.subscriptions.filter((s) => s.status === "cancelled");
  const savedThisYear = cancelledSubs.reduce((sum, s) => sum + s.monthlyAmount * 12, 0);
  const allocationPct = settings.monthlyAllocation > 0 ? (monthlyTotal / settings.monthlyAllocation) * 100 : 0;

  const actionFor = (subId: string): PersistedAgentAction | undefined =>
    actions.find((a) => a.id === `shield_${subId}`);

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="Spend Health" backHref="/dashboard" agent="shield" />

      {tripModeActive && (
        <div className="border-b border-orbit-pulse bg-orbit-pulse/10 px-6 py-2.5 text-center text-xs text-orbit-pulse">
          Trip Mode active — monitoring extra charges before your trip
        </div>
      )}

      <div className="mx-4 mt-3 rounded-2xl border-l-4 border-orbit-shield bg-orbit-card p-4">
        <p className="mb-2 text-[11px] font-medium text-orbit-shield">SUBSCRIPTIONS</p>
        <div className="flex">
          <div className="flex-1 border-r border-orbit-border pr-2">
            <p className={`text-[22px] font-bold ${allocationPct > 100 ? "text-orbit-shield" : "text-white"}`}>
              {formatSGD(monthlyTotal)}
            </p>
            <p className="mt-0.5 text-xs text-orbit-muted">
              {allocationPct.toFixed(0)}% of your {formatSGD(settings.monthlyAllocation)} allocation
            </p>
          </div>
          <div className="flex-1 pl-4">
            <p className="text-[22px] font-bold text-orbit-shield">{flaggedCount}</p>
            <p className="mt-0.5 text-xs text-orbit-muted">flagged as unused</p>
          </div>
        </div>
        {allocationPct > 100 && (
          <div className="mt-2.5 rounded-lg bg-orbit-shield/10 px-3 py-2 text-[13px] text-orbit-shield">
            You&apos;re over your monthly subscription allocation
          </div>
        )}
        {savedThisYear > 0 && (
          <div className="mt-2.5 rounded-lg bg-orbit-yield/10 px-3 py-2 text-[13px] text-orbit-yield">
            You&apos;ve saved {formatSGD(savedThisYear)}/yr by cancelling with Orbit Shield
          </div>
        )}
      </div>

      <div className="mx-4 mt-3 flex-1 overflow-hidden rounded-2xl bg-orbit-card">
        <p className="border-b border-orbit-border px-4 py-3.5 text-[15px] font-semibold text-white">
          Your Subscriptions
        </p>
        {graph.subscriptions.map((sub) => {
          const usage = usageLabel(sub, settings.flagAfterDays);
          const action = actionFor(sub.id);
          const cancelled = sub.status === "cancelled";

          return (
            <div key={sub.id} className="flex items-center gap-2.5 border-b border-orbit-border px-4 py-2.5 last:border-none">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orbit-border text-xs font-bold text-white">
                {sub.merchant.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{sub.merchant}</p>
                <p className="text-xs text-orbit-muted">{formatSGD(sub.monthlyAmount)}/mo</p>
                {!cancelled && (
                  <span className="mt-1 inline-block">
                    <StatusChip tone={usage.tone}>{usage.text}</StatusChip>
                  </span>
                )}
              </div>
              <div className="shrink-0">
                {cancelled ? (
                  <StatusChip tone="muted">Cancelled</StatusChip>
                ) : action && action.status === "pending" ? (
                  <ActionButtons actionId={action.id} approveLabel="Cancel" dismissLabel="Keep" compact />
                ) : action && action.status === "dismissed" ? (
                  <StatusChip tone="muted">Kept</StatusChip>
                ) : (
                  <span className="text-xs font-medium text-orbit-yield">Active</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-4" />
    </AppShell>
  );
}
