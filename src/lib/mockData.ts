// Seed data for the "Sarah's Korea Trip" demo flow from the pitch deck.
// Swap this for real bank/calendar API calls once those integrations exist —
// nothing downstream should need to change because it's all typed against
// CustomerLifeGraph.

import type { CustomerLifeGraph } from "./types";

const DAY_MS = 86_400_000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString();

export const sarahLifeGraph: CustomerLifeGraph = {
  userId: "user_sarah",
  name: "Sarah",
  accounts: [
    {
      id: "acc_savings",
      name: "Everyday Savings",
      balance: 3200,
      interestRate: 0.0005, // 0.05% — sitting idle
      currency: "SGD",
    },
  ],
  transactions: [
    {
      id: "txn_disney",
      merchant: "Disney+",
      amount: 11.98,
      category: "subscription",
      occurredAt: daysFromNow(-31),
    },
  ],
  calendarEvents: [
    {
      id: "evt_korea",
      title: "Flight to Seoul",
      location: "Seoul, South Korea",
      startsAt: daysFromNow(6),
      endsAt: daysFromNow(11),
    },
  ],
  subscriptions: [
    {
      id: "sub_disney",
      merchant: "Disney+",
      monthlyAmount: 11.98,
      lastUsedAt: daysFromNow(-73), // unused for months
      usageScore: 0.05,
      status: "active",
    },
    {
      id: "sub_spotify",
      merchant: "Spotify",
      monthlyAmount: 9.5,
      lastUsedAt: daysFromNow(-1),
      usageScore: 0.9,
      status: "active",
    },
  ],
  actions: [],
};
