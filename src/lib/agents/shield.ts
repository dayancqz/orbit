// Orbit Shield — Spend Guardian Agent
// Tracks recurring charges, scores usage, and flags forgotten
// subscriptions. Also flips on "Trip Mode" when Pulse detects travel.

import type { AgentAction, CustomerLifeGraph } from "../types";
import { daysSince } from "../format";

export const LOW_USAGE_THRESHOLD = 0.15;

// A subscription is "unused" once it's gone flagAfterDays without being
// used. If we don't have a last-used date at all, fall back to the usage
// score so a never-tracked subscription can still get flagged.
export function isUnused(
  sub: { lastUsedAt?: string; usageScore: number },
  flagAfterDays: number
): boolean {
  if (sub.lastUsedAt) return daysSince(sub.lastUsedAt) >= flagAfterDays;
  return sub.usageScore < LOW_USAGE_THRESHOLD;
}

export function flagUnusedSubscriptions(
  graph: CustomerLifeGraph,
  flagAfterDays = 30,
  allowNegotiation = true
): AgentAction[] {
  return graph.subscriptions
    .filter((sub) => sub.status === "active" && isUnused(sub, flagAfterDays))
    .map((sub) => ({
      id: `shield_${sub.id}`,
      agent: "shield" as const,
      actionType: "recommendation" as const,
      description: `"${sub.merchant}" (S$${sub.monthlyAmount}/mo) looks forgotten — unused for ${
        sub.lastUsedAt ? `${daysSince(sub.lastUsedAt)} days` : "a while"
      }. Cancel${allowNegotiation ? " or negotiate a better rate" : ""}?`,
      requiresApproval: true,
      timestamp: new Date().toISOString(),
    }));
}

export function activateTripMode(trip: { id: string; title: string }): AgentAction {
  return {
    id: `shield_tripmode_${trip.id}`,
    agent: "shield",
    actionType: "autonomous_action",
    description: `Trip Mode activated for "${trip.title}": tighter transaction watch is on for the duration of the trip.`,
    requiresApproval: false, // passive monitoring change, not a money movement
    timestamp: new Date().toISOString(),
  };
}
