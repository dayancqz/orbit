// Orbit Yield — Wealth Optimiser Agent
// Monitors idle balances and recommends moving money into higher-yield
// products, within guardrails the user has set.

import type { AgentAction, CustomerLifeGraph, GuardrailSettings } from "../types";

const IDLE_THRESHOLD = 1000; // SGD — balances above this are "idle"
const IDLE_RATE_CEILING = 0.01; // below 1% interest counts as "idle money"
export const FD_TERM_DAYS = 30;
export const MIN_BUFFER = 1500; // SGD — never recommend moving below this

// Three illustrative product tiers, matched to the "Risk comfort" guardrail.
// Same status as the original FD rate always had — an example figure, not
// pulled from a real product feed (there isn't one to pull from yet).
export const YIELD_TIERS = {
  Conservative: {
    product: `${FD_TERM_DAYS}-Day Fixed Deposit`,
    rate: 0.032,
    blurb: "Capital-protected, fixed term.",
  },
  Moderate: {
    product: "Blended FD + Money Market",
    rate: 0.036,
    blurb: "Split between a fixed deposit and a money market fund.",
  },
  Aggressive: {
    product: "Orbit Growth Portfolio",
    rate: 0.045,
    blurb: "A curated, higher-yield diversified fund.",
  },
} as const;

// Kept as a named export — existing callers (and the Yield page's default
// state before a recommendation loads) use this as the baseline rate.
export const BETTER_FD_RATE = YIELD_TIERS.Conservative.rate;

export function findIdleMoney(
  graph: CustomerLifeGraph,
  minBuffer = MIN_BUFFER,
  riskComfort: GuardrailSettings["riskComfort"] = "Conservative"
): AgentAction[] {
  const actions: AgentAction[] = [];
  const tier = YIELD_TIERS[riskComfort];

  for (const account of graph.accounts) {
    if (account.balance < IDLE_THRESHOLD) continue;
    if (account.interestRate > IDLE_RATE_CEILING) continue;
    if (account.balance <= minBuffer) continue;

    const transferAmount = account.balance - minBuffer;
    const termGain = transferAmount * (tier.rate - account.interestRate) * (FD_TERM_DAYS / 365);

    actions.push({
      id: `yield_${account.id}`,
      agent: "yield",
      actionType: "recommendation",
      description: `S$${account.balance.toLocaleString()} is idle in "${account.name}" earning ${(
        account.interestRate * 100
      ).toFixed(2)}%. Move S$${transferAmount.toLocaleString()} into ${tier.product} at ${(
        tier.rate * 100
      ).toFixed(1)}% p.a. — earns roughly S$${termGain.toFixed(2)} over ${FD_TERM_DAYS} days, keeping S$${minBuffer.toLocaleString()} accessible.`,
      reasoning: `Balance (S$${account.balance.toLocaleString()}) is above your S$${minBuffer.toLocaleString()} minimum, and the account's ${(
        account.interestRate * 100
      ).toFixed(2)}% rate is below the ${(IDLE_RATE_CEILING * 100).toFixed(
        0
      )}% idle threshold. Product picked for your "${riskComfort}" risk comfort.`,
      amount: transferAmount,
      requiresApproval: true, // moving money always needs a human OK in the MVP
      timestamp: new Date().toISOString(),
    });
  }

  return actions;
}
