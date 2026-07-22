// Orbit Yield — Wealth Optimiser Agent
// Monitors idle balances and recommends moving money into higher-yield
// products, within guardrails the user has set.

import type { AgentAction, CustomerLifeGraph } from "../types";

const IDLE_THRESHOLD = 1000; // SGD — balances above this are "idle"
const IDLE_RATE_CEILING = 0.01; // below 1% interest counts as "idle money"
export const BETTER_FD_RATE = 0.032; // example 30-day fixed deposit rate
export const FD_TERM_DAYS = 30;
export const MIN_BUFFER = 1500; // SGD — never recommend moving below this

export function findIdleMoney(graph: CustomerLifeGraph, minBuffer = MIN_BUFFER): AgentAction[] {
  const actions: AgentAction[] = [];

  for (const account of graph.accounts) {
    if (account.balance < IDLE_THRESHOLD) continue;
    if (account.interestRate > IDLE_RATE_CEILING) continue;
    if (account.balance <= minBuffer) continue;

    const transferAmount = account.balance - minBuffer;
    const termGain = transferAmount * (BETTER_FD_RATE - account.interestRate) * (FD_TERM_DAYS / 365);

    actions.push({
      id: `yield_${account.id}`,
      agent: "yield",
      actionType: "recommendation",
      description: `S$${account.balance.toLocaleString()} is idle in "${account.name}" earning ${(
        account.interestRate * 100
      ).toFixed(2)}%. Move S$${transferAmount.toLocaleString()} into a ${FD_TERM_DAYS}-day fixed deposit at ${(
        BETTER_FD_RATE * 100
      ).toFixed(1)}% p.a. — earns roughly S$${termGain.toFixed(2)}, keeping S$${minBuffer.toLocaleString()} accessible.`,
      requiresApproval: true, // moving money always needs a human OK in the MVP
      timestamp: new Date().toISOString(),
    });
  }

  return actions;
}
