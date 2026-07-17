// Prisma client + the mapping/sync layer between the real database and the
// CustomerLifeGraph shape the agent rule functions (src/lib/agents/*) run
// against. Pages and API routes should go through the functions below
// rather than querying Prisma directly.

import { PrismaClient } from "@prisma/client";
import type { AgentName, CustomerLifeGraph, PersistedAgentAction } from "./types";
import { detectLifeEvents, buildPreTripBriefing, findTripEvent } from "./agents/pulse";
import { findIdleMoney } from "./agents/yieldAgent";
import { flagUnusedSubscriptions, activateTripMode } from "./agents/shield";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// No auth in the MVP — everything runs against the single seeded demo user.
const DEMO_USER_EMAIL = "sarah@example.com";

export async function getDemoUser() {
  return prisma.user.findUniqueOrThrow({ where: { email: DEMO_USER_EMAIL } });
}

export async function loadLifeGraph(userId: string): Promise<CustomerLifeGraph> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { accounts: true, calendarEvents: true, subscriptions: true },
  });

  return {
    userId: user.id,
    name: user.name,
    accounts: user.accounts.map((a) => ({
      id: a.id,
      name: a.name,
      balance: a.balance,
      interestRate: a.interestRate,
      currency: a.currency,
    })),
    transactions: [],
    calendarEvents: user.calendarEvents.map((e) => ({
      id: e.id,
      title: e.title,
      location: e.location ?? undefined,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      inferredEventType: (e.inferredEventType as "trip" | "relocation" | "unknown") ?? undefined,
    })),
    subscriptions: user.subscriptions.map((s) => ({
      id: s.id,
      merchant: s.merchant,
      monthlyAmount: s.monthlyAmount,
      lastUsedAt: s.lastUsedAt?.toISOString(),
      usageScore: s.usageScore,
      status: s.status as "active" | "flagged" | "cancelled",
    })),
    actions: [],
  };
}

// Runs every agent's rule engine against the current life graph and upserts
// the results into AgentAction — creating new rows as "pending", but never
// overwriting the status/approvedAt of a row a human has already acted on.
// Returns the full, up-to-date action list for the user.
export async function syncAgentActions(userId: string): Promise<PersistedAgentAction[]> {
  const graph = await loadLifeGraph(userId);
  const trip = findTripEvent(graph);
  const briefing = buildPreTripBriefing(graph);

  const computed = [
    ...detectLifeEvents(graph),
    ...(briefing ? [briefing] : []),
    ...findIdleMoney(graph),
    ...flagUnusedSubscriptions(graph),
    ...(trip ? [activateTripMode(trip)] : []),
  ];

  for (const action of computed) {
    await prisma.agentAction.upsert({
      where: { id: action.id },
      update: {
        description: action.description,
      },
      create: {
        id: action.id,
        userId,
        agent: action.agent,
        actionType: action.actionType,
        description: action.description,
        requiresApproval: action.requiresApproval,
      },
    });
  }

  const rows = await prisma.agentAction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    agent: row.agent as AgentName,
    actionType: row.actionType as "recommendation" | "autonomous_action",
    description: row.description,
    requiresApproval: row.requiresApproval,
    timestamp: row.createdAt.toISOString(),
    status: row.status as "pending" | "approved" | "dismissed",
  }));
}

// Subscription-cancelling Shield actions use the id pattern shield_<subId>
// (see src/lib/agents/shield.ts / flagUnusedSubscriptions). Approving one
// also cancels the underlying subscription — there's no separate UI step
// for that, approving *is* the cancellation.
function subscriptionIdFromActionId(actionId: string): string | null {
  if (!actionId.startsWith("shield_") || actionId.startsWith("shield_tripmode_")) return null;
  return actionId.slice("shield_".length);
}

export async function setActionStatus(
  actionId: string,
  status: "approved" | "dismissed"
): Promise<PersistedAgentAction> {
  const row = await prisma.agentAction.update({
    where: { id: actionId },
    data: {
      status,
      approvedAt: status === "approved" ? new Date() : null,
    },
  });

  const subId = subscriptionIdFromActionId(actionId);
  if (subId && status === "approved") {
    await prisma.subscription.updateMany({
      where: { id: subId },
      data: { status: "cancelled" },
    });
  }

  return {
    id: row.id,
    agent: row.agent as AgentName,
    actionType: row.actionType as "recommendation" | "autonomous_action",
    description: row.description,
    requiresApproval: row.requiresApproval,
    timestamp: row.createdAt.toISOString(),
    status: row.status as "pending" | "approved" | "dismissed",
  };
}
