// Server-side data access for the standalone Split (bill-splitting)
// feature. Pure math lives in src/lib/splitMath.ts, which has no Prisma
// import so client components can use it for live previews — this file is
// server-only (imports the Prisma client) and owns every DB read/write
// plus the authorization rules around settling debts.

import { randomBytes } from "crypto";
import { prisma } from "./db";
import { sendPush } from "./push";
import { fetchExchangeRate } from "./fxRates";
import {
  computeNetBalances,
  round2,
  simplifyDebts,
  SUPPORTED_TRIP_CURRENCIES,
  type SplitType,
  type TripCurrency,
} from "./splitMath";

export { SUPPORTED_TRIP_CURRENCIES };
export type { TripCurrency } from "./splitMath";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export type { SplitType } from "./splitMath";

export interface SplitMemberView {
  id: string;
  userId: string | null;
  name: string;
  isCurrentUser: boolean;
}

export interface SplitExpenseView {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  paidByName: string;
  splitType: SplitType;
  occurredAt: string;
  shares: { memberId: string; memberName: string; amount: number }[];
}

export interface SplitBalance {
  memberId: string;
  memberName: string;
  net: number;
}

export interface SettleSuggestionView {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}

export interface SplitSettlementView {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  method: string;
  settledAt: string;
}

export interface SplitGroupSummary {
  id: string;
  name: string;
  memberCount: number;
  myNet: number;
  currency: string;
  createdAt: string;
}

export interface SplitGroupDetail {
  id: string;
  name: string;
  createdById: string;
  currency: string;
  exchangeRateToSGD: number;
  rateUpdatedAt: string | null;
  members: SplitMemberView[];
  expenses: SplitExpenseView[];
  balances: SplitBalance[];
  suggestions: SettleSuggestionView[];
  settlements: SplitSettlementView[];
}

async function notifySplitUser(userId: string, payload: { title: string; body: string; url?: string }) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;
  const deadEndpoints = await sendPush(subs, payload);
  if (deadEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: deadEndpoints } } });
  }
}

export async function findUserByEmail(email: string): Promise<{ id: string; name: string; email: string } | null> {
  const trimmed = email.trim();
  if (!trimmed) return null;
  return prisma.user.findUnique({
    where: { email: trimmed },
    select: { id: true, name: true, email: true },
  });
}

export interface NewGroupMemberInput {
  userId?: string;
  name: string;
}

export async function createSplitGroup(
  sessionUserId: string,
  name: string,
  members: NewGroupMemberInput[],
  currency: TripCurrency = "SGD"
): Promise<{ id: string }> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Group needs a name");
  if (!SUPPORTED_TRIP_CURRENCIES.includes(currency)) throw new Error("Unsupported currency");

  const creator = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUserId },
    select: { id: true, name: true },
  });

  const seenUserIds = new Set<string>([sessionUserId]);
  const others: NewGroupMemberInput[] = [];
  for (const m of members) {
    if (m.userId === sessionUserId) continue; // creator is added separately below
    if (!m.name.trim()) continue;
    if (m.userId) {
      if (seenUserIds.has(m.userId)) continue;
      seenUserIds.add(m.userId);
    }
    others.push({ userId: m.userId, name: m.name.trim() });
  }

  // Fetched before creating anything — a failed rate lookup should fail
  // group creation cleanly rather than leave a group sitting at the wrong
  // (default 1:1) rate.
  const exchangeRateToSGD = await fetchExchangeRate(currency, "SGD");

  const group = await prisma.splitGroup.create({
    data: {
      name: trimmedName,
      createdById: sessionUserId,
      currency,
      exchangeRateToSGD,
      rateUpdatedAt: new Date(),
      members: {
        create: [
          { userId: sessionUserId, name: creator.name },
          ...others.map((m) => ({ userId: m.userId ?? null, name: m.name })),
        ],
      },
    },
    select: { id: true },
  });

  const notifyIds = others.map((m) => m.userId).filter((id): id is string => Boolean(id));
  await Promise.all(
    notifyIds.map((uid) =>
      notifySplitUser(uid, {
        title: "Orbit Split",
        body: `${creator.name} added you to the split group "${trimmedName}"`,
        url: `/split/${group.id}`,
      })
    )
  );

  return group;
}

export async function getGroupsForUser(sessionUserId: string): Promise<SplitGroupSummary[]> {
  const groups = await prisma.splitGroup.findMany({
    where: { members: { some: { userId: sessionUserId } } },
    include: { members: true, expenses: { include: { shares: true } }, settlements: true },
    orderBy: { createdAt: "desc" },
  });

  return groups.map((g) => {
    const net = computeNetBalances(
      g.members.map((m) => m.id),
      g.expenses,
      g.settlements
    );
    const myMember = g.members.find((m) => m.userId === sessionUserId);
    return {
      id: g.id,
      name: g.name,
      memberCount: g.members.length,
      myNet: myMember ? net.get(myMember.id) ?? 0 : 0,
      currency: g.currency,
      createdAt: g.createdAt.toISOString(),
    };
  });
}

export async function getGroupDetail(sessionUserId: string, groupId: string): Promise<SplitGroupDetail> {
  const group = await prisma.splitGroup.findUnique({
    where: { id: groupId },
    include: {
      members: true,
      expenses: { include: { shares: true, paidBy: true }, orderBy: { occurredAt: "desc" } },
      settlements: { orderBy: { settledAt: "desc" } },
    },
  });
  if (!group) throw new Error("Split group not found");
  if (!group.members.some((m) => m.userId === sessionUserId)) {
    throw new Error("You're not a member of this group");
  }

  const memberName = new Map(group.members.map((m) => [m.id, m.name]));
  const net = computeNetBalances(
    group.members.map((m) => m.id),
    group.expenses,
    group.settlements
  );

  const balances: SplitBalance[] = group.members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    net: net.get(m.id) ?? 0,
  }));

  const suggestions: SettleSuggestionView[] = simplifyDebts(
    balances.map((b) => ({ memberId: b.memberId, net: b.net }))
  ).map((s) => ({
    ...s,
    fromName: memberName.get(s.fromMemberId) ?? "?",
    toName: memberName.get(s.toMemberId) ?? "?",
  }));

  return {
    id: group.id,
    name: group.name,
    createdById: group.createdById,
    currency: group.currency,
    exchangeRateToSGD: group.exchangeRateToSGD,
    rateUpdatedAt: group.rateUpdatedAt ? group.rateUpdatedAt.toISOString() : null,
    members: group.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      isCurrentUser: m.userId === sessionUserId,
    })),
    expenses: group.expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      paidById: e.paidById,
      paidByName: e.paidBy.name,
      splitType: e.splitType as SplitType,
      occurredAt: e.occurredAt.toISOString(),
      shares: e.shares.map((s) => ({
        memberId: s.memberId,
        memberName: memberName.get(s.memberId) ?? "?",
        amount: s.amount,
      })),
    })),
    balances,
    suggestions,
    settlements: group.settlements.map((s) => ({
      id: s.id,
      fromMemberId: s.fromMemberId,
      toMemberId: s.toMemberId,
      amount: s.amount,
      method: s.method,
      settledAt: s.settledAt.toISOString(),
    })),
  };
}

export interface NewExpenseShareInput {
  memberId: string;
  amount: number;
}

export interface NewExpenseInput {
  description: string;
  amount: number;
  paidById: string;
  splitType: SplitType;
  shares: NewExpenseShareInput[];
}

const SHARE_EPSILON = 0.01;

export async function addSplitExpense(
  sessionUserId: string,
  groupId: string,
  input: NewExpenseInput
): Promise<{ id: string }> {
  const group = await prisma.splitGroup.findUnique({ where: { id: groupId }, include: { members: true } });
  if (!group) throw new Error("Split group not found");
  if (!group.members.some((m) => m.userId === sessionUserId)) {
    throw new Error("You're not a member of this group");
  }

  const description = input.description.trim();
  if (!description) throw new Error("Enter a description");
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Enter a valid amount");

  const memberIds = new Set(group.members.map((m) => m.id));
  if (!memberIds.has(input.paidById)) throw new Error("Payer must be a member of this group");
  if (input.shares.length === 0) throw new Error("Select at least one member to split with");
  for (const share of input.shares) {
    if (!memberIds.has(share.memberId)) throw new Error("Share references a member outside this group");
    if (!Number.isFinite(share.amount) || share.amount < 0) throw new Error("Invalid share amount");
  }

  const shareSum = round2(input.shares.reduce((sum, s) => sum + s.amount, 0));
  const total = round2(input.amount);
  if (Math.abs(shareSum - total) > SHARE_EPSILON) {
    throw new Error(
      `Shares (${shareSum.toFixed(2)} ${group.currency}) must add up to the total (${total.toFixed(2)} ${group.currency})`
    );
  }

  const expense = await prisma.splitExpense.create({
    data: {
      groupId,
      description,
      amount: total,
      paidById: input.paidById,
      splitType: input.splitType,
      shares: { create: input.shares.map((s) => ({ memberId: s.memberId, amount: round2(s.amount) })) },
    },
    select: { id: true },
  });

  return expense;
}

export async function settleDebt(
  sessionUserId: string,
  groupId: string,
  fromMemberId: string,
  toMemberId: string,
  amount: number
): Promise<{ id: string; method: string }> {
  if (fromMemberId === toMemberId) throw new Error("Cannot settle with yourself");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount");

  const group = await prisma.splitGroup.findUnique({ where: { id: groupId }, include: { members: true } });
  if (!group) throw new Error("Split group not found");
  if (!group.members.some((m) => m.userId === sessionUserId)) {
    throw new Error("You're not a member of this group");
  }

  const fromMember = group.members.find((m) => m.id === fromMemberId);
  const toMember = group.members.find((m) => m.id === toMemberId);
  if (!fromMember || !toMember) throw new Error("Member not found in this group");

  const bothOrbitUsers = Boolean(fromMember.userId && toMember.userId);

  if (bothOrbitUsers) {
    // Only the debtor can authorize sending their own real money — not
    // even another group member can trigger this on their behalf.
    if (sessionUserId !== fromMember.userId) {
      throw new Error("Only the person who owes can confirm sending the money");
    }
    return settleViaTransfer(group, fromMember, toMember, round2(amount));
  }

  // At least one side is a non-Orbit "friend" who can never log in to
  // confirm anything themselves, so this is bookkeeping only — no real
  // balance change. Either real account on either side may confirm it;
  // if neither side has an account (a friend-to-friend settlement),
  // any existing group member may log it since no one else ever could.
  const neitherIsOrbitUser = !fromMember.userId && !toMember.userId;
  const sessionIsParty = sessionUserId === fromMember.userId || sessionUserId === toMember.userId;
  if (!neitherIsOrbitUser && !sessionIsParty) {
    throw new Error("Only someone on one side of this settlement can confirm it");
  }

  const settlement = await prisma.splitSettlement.create({
    data: { groupId, fromMemberId, toMemberId, amount: round2(amount), method: "manual" },
    select: { id: true },
  });
  return { id: settlement.id, method: "manual" };
}

async function settleViaTransfer(
  group: { id: string; name: string; currency: string; exchangeRateToSGD: number },
  fromMember: { id: string; userId: string | null },
  toMember: { id: string; userId: string | null },
  amountInGroupCurrency: number
): Promise<{ id: string; method: string }> {
  const fromUserId = fromMember.userId!;
  const toUserId = toMember.userId!;
  // SplitSettlement.amount always stays in the group's own currency (so it
  // keeps netting correctly against expenses in computeNetBalances) — the
  // SGD conversion only matters for the real account balances/Transactions
  // below, using whatever rate is currently cached on the group.
  const sgdAmount = round2(amountInGroupCurrency * group.exchangeRateToSGD);
  const label =
    group.currency === "SGD"
      ? `Split: ${group.name}`
      : `Split: ${group.name} (${amountInGroupCurrency.toFixed(2)} ${group.currency} ≈ S$${sgdAmount.toFixed(2)})`;

  const result = await prisma.$transaction(async (tx) => {
    const fromAccount = await tx.account.findFirst({ where: { userId: fromUserId }, orderBy: { id: "asc" } });
    const toAccount = await tx.account.findFirst({ where: { userId: toUserId }, orderBy: { id: "asc" } });
    if (!fromAccount) throw new Error("You don't have an account to pay from");
    if (!toAccount) throw new Error("The recipient doesn't have an account to receive into");
    if (fromAccount.currency !== toAccount.currency) {
      throw new Error("Cross-currency settlement isn't supported yet");
    }
    if (fromAccount.currency !== "SGD") {
      throw new Error("Real transfers currently only support SGD accounts");
    }
    if (sgdAmount > fromAccount.balance) throw new Error("Amount exceeds your available balance");

    await tx.account.update({ where: { id: fromAccount.id }, data: { balance: fromAccount.balance - sgdAmount } });
    await tx.account.update({ where: { id: toAccount.id }, data: { balance: toAccount.balance + sgdAmount } });

    await tx.transaction.create({
      data: {
        accountId: fromAccount.id,
        merchant: label,
        amount: sgdAmount,
        category: "general",
        occurredAt: new Date(),
      },
    });
    await tx.transaction.create({
      data: {
        accountId: toAccount.id,
        merchant: `${label} (received)`,
        amount: sgdAmount,
        category: "general",
        occurredAt: new Date(),
      },
    });

    return tx.splitSettlement.create({
      data: {
        groupId: group.id,
        fromMemberId: fromMember.id,
        toMemberId: toMember.id,
        amount: amountInGroupCurrency,
        method: "orbit_transfer",
      },
      select: { id: true },
    });
  });

  await notifySplitUser(toUserId, {
    title: "Orbit Split",
    body: `You received S$${sgdAmount.toFixed(2)} for "${group.name}"`,
    url: `/split/${group.id}`,
  });

  return { id: result.id, method: "orbit_transfer" };
}

export interface GroupCurrencyView {
  currency: string;
  exchangeRateToSGD: number;
  rateUpdatedAt: string;
}

// Creator-only — changing the currency (or re-submitting the same one to
// refresh the rate) affects how every member's balance is displayed and
// computed, so it's restricted the same way regenerateGroupInvite is.
export async function setGroupCurrency(
  sessionUserId: string,
  groupId: string,
  currency: TripCurrency
): Promise<GroupCurrencyView> {
  if (!SUPPORTED_TRIP_CURRENCIES.includes(currency)) throw new Error("Unsupported currency");

  const group = await prisma.splitGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Split group not found");
  if (group.createdById !== sessionUserId) {
    throw new Error("Only the group creator can change the currency");
  }

  const exchangeRateToSGD = await fetchExchangeRate(currency, "SGD");
  const rateUpdatedAt = new Date();
  await prisma.splitGroup.update({
    where: { id: groupId },
    data: { currency, exchangeRateToSGD, rateUpdatedAt },
  });

  return { currency, exchangeRateToSGD, rateUpdatedAt: rateUpdatedAt.toISOString() };
}

export interface GroupInviteView {
  token: string;
  expiresAt: string;
}

// Returns the group's current invite if one exists and hasn't expired,
// otherwise issues a fresh one. Called from the group detail page's
// server-render so a QR/link is always ready to show without a separate
// "generate" step.
export async function getOrCreateGroupInvite(sessionUserId: string, groupId: string): Promise<GroupInviteView> {
  const group = await prisma.splitGroup.findUnique({
    where: { id: groupId },
    include: { members: true, invite: true },
  });
  if (!group) throw new Error("Split group not found");
  if (!group.members.some((m) => m.userId === sessionUserId)) {
    throw new Error("You're not a member of this group");
  }

  if (group.invite && group.invite.expiresAt > new Date()) {
    return { token: group.invite.token, expiresAt: group.invite.expiresAt.toISOString() };
  }

  const invite = await prisma.splitInvite.upsert({
    where: { groupId },
    update: { token: generateInviteToken(), expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
    create: { groupId, token: generateInviteToken(), expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });
  return { token: invite.token, expiresAt: invite.expiresAt.toISOString() };
}

// Always issues a fresh token, invalidating whatever QR/link was shown
// before — restricted to the group creator so no other member can
// invalidate a link people are relying on.
export async function regenerateGroupInvite(sessionUserId: string, groupId: string): Promise<GroupInviteView> {
  const group = await prisma.splitGroup.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Split group not found");
  if (group.createdById !== sessionUserId) {
    throw new Error("Only the group creator can regenerate the invite code");
  }

  const invite = await prisma.splitInvite.upsert({
    where: { groupId },
    update: { token: generateInviteToken(), expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
    create: { groupId, token: generateInviteToken(), expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
  });
  return { token: invite.token, expiresAt: invite.expiresAt.toISOString() };
}

// Adds the scanning/clicking user to the group as a real member. Scoped to
// existing Orbit users only — a logged-out visitor is sent to log in
// before this ever runs (see src/app/split/join/[token]/page.tsx).
export async function joinGroupViaInvite(sessionUserId: string, token: string): Promise<{ groupId: string }> {
  const invite = await prisma.splitInvite.findUnique({
    where: { token },
    include: { group: { include: { members: true } } },
  });
  if (!invite) throw new Error("This invite link is invalid.");
  if (invite.expiresAt <= new Date()) throw new Error("This invite link has expired — ask for a new one.");

  const alreadyMember = invite.group.members.some((m) => m.userId === sessionUserId);
  if (alreadyMember) return { groupId: invite.groupId };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUserId }, select: { name: true } });
  await prisma.splitMember.create({ data: { groupId: invite.groupId, userId: sessionUserId, name: user.name } });

  return { groupId: invite.groupId };
}
