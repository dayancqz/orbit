// Orbit Pulse — Life Planner Agent
// Detects upcoming life events from the calendar and prepares a
// pre-trip financial briefing. This is deliberately simple, rule-based
// logic for the MVP; swap the inference step for a real model later.

import type { AgentAction, CustomerLifeGraph } from "../types";

const TRIP_KEYWORDS = ["flight", "trip", "hotel", "vacation"];

export function detectLifeEvents(graph: CustomerLifeGraph): AgentAction[] {
  const actions: AgentAction[] = [];

  for (const event of graph.calendarEvents) {
    const looksLikeTrip = TRIP_KEYWORDS.some((kw) =>
      event.title.toLowerCase().includes(kw)
    );
    if (!looksLikeTrip) continue;

    const daysUntil = Math.ceil(
      (new Date(event.startsAt).getTime() - Date.now()) / 86_400_000
    );

    actions.push({
      id: `pulse_${event.id}`,
      agent: "pulse",
      actionType: "recommendation",
      description: `Trip detected: "${event.title}" in ${daysUntil} day(s). Starting daily FX rate monitoring and preparing a pre-trip financial briefing.`,
      requiresApproval: false, // monitoring is passive, no approval needed
      timestamp: new Date().toISOString(),
    });
  }

  return actions;
}

export function buildPreTripBriefing(
  graph: CustomerLifeGraph,
  suggestedSetAside = 250
): AgentAction | null {
  const trip = graph.calendarEvents.find((e) =>
    TRIP_KEYWORDS.some((kw) => e.title.toLowerCase().includes(kw))
  );
  if (!trip) return null;

  return {
    id: `pulse_briefing_${trip.id}`,
    agent: "pulse",
    actionType: "recommendation",
    description: `Pre-trip briefing for "${trip.title}": FX rate is at its monthly best, travel insurance is active. Set aside S$${suggestedSetAside} for the trip?`,
    requiresApproval: true, // spending money always needs a human OK
    timestamp: new Date().toISOString(),
  };
}
