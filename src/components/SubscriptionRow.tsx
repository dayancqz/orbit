"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSGD } from "@/lib/format";
import { StatusChip } from "./StatusChip";
import { ActionButtons } from "./ActionButtons";
import { ReasoningDisclosure } from "./ReasoningDisclosure";
import type { LifeGraphSubscription, PersistedAgentAction } from "@/lib/types";

export function SubscriptionRow({
  sub,
  usage,
  action,
}: {
  sub: LifeGraphSubscription;
  usage: { text: string; tone: "green" | "amber" | "red" };
  action?: PersistedAgentAction;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [merchant, setMerchant] = useState(sub.merchant);
  const [monthlyAmount, setMonthlyAmount] = useState(String(sub.monthlyAmount));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cancelled = sub.status === "cancelled";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amt = Number(monthlyAmount);
    if (!merchant.trim()) return setError("Enter a name");
    if (!Number.isFinite(amt) || amt <= 0) return setError("Enter a valid amount");

    setSubmitting(true);
    const res = await fetch(`/api/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: merchant.trim(), monthlyAmount: amt }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't save changes");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form
        onSubmit={save}
        className="flex flex-col gap-2 border-b border-orbit-border px-4 py-3 last:border-none"
      >
        <input
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
          className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text"
        />
        {error && <p className="text-xs text-orbit-shield">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="h-9 flex-1 rounded-full bg-orbit-accent text-xs font-semibold text-orbit-accent-contrast disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-9 flex-1 rounded-full border border-orbit-border text-xs font-medium text-orbit-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="border-b border-orbit-border px-4 py-2.5 last:border-none">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orbit-border text-xs font-bold text-orbit-text">
          {sub.merchant.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-orbit-text">{sub.merchant}</p>
          <p className="text-xs text-orbit-muted">{formatSGD(sub.monthlyAmount)}/mo</p>
          {!cancelled && (
            <span className="mt-1 inline-block">
              <StatusChip tone={usage.tone}>{usage.text}</StatusChip>
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {cancelled ? (
            <StatusChip tone="muted">Cancelled</StatusChip>
          ) : action && action.status === "pending" ? (
            <ActionButtons actionId={action.id} approveLabel="Cancel" dismissLabel="Keep" compact />
          ) : action && action.status === "dismissed" ? (
            <StatusChip tone="muted">Kept</StatusChip>
          ) : (
            <span className="text-xs font-medium text-orbit-yield">Active</span>
          )}
          {!cancelled && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${sub.merchant}`}
              className="text-xs text-orbit-muted"
            >
              ✎
            </button>
          )}
        </div>
      </div>
      {action && <ReasoningDisclosure reasoning={action.reasoning} agent="shield" />}
    </div>
  );
}
