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

export interface AgentAction {
  id: string;
  agent: AgentName;
  actionType: "recommendation" | "autonomous_action";
  description: string;
  requiresApproval: boolean;
  timestamp: string;
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
