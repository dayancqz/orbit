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
  requiresApproval: boolean;
  timestamp: string;
}

// The shape returned once an AgentAction has been synced to the database —
// adds the persisted approval status on top of what the pure rule
// functions in src/lib/agents/* compute.
export interface PersistedAgentAction extends AgentAction {
  status: ActionStatus;
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
