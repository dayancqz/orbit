// Prisma client + the mapping/sync layer between the real database and the
// CustomerLifeGraph shape the agent rule functions (src/lib/agents/*) run
// against. Pages and API routes should go through the functions below
// rather than querying Prisma directly.

import { PrismaClient } from "@prisma/client";
import type { AgentName, CustomerLifeGraph, GuardrailSettings, PersistedAgentAction } from "./types";
import { detectLifeEvents, buildPreTripBriefing, findTripEvent } from "./agents/pulse";
import { findIdleMoney } from "./agents/yieldAgent";
import { flagUnusedSubscriptions, activateTripMode } from "./agents/shield";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function loadLifeGraph(userId: string): Promise<CustomerLifeGraph> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      accounts: { include: { transactions: { orderBy: { occurredAt: "desc" } } } },
      calendarEvents: true,
      subscriptions: true,
    },
  });

  const transactions = user.accounts
    .flatMap((a) => a.transactions)
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

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
    transactions: transactions.map((t) => ({
      id: t.id,
      merchant: t.merchant,
      amount: t.amount,
      category: t.category as "subscription" | "travel" | "general",
      occurredAt: t.occurredAt.toISOString(),
    })),
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

// One row per user, created with defaults the first time it's read — so
// there's never a "no settings yet" state for the rest of the app to
// special-case.
export async function getGuardrails(userId: string): Promise<GuardrailSettings> {
  const row = await prisma.guardrailSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return {
    minBalance: row.minBalance,
    monthlyAllocation: row.monthlyAllocation,
    riskComfort: row.riskComfort as GuardrailSettings["riskComfort"],
    connectCalendar: row.connectCalendar,
    detectLifeEvents: row.detectLifeEvents,
    preTripDays: row.preTripDays,
    flagAfterDays: row.flagAfterDays,
    autoTripMode: row.autoTripMode,
    allowNegotiation: row.allowNegotiation,
  };
}

export async function updateGuardrails(
  userId: string,
  data: Partial<GuardrailSettings>
): Promise<GuardrailSettings> {
  const row = await prisma.guardrailSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return {
    minBalance: row.minBalance,
    monthlyAllocation: row.monthlyAllocation,
    riskComfort: row.riskComfort as GuardrailSettings["riskComfort"],
    connectCalendar: row.connectCalendar,
    detectLifeEvents: row.detectLifeEvents,
    preTripDays: row.preTripDays,
    flagAfterDays: row.flagAfterDays,
    autoTripMode: row.autoTripMode,
    allowNegotiation: row.allowNegotiation,
  };
}

// Runs every agent's rule engine — within the guardrails the user has
// configured — against the current life graph, and upserts the results
// into AgentAction: creating new rows as "pending", but never overwriting
// the status/approvedAt of a row a human has already acted on.
//
// If a guardrail change means a previously-suggested action no longer
// applies (e.g. calendar gets disconnected, or the minimum balance is
// raised above the idle amount), any *pending* row for it is removed —
// it was never acted on, so there's nothing to preserve. Anything already
// approved or dismissed is left alone; that's real history.
export async function syncAgentActions(userId: string): Promise<PersistedAgentAction[]> {
  const [graph, settings] = await Promise.all([loadLifeGraph(userId), getGuardrails(userId)]);
  const trip = settings.connectCalendar ? findTripEvent(graph) : undefined;
  const briefing = trip ? buildPreTripBriefing(graph, 250, settings.preTripDays) : null;

  const computed = [
    ...(settings.connectCalendar ? detectLifeEvents(graph) : []),
    ...(briefing ? [briefing] : []),
    ...findIdleMoney(graph, settings.minBalance),
    ...flagUnusedSubscriptions(graph, settings.flagAfterDays, settings.allowNegotiation),
    ...(trip && settings.autoTripMode ? [activateTripMode(trip)] : []),
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

  await prisma.agentAction.deleteMany({
    where: { userId, status: "pending", id: { notIn: computed.map((a) => a.id) } },
  });

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
  userId: string,
  actionId: string,
  status: "approved" | "dismissed"
): Promise<PersistedAgentAction> {
  const existing = await prisma.agentAction.findUnique({ where: { id: actionId } });
  if (!existing || existing.userId !== userId) {
    throw new Error("No such action for this account");
  }

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

// Sends money out of an account — used by the Pay page. Debits the balance
// and records the Transaction in the same DB transaction, so they can never
// drift out of sync.
export async function recordPayment(userId: string, accountId: string, merchant: string, amount: number) {
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findUniqueOrThrow({ where: { id: accountId } });
    if (account.userId !== userId) throw new Error("No such account for this user");
    if (amount > account.balance) throw new Error("Amount exceeds available balance");

    await tx.account.update({ where: { id: accountId }, data: { balance: account.balance - amount } });
    return tx.transaction.create({
      data: { accountId, merchant, amount, category: "general", occurredAt: new Date() },
    });
  });
}
