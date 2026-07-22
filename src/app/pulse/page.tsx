import Link from "next/link";
import { getGuardrails, loadLifeGraph, syncAgentActions } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { findTripEvent } from "@/lib/agents/pulse";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ActionButtons } from "@/components/ActionButtons";
import { StatusChip } from "@/components/StatusChip";
import { formatDate, daysUntil } from "@/lib/format";

// Reads live DB state (agent actions change via approve/dismiss), so this
// must never be served from Next's static prerender cache.
export const dynamic = "force-dynamic";

function BriefingCard({
  label,
  main,
  sub,
  mainClass,
}: {
  label: string;
  main: string;
  sub: string;
  mainClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-orbit-border bg-orbit-card p-4">
      <p className="mb-1 text-[11px] font-medium text-orbit-pulse">{label}</p>
      <p className={`mb-1 text-lg font-bold text-white ${mainClass ?? ""}`}>{main}</p>
      <p className="text-xs leading-relaxed text-orbit-muted">{sub}</p>
    </div>
  );
}

export default async function PulsePage() {
  const user = await requireUser();
  const [graph, actions, settings] = await Promise.all([
    loadLifeGraph(user.id),
    syncAgentActions(user.id),
    getGuardrails(user.id),
  ]);
  const trip = findTripEvent(graph);
  const briefing = actions.find((a) => a.id.startsWith("pulse_briefing_"));

  if (!settings.connectCalendar) {
    return (
      <AppShell withBottomNav={false}>
        <PageHeader title="Trip Briefing" backHref="/dashboard" agent="pulse" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-orbit-muted">
          <p>Calendar is disconnected, so Pulse can&apos;t detect trips or prepare briefings.</p>
          <Link href="/settings" className="text-orbit-pulse">
            Reconnect it in Guardrails →
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!trip) {
    return (
      <AppShell withBottomNav={false}>
        <PageHeader title="Trip Briefing" backHref="/dashboard" agent="pulse" />
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-orbit-muted">
          No upcoming trip detected yet.
        </div>
      </AppShell>
    );
  }

  const days = daysUntil(trip.startsAt);
  const briefingWindowNotOpenYet = !briefing && days > settings.preTripDays;

  return (
    <AppShell withBottomNav={false}>
      <PageHeader title="Trip Briefing" backHref="/dashboard" agent="pulse" />

      <div className="bg-gradient-to-b from-orbit-card2 to-orbit-surface px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[28px] font-bold text-white">{trip.title}</h2>
            <p className="mt-1 text-sm text-orbit-muted">
              {formatDate(trip.startsAt)} · {days >= 0 ? `${days} day${days === 1 ? "" : "s"} away` : "in progress"}
            </p>
          </div>
          {trip.location && (
            <span className="shrink-0 whitespace-nowrap rounded-lg bg-orbit-card2 px-2.5 py-1 text-[11px] text-orbit-muted">
              {trip.location}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3">
        <BriefingCard
          label="FX RATE ALERT"
          main="Daily monitoring active"
          sub="Orbit Pulse checks the exchange rate daily and will flag the best window to convert before you travel."
        />
        <BriefingCard
          label="TRAVEL WALLET"
          main="Recommended: S$250"
          sub="Based on an estimated daily spend for the length of your trip."
        />
        <BriefingCard
          label="TRAVEL INSURANCE"
          main="Coverage active"
          mainClass="text-orbit-yield"
          sub="Your travel insurance is active for this trip's dates and destination."
        />
        <BriefingCard
          label="CARD TIP"
          main="Use a 0% overseas-fee card"
          sub="Avoids foreign transaction fees on purchases made abroad."
        />
      </div>

      <div className="border-t border-orbit-border bg-orbit-surface px-6 py-4">
        {briefing ? (
          briefing.status === "pending" ? (
            <ActionButtons actionId={briefing.id} approveLabel="Approve & Set Aside S$250" />
          ) : (
            <div className="flex justify-center">
              <StatusChip tone={briefing.status === "approved" ? "green" : "muted"}>
                {briefing.status === "approved" ? "Approved" : "Dismissed"}
              </StatusChip>
            </div>
          )
        ) : (
          briefingWindowNotOpenYet && (
            <p className="text-center text-xs text-orbit-muted">
              Your full briefing and approval request will appear {days - settings.preTripDays} day
              {days - settings.preTripDays === 1 ? "" : "s"} from now — {settings.preTripDays} days before the trip.
            </p>
          )
        )}
        <p className="mt-2.5 text-center text-[11px] text-orbit-muted">
          Powered by Orbit Pulse · Approved actions are reversible
        </p>
      </div>
    </AppShell>
  );
}
