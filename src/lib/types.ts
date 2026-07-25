// Shared types both tracks (backend + frontend) code against.
// This file is the "contract" — agree on changes here before diverging.

export type AgentName = "pulse" | "yield" | "shield";

export interface LifeGraphAccount {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  currency: string;
}

export interface LifeGraphTransaction {
  id: string;
  merchant: string;
  amount: number;
  category: "subscription" | "travel" | "general";
  occurredAt: string; // ISO date
}

export interface LifeGraphCalendarEvent {
  id: string;
  title: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  inferredEventType?: "trip" | "relocation" | "unknown";
  source: "manual" | "google";
}

export interface LifeGraphSubscription {
  id: string;
  merchant: string;
  monthlyAmount: number;
  lastUsedAt?: string;
  usageScore: number; // 0-1
  status: "active" | "flagged" | "cancelled";
}

export type ActionStatus = "pending" | "approved" | "dismissed";

export interface AgentAction {
  id: string;
  agent: AgentName;
  actionType: "recommendation" | "autonomous_action";
  description: string;
  // Plain-English "why" — the specific guardrail/threshold that triggered
  // this action, distinct from the description's summary of what it does.
  reasoning?: string;
  // The SGD figure this action is about, if any — structured so downstream
  // logic (e.g. the post-trip summary) never has to parse it back out of
  // the description text.
  amount?: number;
  requiresApproval: boolean;
  timestamp: string;
}

// The shape returned once an AgentAction has been synced to the database —
// adds the persisted approval status on top of what the pure rule
// functions in src/lib/agents/* compute.
export interface PersistedAgentAction extends AgentAction {
  status: ActionStatus;
}

// Mirrors prisma/schema.prisma's GuardrailSettings — the thresholds each
// agent must stay within, set by the user on the Guardrails screen.
export interface GuardrailSettings {
  minBalance: number;
  monthlyAllocation: number;
  riskComfort: "Conservative" | "Moderate" | "Aggressive";
  connectCalendar: boolean;
  detectLifeEvents: boolean;
  preTripDays: number;
  flagAfterDays: number;
  autoTripMode: boolean;
  allowNegotiation: boolean;
}

export interface CustomerLifeGraph {
  userId: string;
  name: string;
  accounts: LifeGraphAccount[];
  transactions: LifeGraphTransaction[];
  calendarEvents: LifeGraphCalendarEvent[];
  subscriptions: LifeGraphSubscription[];
  actions: AgentAction[];
}
