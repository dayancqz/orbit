// Orbit Yield — Wealth Optimiser Agent
// Monitors idle balances and recommends moving money into higher-yield
// products, within guardrails the user has set.

import type { AgentAction, CustomerLifeGraph } from "../types";

const IDLE_THRESHOLD = 1000; // SGD — balances above this are "idle"
const IDLE_RATE_CEILING = 0.01; // below 1% interest counts as "idle money"
const BETTER_FD_RATE = 0.028; // example 30-day fixed deposit rate

export function findIdleMoney(graph: CustomerLifeGraph): AgentAction[] {
  const actions: AgentAction[] = [];

  for (const account of graph.accounts) {
    if (account.balance < IDLE_THRESHOLD) continue;
    if (account.interestRate > IDLE_RATE_CEILING) continue;

    const idleAmount = account.balance;
    const potentialAnnualGain = idleAmount * (BETTER_FD_RATE - account.interestRate);

    actions.push({
      id: `yield_${account.id}`,
      agent: "yield",
      actionType: "recommendation",
      description: `S$${idleAmount.toLocaleString()} is idle in "${account.name}" earning ${(
        account.interestRate * 100
      ).toFixed(2)}%. A 30-day fixed deposit at ${(BETTER_FD_RATE * 100).toFixed(
        1
      )}% would earn roughly S$${potentialAnnualGain.toFixed(0)} more per year.`,
      requiresApproval: true, // moving money always needs a human OK in the MVP
      timestamp: new Date().toISOString(),
    });
  }

  return actions;
}
