"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES: { value: string; label: string }[] = [
  { value: "savings", label: "Savings" },
  { value: "current", label: "Current" },
  { value: "fixed_deposit", label: "Fixed Deposit" },
];

export function AddAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("savings");
  const [balance, setBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const balanceNum = Number(balance);
    const rateNum = Number(interestRate);
    if (!name.trim()) return setError("Enter an account name");
    if (!Number.isFinite(balanceNum) || balanceNum < 0) return setError("Enter a valid starting balance");
    if (!Number.isFinite(rateNum) || rateNum < 0) return setError("Enter a valid interest rate");

    setSubmitting(true);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type, balance: balanceNum, interestRate: rateNum }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't add that account");
      return;
    }

    setName("");
    setBalance("");
    setInterestRate("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-dashed border-orbit-border py-4 text-center text-sm font-medium text-orbit-muted"
      >
        + Add another account
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-2xl border border-orbit-border bg-orbit-card p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-orbit-text">Add account</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-orbit-muted">
          Cancel
        </button>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Account name, e.g. Everyday Checking"
        className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text"
      >
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-orbit-muted">Starting balance (S$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-orbit-muted">Interest rate (% p.a.)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            placeholder="0.05"
            className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
          />
        </div>
      </div>

      {error && <p className="text-xs text-orbit-shield">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-full bg-orbit-accent text-sm font-semibold text-orbit-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add account"}
      </button>
    </form>
  );
}
