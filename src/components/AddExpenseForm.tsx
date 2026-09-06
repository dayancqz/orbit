"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computeEqualShares, computePercentageShares, round2, type SplitType } from "@/lib/splitMath";
import { formatCurrency } from "@/lib/format";

interface Member {
  id: string;
  name: string;
}

const SPLIT_TYPES: SplitType[] = ["equal", "exact", "percentage"];

export function AddExpenseForm({
  groupId,
  members,
  groupCurrency,
}: {
  groupId: string;
  members: Member[];
  groupCurrency: string;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(members[0]?.id ?? "");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [included, setIncluded] = useState<Record<string, boolean>>(
    Object.fromEntries(members.map((m) => [m.id, true]))
  );
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = Number(amount);

  const shares = useMemo(() => {
    if (!Number.isFinite(total) || total <= 0) return [];
    const includedIds = members.filter((m) => included[m.id]).map((m) => m.id);
    if (includedIds.length === 0) return [];

    if (splitType === "equal") {
      return computeEqualShares(includedIds, total, paidById);
    }
    if (splitType === "percentage") {
      const entries = includedIds.map((id) => ({ memberId: id, percentage: Number(percentages[id] ?? "0") }));
      return computePercentageShares(entries, total, paidById);
    }
    return includedIds.map((id) => ({ memberId: id, amount: round2(Number(exactAmounts[id] ?? "0")) }));
  }, [splitType, members, included, percentages, exactAmounts, total, paidById]);

  const shareSum = round2(shares.reduce((sum, s) => sum + s.amount, 0));
  const remainder = round2(total - shareSum);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!description.trim()) return setError("Enter a description");
    if (!Number.isFinite(total) || total <= 0) return setError("Enter a valid amount");
    if (shares.length === 0) return setError("Select at least one member to split with");
    if (splitType !== "equal" && Math.abs(remainder) > 0.01) {
      return setError(
        `Shares must add up to ${formatCurrency(total, groupCurrency)} (currently ${formatCurrency(shareSum, groupCurrency)})`
      );
    }

    setSubmitting(true);
    const res = await fetch(`/api/split/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: description.trim(), amount: total, paidById, splitType, shares }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't add expense");
      return;
    }

    router.push(`/split/${groupId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-4">
      <div>
        <label className="mb-1 block text-xs text-orbit-muted">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner at XYZ"
          className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-orbit-muted">Amount ({groupCurrency})</label>
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

      <div>
        <label className="mb-1 block text-xs text-orbit-muted">Paid by</label>
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-orbit-muted">Split</label>
        <div className="flex gap-2">
          {SPLIT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSplitType(t)}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium capitalize ${
                splitType === t
                  ? "border-orbit-accent bg-orbit-accent/15 text-orbit-accent"
                  : "border-orbit-border text-orbit-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-orbit-border bg-orbit-card p-3">
        <p className="text-xs text-orbit-muted">Split between</p>
        {members.map((m) => {
          const share = shares.find((s) => s.memberId === m.id);
          return (
            <div key={m.id} className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={included[m.id] ?? false}
                onChange={(e) => setIncluded((prev) => ({ ...prev, [m.id]: e.target.checked }))}
              />
              <span className="flex-1 truncate text-sm text-orbit-text">{m.name}</span>
              {splitType === "exact" && included[m.id] && (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={exactAmounts[m.id] ?? ""}
                  onChange={(e) => setExactAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  placeholder="0.00"
                  className="w-20 rounded-lg border border-orbit-border bg-orbit-surface px-2 py-1 text-xs text-orbit-text"
                />
              )}
              {splitType === "percentage" && included[m.id] && (
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={percentages[m.id] ?? ""}
                  onChange={(e) => setPercentages((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  placeholder="0%"
                  className="w-16 rounded-lg border border-orbit-border bg-orbit-surface px-2 py-1 text-xs text-orbit-text"
                />
              )}
              {splitType === "equal" && included[m.id] && share && (
                <span className="shrink-0 text-xs text-orbit-muted">{formatCurrency(share.amount, groupCurrency)}</span>
              )}
            </div>
          );
        })}
        {total > 0 && (
          <p className={`text-[11px] ${Math.abs(remainder) > 0.01 ? "text-orbit-shield" : "text-orbit-muted"}`}>
            {formatCurrency(shareSum, groupCurrency)} of {formatCurrency(total, groupCurrency)} allocated
          </p>
        )}
      </div>

      {error && <p className="text-xs text-orbit-shield">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="h-[52px] rounded-full bg-orbit-accent text-sm font-semibold text-orbit-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add expense"}
      </button>
    </form>
  );
}
