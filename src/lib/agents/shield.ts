// Orbit Shield — Spend Guardian Agent
// Tracks recurring charges, scores usage, and flags forgotten
// subscriptions. Also flips on "Trip Mode" when Pulse detects travel.

import type { AgentAction, CustomerLifeGraph } from "../types";

const LOW_USAGE_THRESHOLD = 0.15;

export function flagUnusedSubscriptions(graph: CustomerLifeGraph): AgentAction[] {
  return graph.subscriptions
    .filter((sub) => sub.status === "active" && sub.usageScore < LOW_USAGE_THRESHOLD)
    .map((sub) => ({
      id: `shield_${sub.id}`,
      agent: "shield" as const,
      actionType: "recommendation" as const,
      description: `"${sub.merchant}" (S$${sub.monthlyAmount}/mo) looks forgotten — usage score ${(
        sub.usageScore * 100
      ).toFixed(0)}%. Cancel or negotiate a better rate?`,
      requiresApproval: true,
      timestamp: new Date().toISOString(),
    }));
}

export function activateTripMode(graph: CustomerLifeGraph, tripTitle: string): AgentAction {
  return {
    id: `shield_tripmode_${Date.now()}`,
    agent: "shield",
    actionType: "autonomous_action",
    description: `Trip Mode activated for "${tripTitle}": tighter transaction watch is on for the duration of the trip.`,
    requiresApproval: false, // passive monitoring change, not a money movement
    timestamp: new Date().toISOString(),
  };
}
