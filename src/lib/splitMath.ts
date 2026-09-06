// Pure calculation helpers for the Split feature — no Prisma/DB import on
// purpose (mirrors why src/lib/push.ts stays DB-free), so client components
// can import this module directly for live previews without pulling the
// Prisma client into the browser bundle.

export type SplitType = "equal" | "exact" | "percentage";

// Currencies a Split group can be set to (validated server-side against
// this same list before calling out to the FX API in src/lib/fxRates.ts).
export const SUPPORTED_TRIP_CURRENCIES = [
  "SGD",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "KRW",
  "THB",
  "MYR",
  "IDR",
  "AUD",
  "HKD",
  "CNY",
  "VND",
  "PHP",
  "INR",
  "TWD",
] as const;

export type TripCurrency = (typeof SUPPORTED_TRIP_CURRENCIES)[number];

const EPSILON = 0.01;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface MemberBalance {
  memberId: string;
  net: number; // positive = the group owes them; negative = they owe the group
}

export interface SettleSuggestion {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

// netFromExpenses(m) = paidTotal(m) - owedTotal(m)
// netBalance(m) = netFromExpenses(m) + settlementsPaid(m) - settlementsReceived(m)
export function computeNetBalances(
  memberIds: string[],
  expenses: { paidById: string; amount: number; shares: { memberId: string; amount: number }[] }[],
  settlements: { fromMemberId: string; toMemberId: string; amount: number }[]
): Map<string, number> {
  const net = new Map<string, number>(memberIds.map((id) => [id, 0]));

  for (const expense of expenses) {
    net.set(expense.paidById, (net.get(expense.paidById) ?? 0) + expense.amount);
    for (const share of expense.shares) {
      net.set(share.memberId, (net.get(share.memberId) ?? 0) - share.amount);
    }
  }
  for (const settlement of settlements) {
    net.set(settlement.fromMemberId, (net.get(settlement.fromMemberId) ?? 0) + settlement.amount);
    net.set(settlement.toMemberId, (net.get(settlement.toMemberId) ?? 0) - settlement.amount);
  }

  for (const [id, value] of net) net.set(id, round2(value));
  return net;
}

// Greedy debt-simplification: matches the largest creditor with the
// largest debtor repeatedly, producing the minimum-transfer-count way to
// zero everyone out. Standard Splitwise-style heuristic, not a proof of
// mathematical minimality — good enough for typical group sizes.
export function simplifyDebts(balances: MemberBalance[]): SettleSuggestion[] {
  const creditors = balances
    .filter((b) => b.net > EPSILON)
    .map((b) => ({ memberId: b.memberId, remaining: b.net }))
    .sort((a, b) => b.remaining - a.remaining);
  const debtors = balances
    .filter((b) => b.net < -EPSILON)
    .map((b) => ({ memberId: b.memberId, remaining: -b.net }))
    .sort((a, b) => b.remaining - a.remaining);

  const result: SettleSuggestion[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = round2(Math.min(debtors[i].remaining, creditors[j].remaining));
    if (amount > EPSILON) {
      result.push({ fromMemberId: debtors[i].memberId, toMemberId: creditors[j].memberId, amount });
    }
    debtors[i].remaining = round2(debtors[i].remaining - amount);
    creditors[j].remaining = round2(creditors[j].remaining - amount);
    if (debtors[i].remaining <= EPSILON) i++;
    if (creditors[j].remaining <= EPSILON) j++;
  }
  return result;
}

// Splits `total` evenly among `memberIds`, rounding each share down to the
// nearest cent and dumping the leftover cent(s) onto the payer's own
// share, so shares always sum to exactly `total` by construction.
export function computeEqualShares(
  memberIds: string[],
  total: number,
  payerId: string
): { memberId: string; amount: number }[] {
  if (memberIds.length === 0) return [];
  const base = Math.floor((total / memberIds.length) * 100) / 100;
  const shares = memberIds.map((memberId) => ({ memberId, amount: base }));
  const remainder = round2(total - base * memberIds.length);
  const payerShare = shares.find((s) => s.memberId === payerId) ?? shares[0];
  payerShare.amount = round2(payerShare.amount + remainder);
  return shares;
}

// Same rounding-remainder approach as computeEqualShares, applied to
// percentage-based entries instead of an even split.
export function computePercentageShares(
  entries: { memberId: string; percentage: number }[],
  total: number,
  payerId: string
): { memberId: string; amount: number }[] {
  if (entries.length === 0) return [];
  const shares = entries.map((e) => ({
    memberId: e.memberId,
    amount: Math.floor(total * (e.percentage / 100) * 100) / 100,
  }));
  const sum = round2(shares.reduce((s, x) => s + x.amount, 0));
  const remainder = round2(total - sum);
  const payerShare = shares.find((s) => s.memberId === payerId) ?? shares[0];
  payerShare.amount = round2(payerShare.amount + remainder);
  return shares;
}
