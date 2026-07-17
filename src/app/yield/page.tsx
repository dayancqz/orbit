import { getDemoUser, loadLifeGraph, syncAgentActions } from "@/lib/db";
import { BETTER_FD_RATE, FD_TERM_DAYS, MIN_BUFFER } from "@/lib/agents/yieldAgent";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ActionButtons } from "@/components/ActionButtons";
import { StatusChip } from "@/components/StatusChip";
import { formatSGD } from "@/lib/format";

// Reads live DB state (agent actions change via approve/dismiss), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

export default async function YieldPage() {
  const user = await getDemoUser();
  const [graph, actions] = await Promise.all([loadLifeGraph(user.id), syncAgentActions(user.id)]);
  const recommendation = actions.find((a) => a.agent === "yield" && a.actionType === "recommendation");
  const account = graph.accounts.find((a) => `yield_${a.id}` === recommendation?.id) ?? graph.accounts[0];

  if (!recommendation || !account) {
    return (
      <AppShell withBottomNav={false}>
        <PageHeader title="Money Optimisation" backHref="/dashboard" agent="yield" />
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-orbit-muted">
          No idle money detected right now.
        </div>
      </AppShell>
    );
  }

  const transferAmount = account.balance - MIN_BUFFER;
  const accessiblePct = Math.min(100, Math.max(0, (MIN_BUFFER / account.balance) * 100));

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="Money Optimisation" backHref="/dashboard" agent="yield" />

      <div className="border-t-[3px] border-orbit-yield bg-orbit-card px-6 py-4">
        <p className="mb-1 text-[11px] font-medium text-orbit-yield">IDLE FUNDS DETECTED</p>
        <p className="text-2xl font-bold text-white">
          {formatSGD(account.balance)} idle in {account.name}
        </p>
        <p className="mt-1 text-[13px] text-orbit-muted">This money could be earning interest</p>
      </div>

      <div className="mx-4 mt-3 rounded-2xl border border-orbit-border bg-orbit-card2 p-4">
        <span className="mb-2 inline-block rounded-full bg-orbit-yield/15 px-2.5 py-0.5 text-[11px] font-medium text-orbit-yield">
          RECOMMENDED
        </span>
        <p className="text-xl font-bold text-white">{FD_TERM_DAYS}-Day Fixed Deposit</p>
        <p className="my-1 text-[28px] font-bold text-orbit-yield">{(BETTER_FD_RATE * 100).toFixed(1)}% p.a.</p>
        <p className="text-sm text-white">Move {formatSGD(transferAmount)} — keeps {formatSGD(MIN_BUFFER)} accessible</p>
      </div>

      <div className="mx-4 mt-3 rounded-xl bg-orbit-card p-4">
        <p className="mb-2.5 text-sm text-white">Your safety buffer is protected</p>
        <div className="relative mb-1.5 h-2 rounded-full bg-orbit-border">
          <div className="h-full rounded-full bg-orbit-yield" style={{ width: `${accessiblePct}%` }} />
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] text-orbit-yield">{formatSGD(MIN_BUFFER)} accessible</span>
          <span className="text-[11px] text-orbit-muted">{formatSGD(MIN_BUFFER)} minimum</span>
        </div>
      </div>

      <div className="mx-4 mt-3 flex-1 rounded-xl bg-orbit-card p-4">
        <p className="mb-2 text-xs text-orbit-muted">Other options (indicative rates)</p>
        <div className="flex items-center justify-between border-b border-orbit-border py-2.5">
          <span className="text-sm text-white">{FD_TERM_DAYS}-Day Fixed Deposit</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-orbit-yield">{(BETTER_FD_RATE * 100).toFixed(1)}% p.a.</span>
            <StatusChip tone="green">Best</StatusChip>
          </div>
        </div>
        <div className="flex items-center justify-between border-b border-orbit-border py-2.5">
          <span className="text-sm text-orbit-muted">Savings Bond</span>
          <span className="text-sm font-bold text-orbit-muted">2.8% p.a.</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-sm text-orbit-muted">Money Market Fund</span>
          <span className="text-sm font-bold text-orbit-muted">2.1% p.a.</span>
        </div>
      </div>

      <div className="mt-4 border-t border-orbit-border bg-orbit-surface px-6 py-4">
        {recommendation.status === "pending" ? (
          <ActionButtons actionId={recommendation.id} approveLabel={`Approve Transfer of ${formatSGD(transferAmount)}`} />
        ) : (
          <div className="flex justify-center">
            <StatusChip tone={recommendation.status === "approved" ? "green" : "muted"}>
              {recommendation.status === "approved" ? "Approved" : "Dismissed"}
            </StatusChip>
          </div>
        )}
        <p className="mt-2.5 text-center text-[11px] text-orbit-muted">
          Powered by Orbit Yield · Coordinated with Orbit Pulse
        </p>
      </div>
    </AppShell>
  );
}
