// Prisma client + the mapping/sync layer between the real database and the
// CustomerLifeGraph shape the agent rule functions (src/lib/agents/*) run
// against. Pages and API routes should go through the functions below
// rather than querying Prisma directly.

import { PrismaClient } from "@prisma/client";
import type { AgentAction, AgentName, CustomerLifeGraph, GuardrailSettings, PersistedAgentAction } from "./types";
import {
  detectLifeEvents,
  detectTripFromSpending,
  buildPreTripBriefing,
  findTripEvent,
  findEndedTrips,
  tripSpend,
  looksLikeTripTitle,
  isTripActiveNow,
} from "./agents/pulse";
import { findIdleMoney } from "./agents/yieldAgent";
import { flagUnusedSubscriptions, activateTripMode } from "./agents/shield";
import { fetchUpcomingEvents, refreshAccessToken, type GoogleTokens } from "./googleCalendar";
import { sendPush } from "./push";
import { formatDate } from "./format";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function loadLifeGraph(userId: string): Promise<CustomerLifeGraph> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
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
      source: e.source as "manual" | "google",
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

export async function createManualCalendarEvent(
  userId: string,
  data: { title: string; startsAt: Date; endsAt: Date; location?: string }
) {
  return prisma.calendarEvent.create({
    data: {
      userId,
      title: data.title,
      location: data.location,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      source: "manual",
    },
  });
}

export async function deleteCalendarEvent(userId: string, eventId: string) {
  await prisma.calendarEvent.deleteMany({ where: { id: eventId, userId } });
}

export async function createAccount(
  userId: string,
  data: { name: string; type: string; balance: number; interestRate: number; currency?: string }
) {
  return prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      balance: data.balance,
      interestRate: data.interestRate,
      currency: data.currency ?? "SGD",
    },
  });
}

export async function createSubscription(
  userId: string,
  data: { merchant: string; monthlyAmount: number }
) {
  return prisma.subscription.create({
    data: { userId, merchant: data.merchant, monthlyAmount: data.monthlyAmount },
  });
}

export async function updateSubscription(
  userId: string,
  subscriptionId: string,
  data: { merchant: string; monthlyAmount: number }
) {
  const existing = await prisma.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  if (existing.userId !== userId) throw new Error("No such subscription for this user");

  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: { merchant: data.merchant, monthlyAmount: data.monthlyAmount },
  });
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

// Display-only view of a connection — never exposes the stored tokens.
export async function getCalendarConnection(userId: string) {
  return prisma.calendarConnection.findUnique({
    where: { userId },
    select: { provider: true, email: true, lastSyncedAt: true, createdAt: true },
  });
}

export async function upsertCalendarConnection(userId: string, tokens: GoogleTokens, email: string | null) {
  const existing = await prisma.calendarConnection.findUnique({ where: { userId } });
  const refreshToken = tokens.refreshToken ?? existing?.refreshToken;
  if (!refreshToken) {
    throw new Error("Google didn't return a refresh token — try disconnecting and reconnecting.");
  }

  await prisma.calendarConnection.upsert({
    where: { userId },
    update: {
      accessToken: tokens.accessToken,
      refreshToken,
      expiresAt: tokens.expiresAt,
      email: email ?? existing?.email,
    },
    create: { userId, accessToken: tokens.accessToken, refreshToken, expiresAt: tokens.expiresAt, email },
  });
}

export async function disconnectGoogleCalendar(userId: string) {
  await prisma.calendarEvent.deleteMany({ where: { userId, source: "google" } });
  await prisma.calendarConnection.deleteMany({ where: { userId } });
}

async function getValidGoogleAccessToken(userId: string): Promise<string | null> {
  const conn = await prisma.calendarConnection.findUnique({ where: { userId } });
  if (!conn) return null;

  const expiringSoon = conn.expiresAt.getTime() - Date.now() < 60_000;
  if (!expiringSoon) return conn.accessToken;

  const refreshed = await refreshAccessToken(conn.refreshToken);
  await prisma.calendarConnection.update({
    where: { userId },
    data: { accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt },
  });
  return refreshed.accessToken;
}

const SYNC_THROTTLE_MS = 5 * 60_000;

// Pulls upcoming events from the user's connected Google Calendar and
// upserts only the trip-looking ones into CalendarEvent (source: "google")
// — using the same rule Pulse itself uses to spot a trip, so nothing here
// can disagree with what detectLifeEvents() decides. This keeps the rest
// of a user's calendar (meetings, dinners, etc.) out of our database
// entirely; we only ever persist what the agents actually act on.
//
// Throttled to once every 5 minutes per user unless forced, so normal page
// navigation doesn't hit Google's API on every request.
export async function syncGoogleCalendarEvents(userId: string, force = false): Promise<number> {
  const conn = await prisma.calendarConnection.findUnique({ where: { userId } });
  if (!conn) return 0;
  if (!force && conn.lastSyncedAt && Date.now() - conn.lastSyncedAt.getTime() < SYNC_THROTTLE_MS) {
    return 0;
  }

  const accessToken = await getValidGoogleAccessToken(userId);
  if (!accessToken) return 0;

  const events = await fetchUpcomingEvents(accessToken);
  const tripEvents = events.filter((e) => looksLikeTripTitle(e.title));

  for (const event of tripEvents) {
    await prisma.calendarEvent.upsert({
      where: { userId_externalId: { userId, externalId: event.id } },
      update: {
        title: event.title,
        location: event.location,
        startsAt: new Date(event.startsAt),
        endsAt: new Date(event.endsAt),
      },
      create: {
        userId,
        title: event.title,
        location: event.location,
        startsAt: new Date(event.startsAt),
        endsAt: new Date(event.endsAt),
        source: "google",
        externalId: event.id,
      },
    });
  }

  // Drop previously-synced events Google no longer returns (cancelled,
  // renamed to something that no longer looks like a trip, etc.) — manual
  // entries are untouched since they're a different `source`.
  const currentIds = tripEvents.map((e) => e.id);
  await prisma.calendarEvent.deleteMany({
    where: {
      userId,
      source: "google",
      externalId: { notIn: currentIds.length > 0 ? currentIds : ["__none__"] },
    },
  });

  await prisma.calendarConnection.update({ where: { userId }, data: { lastSyncedAt: new Date() } });

  return tripEvents.length;
}

function toPersistedAction(row: {
  id: string;
  agent: string;
  actionType: string;
  description: string;
  reasoning: string | null;
  amount: number | null;
  requiresApproval: boolean;
  createdAt: Date;
  status: string;
}): PersistedAgentAction {
  return {
    id: row.id,
    agent: row.agent as AgentName,
    actionType: row.actionType as "recommendation" | "autonomous_action",
    description: row.description,
    reasoning: row.reasoning ?? undefined,
    amount: row.amount ?? undefined,
    requiresApproval: row.requiresApproval,
    timestamp: row.createdAt.toISOString(),
    status: row.status as "pending" | "approved" | "dismissed",
  };
}

// Cursor-paginated read of a user's already-synced actions — no rule
// engines run here, just a DB read, so paging through history on the
// Notifications screen never re-triggers agent computation. Callers that
// need the *full*, up-to-date set (dashboard, agent pages matching a
// specific action id) should keep using syncAgentActions instead.
export async function getAgentActionsPage(
  userId: string,
  opts: { cursor?: string; limit?: number } = {}
): Promise<{ actions: PersistedAgentAction[]; nextCursor: string | null }> {
  const limit = opts.limit ?? 20;
  const rows = await prisma.agentAction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    actions: page.map(toPersistedAction),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

// Sends a push notification (if the user has any subscriptions) for a
// batch of genuinely-new actions, then marks them notified so a later
// sync never re-sends for the same row.
async function notifyNewActions(userId: string, actions: AgentAction[]) {
  if (actions.length === 0) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length > 0) {
    const first = actions[0];
    const payload =
      actions.length === 1
        ? {
            title: `Orbit ${first.agent.charAt(0).toUpperCase()}${first.agent.slice(1)}`,
            body: first.description,
            url: `/${first.agent}`,
          }
        : { title: "Orbit", body: `${actions.length} new updates from your agents.`, url: "/notifications" };

    const deadEndpoints = await sendPush(subs, payload);
    if (deadEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: deadEndpoints } } });
    }
  }

  await prisma.agentAction.updateMany({
    where: { id: { in: actions.map((a) => a.id) } },
    data: { notifiedAt: new Date() },
  });
}

async function getLearnedRatio(userId: string): Promise<number> {
  const row = await prisma.tripLearning.findUnique({ where: { userId } });
  return row?.avgActualVsPredictedRatio ?? 1;
}

// Once a trip has ended, compares what was actually spent (Transactions
// tagged "travel" during the trip window — see recordPayment below)
// against what was approved to be set aside, posts a summary, and folds
// the result into TripLearning's rolling average so future briefings
// (buildPreTripBriefing's learnedRatio param) start suggesting a
// personalized amount instead of the flat default. Runs at most once per
// trip — the summary action's own existence is the guard.
async function syncPostTripSummaries(userId: string, graph: CustomerLifeGraph) {
  for (const trip of findEndedTrips(graph)) {
    const summaryId = `pulse_summary_${trip.id}`;
    const already = await prisma.agentAction.findUnique({ where: { id: summaryId } });
    if (already) continue;

    const briefing = await prisma.agentAction.findUnique({ where: { id: `pulse_briefing_${trip.id}` } });
    if (!briefing || briefing.status !== "approved" || briefing.amount == null) continue;

    const predicted = briefing.amount;
    const actual = tripSpend(graph, trip);
    const ratio = predicted > 0 ? actual / predicted : 1;
    const verdict = actual <= predicted ? "under budget" : "over budget";

    const description = `"${trip.title}" wrapped up: you spent S$${actual.toFixed(
      2
    )} of the S$${predicted.toFixed(2)} set aside — ${verdict}.`;
    const reasoning = `Compares "travel"-tagged payments made ${formatDate(trip.startsAt)} – ${formatDate(
      trip.endsAt
    )} against the amount you approved setting aside beforehand.`;

    await prisma.agentAction.create({
      data: {
        id: summaryId,
        userId,
        agent: "pulse",
        actionType: "autonomous_action",
        description,
        reasoning,
        amount: actual,
        requiresApproval: false,
        // Created outside the normal computed[]/upsert cycle (it's a
        // one-time historical record, not a recurring recommendation), so
        // it must not default to "pending" — syncAgentActions' cleanup
        // step deletes any pending row that isn't in that sync's computed
        // list, which would otherwise delete this the moment it's created.
        status: "approved",
        approvedAt: new Date(),
      },
    });

    const existingLearning = await prisma.tripLearning.findUnique({ where: { userId } });
    const prevAvg = existingLearning?.avgActualVsPredictedRatio ?? 1;
    const prevCount = existingLearning?.tripCount ?? 0;
    const newAvg = (prevAvg * prevCount + ratio) / (prevCount + 1);

    await prisma.tripLearning.upsert({
      where: { userId },
      update: { avgActualVsPredictedRatio: newAvg, tripCount: prevCount + 1 },
      create: { userId, avgActualVsPredictedRatio: newAvg, tripCount: 1 },
    });

    await notifyNewActions(userId, [
      {
        id: summaryId,
        agent: "pulse",
        actionType: "autonomous_action",
        description,
        reasoning,
        amount: actual,
        requiresApproval: false,
        timestamp: new Date().toISOString(),
      },
    ]);
  }
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
// Runs one agent's rule function in isolation — if it throws (bad data, a
// bug in a new rule, whatever), the other agents still get to compute and
// the page still renders instead of 500ing entirely.
function safeCompute<T>(agent: string, compute: () => T[]): T[] {
  try {
    return compute();
  } catch (err) {
    console.error(`[${agent}] rule evaluation failed`, err);
    return [];
  }
}

export async function syncAgentActions(userId: string): Promise<PersistedAgentAction[]> {
  const settings = await getGuardrails(userId);
  if (settings.connectCalendar) {
    await syncGoogleCalendarEvents(userId).catch(() => {
      // A Google API hiccup shouldn't take down the whole page — the agents
      // just run against whatever calendar data is already in the DB.
    });
  }

  const graph = await loadLifeGraph(userId);
  await syncPostTripSummaries(userId, graph).catch((err) => {
    console.error("[pulse] post-trip summary failed", err);
  });

  const trip = settings.connectCalendar
    ? safeCompute("pulse", () => {
        const t = findTripEvent(graph);
        return t ? [t] : [];
      })[0]
    : undefined;
  const learnedRatio = await getLearnedRatio(userId);
  const briefing = trip
    ? safeCompute("pulse", () => {
        const b = buildPreTripBriefing(graph, 250, settings.preTripDays, learnedRatio);
        return b ? [b] : [];
      })[0] ?? null
    : null;

  const computed = [
    ...(settings.connectCalendar ? safeCompute("pulse", () => detectLifeEvents(graph)) : []),
    ...(briefing ? [briefing] : []),
    ...(settings.detectLifeEvents ? safeCompute("pulse", () => detectTripFromSpending(graph, trip)) : []),
    ...safeCompute("yield", () => findIdleMoney(graph, settings.minBalance, settings.riskComfort)),
    ...safeCompute("shield", () => flagUnusedSubscriptions(graph, settings.flagAfterDays, settings.allowNegotiation)),
    ...(trip && settings.autoTripMode ? safeCompute("shield", () => [activateTripMode(trip)]) : []),
  ];

  const existingRows = await prisma.agentAction.findMany({
    where: { id: { in: computed.map((a) => a.id) } },
    select: { id: true },
  });
  const existingIds = new Set(existingRows.map((r) => r.id));
  const newlyCreated = computed.filter((a) => !existingIds.has(a.id));

  for (const action of computed) {
    await prisma.agentAction.upsert({
      where: { id: action.id },
      update: {
        description: action.description,
        reasoning: action.reasoning,
        amount: action.amount,
      },
      create: {
        id: action.id,
        userId,
        agent: action.agent,
        actionType: action.actionType,
        description: action.description,
        reasoning: action.reasoning,
        amount: action.amount,
        requiresApproval: action.requiresApproval,
      },
    });
  }

  await prisma.agentAction.deleteMany({
    where: { userId, status: "pending", id: { notIn: computed.map((a) => a.id) } },
  });

  await notifyNewActions(userId, newlyCreated);

  const rows = await prisma.agentAction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toPersistedAction);
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

  return toPersistedAction(row);
}

// Sends money out of an account — used by the Pay page. Debits the balance
// and records the Transaction in the same DB transaction, so they can never
// drift out of sync. Payments made while a trip is actually underway (not
// just upcoming) are tagged "travel" instead of "general" — that's the
// signal the post-trip summary compares against what was set aside.
export async function recordPayment(userId: string, accountId: string, merchant: string, amount: number) {
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const events = await prisma.calendarEvent.findMany({ where: { userId } });
  const category = isTripActiveNow(events) ? "travel" : "general";

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.findUniqueOrThrow({ where: { id: accountId } });
    if (account.userId !== userId) throw new Error("No such account for this user");
    if (amount > account.balance) throw new Error("Amount exceeds available balance");

    await tx.account.update({ where: { id: accountId }, data: { balance: account.balance - amount } });
    return tx.transaction.create({
      data: { accountId, merchant, amount, category, occurredAt: new Date() },
    });
  });
}
