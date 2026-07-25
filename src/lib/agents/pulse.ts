// Orbit Pulse — Life Planner Agent
// Detects upcoming life events from the calendar (and, weakly, from
// spending) and prepares a pre-trip financial briefing. This is
// deliberately simple, rule-based logic for the MVP; swap the inference
// step for a real model later.

import type { AgentAction, CustomerLifeGraph, LifeGraphCalendarEvent } from "../types";

const TRIP_KEYWORDS = [
  "flight",
  "trip",
  "hotel",
  "vacation",
  "airport",
  "departure",
  "conference",
  "getaway",
  "cruise",
  "layover",
  "resort",
  "airbnb",
];

// Exported so a synced calendar source (see src/lib/googleCalendar.ts) can
// filter to trip-like events using the exact same rule as detection —
// keeping only what's relevant rather than importing a user's entire
// calendar verbatim.
export function looksLikeTripTitle(title: string): boolean {
  return TRIP_KEYWORDS.some((kw) => title.toLowerCase().includes(kw));
}

// Broader than LifeGraphCalendarEvent so callers with raw DB rows (Date
// objects, not ISO strings) can reuse the exact same matching rule — e.g.
// src/lib/db.ts's recordPayment(), which needs to know if a payment was
// made mid-trip without first building a full CustomerLifeGraph.
interface TripLike {
  title: string;
  location?: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
}

// A title match is the strong signal. A multi-day event with a location
// set is a weaker secondary signal — catches trips titled things like
// "Tokyo" or "Mum's 60th" that a keyword list will always miss. Still a
// heuristic, not real inference — just a less brittle one.
export function looksLikeTrip(event: TripLike): boolean {
  if (looksLikeTripTitle(event.title)) return true;

  const durationDays =
    (new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()) / 86_400_000;
  return durationDays > 1 && Boolean(event.location);
}

// Is `now` inside any trip-like event's date range? Used to tag payments
// made mid-trip as "travel" spending (see recordPayment in src/lib/db.ts),
// which is what the post-trip summary compares against what was set aside.
export function isTripActiveNow(events: TripLike[], now = new Date()): boolean {
  const t = now.getTime();
  return events.some(
    (e) => looksLikeTrip(e) && new Date(e.startsAt).getTime() <= t && new Date(e.endsAt).getTime() >= t
  );
}

// Shared by the Shield agent (Trip Mode) and the Pulse/Shield pages, so
// there's one place that decides which calendar event counts as "the trip".
// Prefers the soonest upcoming/current one if there are several.
export function findTripEvent(graph: CustomerLifeGraph): LifeGraphCalendarEvent | undefined {
  const now = Date.now();
  const upcoming = graph.calendarEvents
    .filter(looksLikeTrip)
    .filter((e) => new Date(e.endsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return upcoming[0];
}

// Trips that have already ended — the input to the post-trip summary.
export function findEndedTrips(graph: CustomerLifeGraph): LifeGraphCalendarEvent[] {
  const now = Date.now();
  return graph.calendarEvents.filter((e) => looksLikeTrip(e) && new Date(e.endsAt).getTime() < now);
}

// Sum of "travel"-tagged spending during a trip's window (plus a day's
// grace after return, for payments settling late).
export function tripSpend(graph: CustomerLifeGraph, trip: LifeGraphCalendarEvent): number {
  const start = new Date(trip.startsAt).getTime();
  const end = new Date(trip.endsAt).getTime() + 86_400_000;
  return graph.transactions
    .filter((t) => t.category === "travel")
    .filter((t) => {
      const occurred = new Date(t.occurredAt).getTime();
      return occurred >= start && occurred <= end;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function detectLifeEvents(graph: CustomerLifeGraph): AgentAction[] {
  const actions: AgentAction[] = [];

  for (const event of graph.calendarEvents) {
    if (!looksLikeTrip(event)) continue;

    const daysUntil = Math.ceil(
      (new Date(event.startsAt).getTime() - Date.now()) / 86_400_000
    );
    if (daysUntil < 0) continue; // already over — see findEndedTrips/the post-trip summary instead

    actions.push({
      id: `pulse_${event.id}`,
      agent: "pulse",
      actionType: "recommendation",
      description: `Trip detected: "${event.title}" in ${daysUntil} day(s). Starting daily FX rate monitoring and preparing a pre-trip financial briefing.`,
      reasoning: `"${event.title}" matched Pulse's trip pattern (title keywords, or a multi-day event with a location set).`,
      requiresApproval: false, // monitoring is passive, no approval needed
      timestamp: new Date().toISOString(),
    });
  }

  return actions;
}

const TRAVEL_MERCHANT_KEYWORDS = [
  "air",
  "airlines",
  "airways",
  "hotel",
  "resort",
  "travel",
  "airbnb",
  "expedia",
  "booking.com",
];

export function looksLikeTravelMerchant(merchant: string): boolean {
  const lower = merchant.toLowerCase();
  return TRAVEL_MERCHANT_KEYWORDS.some((kw) => lower.includes(kw));
}

// A weaker, secondary detection path: if spending looks travel-related but
// no trip is currently being detected, nudge the user rather than staying
// silent. `alreadyDetected` is whatever src/lib/db.ts already resolved as
// "the trip" (respecting the connectCalendar guardrail) — deliberately not
// re-derived from the raw calendar here, so turning calendar detection off
// actually lets this weaker signal take over rather than silently agreeing
// with a calendar Pulse has been told to ignore.
export function detectTripFromSpending(
  graph: CustomerLifeGraph,
  alreadyDetected: LifeGraphCalendarEvent | undefined
): AgentAction[] {
  if (alreadyDetected) return [];

  const seen = new Set<string>();
  const actions: AgentAction[] = [];

  for (const txn of graph.transactions) {
    if (!looksLikeTravelMerchant(txn.merchant)) continue;
    if (seen.has(txn.merchant)) continue;
    seen.add(txn.merchant);

    actions.push({
      id: `pulse_spend_signal_${txn.id}`,
      agent: "pulse",
      actionType: "recommendation",
      description: `Possible trip signal: a payment to "${txn.merchant}" looks travel-related. Connect your calendar so Pulse can prepare a full briefing.`,
      reasoning: `"${txn.merchant}" matched a travel-related spending pattern, and no trip is on your connected calendar yet.`,
      requiresApproval: false,
      timestamp: new Date().toISOString(),
    });
  }

  return actions;
}

export function buildPreTripBriefing(
  graph: CustomerLifeGraph,
  suggestedSetAside = 250,
  preTripDays = Infinity, // only surface the briefing once the trip is within this many days
  learnedRatio = 1 // from src/lib/db.ts's TripLearning — adjusts the suggestion from past trips
): AgentAction | null {
  const trip = findTripEvent(graph);
  if (!trip) return null;

  const daysUntil = Math.ceil((new Date(trip.startsAt).getTime() - Date.now()) / 86_400_000);
  if (daysUntil > preTripDays) return null;

  const amount = Math.round(suggestedSetAside * learnedRatio);
  const reasoning =
    learnedRatio !== 1
      ? `Adjusted from the standard S$${suggestedSetAside} — on past trips you've spent about ${Math.round(
          learnedRatio * 100
        )}% of what was set aside.`
      : `Standard travel-wallet estimate — Orbit hasn't learned from a completed trip yet.`;

  return {
    id: `pulse_briefing_${trip.id}`,
    agent: "pulse",
    actionType: "recommendation",
    description: `Pre-trip briefing for "${trip.title}": FX rate is at its monthly best, travel insurance is active. Set aside S$${amount} for the trip?`,
    reasoning,
    amount,
    requiresApproval: true, // spending money always needs a human OK
    timestamp: new Date().toISOString(),
  };
}
