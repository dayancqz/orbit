"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddSubscriptionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amt = Number(monthlyAmount);
    if (!merchant.trim()) return setError("Enter a subscription name");
    if (!Number.isFinite(amt) || amt <= 0) return setError("Enter a valid monthly amount");

    setSubmitting(true);
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: merchant.trim(), monthlyAmount: amt }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't add that subscription");
      return;
    }

    setMerchant("");
    setMonthlyAmount("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="m-4 rounded-2xl border border-dashed border-orbit-border py-4 text-center text-sm font-medium text-orbit-muted"
      >
        + Add subscription
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="m-4 flex flex-col gap-3 rounded-2xl border border-orbit-border bg-orbit-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-orbit-text">Add subscription</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-orbit-muted">
          Cancel
        </button>
      </div>

      <input
        value={merchant}
        onChange={(e) => setMerchant(e.target.value)}
        placeholder="e.g. Disney+"
        className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
      />

      <div>
        <label className="mb-1 block text-xs text-orbit-muted">Monthly amount (S$)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={monthlyAmount}
          onChange={(e) => setMonthlyAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
        />
      </div>

      {error && <p className="text-xs text-orbit-shield">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-full bg-orbit-accent text-sm font-semibold text-orbit-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add subscription"}
      </button>
    </form>
  );
}
