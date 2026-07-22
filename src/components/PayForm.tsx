"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PayForm({ accountId, balance }: { accountId: string; balance: number }) {
  const router = useRouter();
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amt = Number(amount);
    if (!merchant.trim()) {
      setError("Enter who you're paying");
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amt > balance) {
      setError("That's more than your available balance");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, merchant: merchant.trim(), amount: amt }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Payment failed");
      return;
    }

    setMerchant("");
    setAmount("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-orbit-border bg-orbit-card p-4">
      <div>
        <label className="mb-1 block text-xs text-orbit-muted">Pay to</label>
        <input
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="e.g. Grab, a friend, a bill"
          className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-white placeholder:text-orbit-muted"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-orbit-muted">Amount (S$)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-white placeholder:text-orbit-muted"
        />
      </div>
      {error && <p className="text-xs text-orbit-shield">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="h-12 rounded-full bg-orbit-pulse text-sm font-semibold text-[#0A0F1E] disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
