"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSGD } from "@/lib/format";

interface Suggestion {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}

export function SettleSuggestionRow({
  groupId,
  suggestion,
  currentMemberId,
  fromIsOrbitUser,
  toIsOrbitUser,
}: {
  groupId: string;
  suggestion: Suggestion;
  currentMemberId?: string;
  fromIsOrbitUser: boolean;
  toIsOrbitUser: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function settle() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/split/groups/${groupId}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromMemberId: suggestion.fromMemberId,
        toMemberId: suggestion.toMemberId,
        amount: suggestion.amount,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't settle up");
      return;
    }
    router.refresh();
  }

  const isDebtor = currentMemberId === suggestion.fromMemberId;
  const isCreditor = currentMemberId === suggestion.toMemberId;
  const neitherIsOrbitUser = !fromIsOrbitUser && !toIsOrbitUser;

  let actionLabel: string | null = null;
  if (isDebtor && toIsOrbitUser) {
    actionLabel = `Settle ${formatSGD(suggestion.amount)}`;
  } else if (isDebtor && !toIsOrbitUser) {
    actionLabel = "Mark as paid";
  } else if (isCreditor && !fromIsOrbitUser) {
    actionLabel = "Mark as received";
  } else if (!isDebtor && !isCreditor && neitherIsOrbitUser) {
    actionLabel = "Mark as settled";
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-orbit-card2 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-orbit-text">
          <span className="font-medium">{suggestion.fromName}</span> owes{" "}
          <span className="font-medium">{suggestion.toName}</span>
        </p>
        <p className="shrink-0 text-sm font-semibold text-orbit-text">{formatSGD(suggestion.amount)}</p>
      </div>
      {actionLabel ? (
        <button
          onClick={settle}
          disabled={submitting}
          className="h-9 rounded-full bg-orbit-accent text-xs font-semibold text-orbit-accent-contrast disabled:opacity-60"
        >
          {submitting ? "Settling…" : actionLabel}
        </button>
      ) : (
        <p className="text-[11px] text-orbit-muted">
          {isCreditor ? `Waiting for ${suggestion.fromName} to settle` : "Awaiting settlement"}
        </p>
      )}
      {error && <p className="text-[11px] text-orbit-shield">{error}</p>}
    </div>
  );
}
