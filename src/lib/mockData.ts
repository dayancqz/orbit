// Seed data for the "Sarah's Korea Trip" demo flow from the pitch deck.
// Swap this for real bank/calendar API calls once those integrations exist —
// nothing downstream should need to change because it's all typed against
// CustomerLifeGraph.

import type { CustomerLifeGraph } from "./types";

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
      occurredAt: "2026-06-17T00:00:00.000Z",
    },
  ],
  calendarEvents: [
    {
      id: "evt_korea",
      title: "Flight to Seoul",
      location: "Seoul, South Korea",
      startsAt: "2026-08-07T00:00:00.000Z",
      endsAt: "2026-08-12T00:00:00.000Z",
    },
  ],
  subscriptions: [
    {
      id: "sub_disney",
      merchant: "Disney+",
      monthlyAmount: 11.98,
      lastUsedAt: "2026-03-02T00:00:00.000Z", // unused for months
      usageScore: 0.05,
      status: "active",
    },
    {
      id: "sub_spotify",
      merchant: "Spotify",
      monthlyAmount: 9.5,
      lastUsedAt: "2026-07-16T00:00:00.000Z",
      usageScore: 0.9,
      status: "active",
    },
  ],
  actions: [],
};
