import { getGuardrails, loadLifeGraph, syncAgentActions } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { YIELD_TIERS, MIN_BUFFER } from "@/lib/agents/yieldAgent";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ActionButtons } from "@/components/ActionButtons";
import { StatusChip } from "@/components/StatusChip";
import { ReasoningDisclosure } from "@/components/ReasoningDisclosure";
import { YieldMotif } from "@/components/YieldMotif";
import { formatSGD } from "@/lib/format";
import type { GuardrailSettings, LifeGraphAccount, PersistedAgentAction } from "@/lib/types";

// Reads live DB state (agent actions change via approve/dismiss), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

const TIER_ORDER: GuardrailSettings["riskComfort"][] = ["Conservative", "Moderate", "Aggressive"];

function RecommendationCard({
  account,
  recommendation,
  minBalance,
  riskComfort,
}: {
  account: LifeGraphAccount;
  recommendation: PersistedAgentAction;
  minBalance: number;
  riskComfort: GuardrailSettings["riskComfort"];
}) {
  const tier = YIELD_TIERS[riskComfort];
  const transferAmount = recommendation.amount ?? account.balance - minBalance;
  const accessiblePct = Math.min(100, Math.max(0, (minBalance / account.balance) * 100));

  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-orbit-border">
      <div className="relative overflow-hidden border-t-[3px] border-orbit-yield bg-orbit-card px-5 py-4">
        <YieldMotif className="bottom-[-10px] right-[-10px] h-[110px] w-[180px]" />
        <div className="relative">
          <p className="mb-1 text-[11px] font-medium text-orbit-yield">IDLE FUNDS DETECTED</p>
          <p className="text-2xl font-bold text-orbit-text">
            {formatSGD(account.balance)} idle in {account.name}
          </p>
          <p className="mt-1 text-[13px] text-orbit-muted">This money could be earning interest</p>
        </div>
      </div>

      <div className="border-t border-orbit-border bg-orbit-card2 p-4">
        <span className="mb-2 inline-block rounded-full bg-orbit-yield/15 px-2.5 py-0.5 text-[11px] font-medium text-orbit-yield">
          RECOMMENDED · {riskComfort.toUpperCase()}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-orbit-muted">Move to {tier.product}</p>
        <p className="text-[44px] font-bold leading-none tracking-tight text-orbit-text">
          {formatSGD(transferAmount)}
        </p>
        <p className="mt-1.5 text-sm text-orbit-text">
          at <span className="font-bold text-orbit-yield">{(tier.rate * 100).toFixed(1)}% p.a.</span> — keeps{" "}
          {formatSGD(minBalance)} accessible
        </p>
      </div>

      <div className="border-t border-orbit-border bg-orbit-card p-4">
        <p className="mb-2.5 text-sm text-orbit-text">Your safety buffer is protected</p>
        <div className="relative mb-1.5 h-2 rounded-full bg-orbit-border">
          <div className="h-full rounded-full bg-orbit-yield" style={{ width: `${accessiblePct}%` }} />
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] text-orbit-yield">{formatSGD(minBalance)} accessible</span>
          <span className="text-[11px] text-orbit-muted">{formatSGD(minBalance)} minimum</span>
        </div>
      </div>

      <div className="border-t border-orbit-border bg-orbit-card p-4">
        <p className="mb-2 text-xs text-orbit-muted">Other tiers (indicative rates)</p>
        {TIER_ORDER.map((tierName) => (
          <div
            key={tierName}
            className="flex items-center justify-between border-b border-orbit-border py-2.5 last:border-none"
          >
            <span className={`text-sm ${tierName === riskComfort ? "text-orbit-text" : "text-orbit-muted"}`}>
              {YIELD_TIERS[tierName].product}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold ${tierName === riskComfort ? "text-orbit-yield" : "text-orbit-muted"}`}
              >
                {(YIELD_TIERS[tierName].rate * 100).toFixed(1)}% p.a.
              </span>
              {tierName === riskComfort && <StatusChip tone="green">Your tier</StatusChip>}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-orbit-border bg-orbit-surface p-4">
        {recommendation.status === "pending" ? (
          <ActionButtons actionId={recommendation.id} approveLabel={`Approve Transfer of ${formatSGD(transferAmount)}`} />
        ) : (
          <div className="flex justify-center">
            <StatusChip tone={recommendation.status === "approved" ? "green" : "muted"}>
              {recommendation.status === "approved" ? "Approved" : "Dismissed"}
            </StatusChip>
          </div>
        )}
        <ReasoningDisclosure reasoning={recommendation.reasoning} agent="yield" />
      </div>
    </div>
  );
}

export default async function YieldPage() {
  const user = await requireUser();
  const [graph, actions, settings] = await Promise.all([
    loadLifeGraph(user.id),
    syncAgentActions(user.id),
    getGuardrails(user.id),
  ]);
  const recommendations = actions.filter((a) => a.agent === "yield" && a.actionType === "recommendation");

  if (recommendations.length === 0) {
    return (
      <AppShell withBottomNav={false}>
        <PageHeader title="Money Optimisation" backHref="/dashboard" agent="yield" />
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-orbit-muted">
          No idle money detected right now — anything above {formatSGD(MIN_BUFFER)} across your accounts will show up here.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="Money Optimisation" backHref="/dashboard" agent="yield" />

      <div className="flex-1 overflow-y-auto py-4">
        {recommendations.map((recommendation) => {
          const account = graph.accounts.find((a) => `yield_${a.id}` === recommendation.id);
          if (!account) return null;
          return (
            <RecommendationCard
              key={recommendation.id}
              account={account}
              recommendation={recommendation}
              minBalance={settings.minBalance}
              riskComfort={settings.riskComfort}
            />
          );
        })}
      </div>

      <p className="px-6 pb-4 text-center text-[11px] text-orbit-muted">
        Powered by Orbit Yield · Coordinated with Orbit Pulse
      </p>
    </AppShell>
  );
}
