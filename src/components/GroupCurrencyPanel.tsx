"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_TRIP_CURRENCIES } from "@/lib/splitMath";
import { formatRelativeTime } from "@/lib/format";

export function GroupCurrencyPanel({
  groupId,
  currency,
  exchangeRateToSGD,
  rateUpdatedAt,
  canEdit,
}: {
  groupId: string;
  currency: string;
  exchangeRateToSGD: number;
  rateUpdatedAt: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(currency);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(nextCurrency: string) {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/split/groups/${groupId}/currency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: nextCurrency }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't update the currency");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-orbit-border bg-orbit-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-orbit-muted">TRIP CURRENCY</p>
          <p className="mt-1 text-sm font-semibold text-orbit-text">
            {currency}
            {currency !== "SGD" && (
              <span className="ml-1.5 font-normal text-orbit-muted">
                (1 {currency} ≈ S${exchangeRateToSGD.toFixed(4)})
              </span>
            )}
          </p>
          {rateUpdatedAt && currency !== "SGD" && (
            <p className="mt-0.5 text-[11px] text-orbit-muted">
              Rate updated {formatRelativeTime(rateUpdatedAt)}
            </p>
          )}
        </div>
        {canEdit && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-orbit-accent">
            Change
          </button>
        )}
      </div>

      {canEdit && editing && (
        <div className="mt-3 flex flex-col gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text"
          >
            {SUPPORTED_TRIP_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update(selected)}
              disabled={submitting}
              className="h-10 min-w-[92px] flex-1 rounded-full bg-orbit-accent px-4 text-xs font-semibold text-orbit-accent-contrast disabled:opacity-60"
            >
              {submitting ? "Updating…" : selected === currency ? "Refresh rate" : "Update"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setSelected(currency);
                setError(null);
              }}
              className="h-10 min-w-[92px] flex-1 rounded-full border border-orbit-border px-4 text-xs font-medium text-orbit-muted"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-orbit-shield">{error}</p>}
        </div>
      )}
    </div>
  );
}
