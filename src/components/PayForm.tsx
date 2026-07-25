"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSGD } from "@/lib/format";

export function PayForm({ accounts }: { accounts: { id: string; name: string; balance: number }[] }) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selected = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const balance = selected?.balance ?? 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amt = Number(amount);
    if (!selected) {
      setError("No account to pay from");
      return;
    }
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
      body: JSON.stringify({ accountId: selected.id, merchant: merchant.trim(), amount: amt }),
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
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-orbit-card2 p-4">
        <p className="text-xs text-orbit-muted">Available balance{selected ? ` · ${selected.name}` : ""}</p>
        <p className="mt-1 text-2xl font-bold text-orbit-text">{formatSGD(balance)}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-orbit-border bg-orbit-card p-4">
        {accounts.length > 1 && (
          <div>
            <label className="mb-1 block text-xs text-orbit-muted">Pay from</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {formatSGD(a.balance)}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-orbit-muted">Pay to</label>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Grab, a friend, a bill"
            className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
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
            className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
          />
        </div>
        {error && <p className="text-xs text-orbit-shield">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !selected}
          className="h-12 rounded-full bg-orbit-accent text-sm font-semibold text-orbit-accent-contrast disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
