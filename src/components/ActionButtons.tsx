"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActionButtons({
  actionId,
  approveLabel = "Approve",
  dismissLabel = "Dismiss",
  compact = false,
}: {
  actionId: string;
  approveLabel?: string;
  dismissLabel?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"approved" | "dismissed" | null>(null);

  async function act(status: "approved" | "dismissed") {
    setPendingAction(status);
    await fetch(`/api/actions/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  const busy = pendingAction !== null;
  // min-w keeps both buttons the same size regardless of label length —
  // without it, "flex-1" only equalizes width when the row has extra
  // space to divide (e.g. a full-width card); next to other inline
  // content it falls back to each button's own text width, so a short
  // label like "Keep" ends up nearly circular next to a longer one.
  const sizeClasses = compact ? "h-10 min-w-[92px] px-4 text-[13px]" : "h-[52px] px-6 text-[15px]";

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act("approved")}
        disabled={busy}
        className={`flex flex-1 items-center justify-center rounded-full bg-orbit-accent font-semibold text-orbit-accent-contrast transition disabled:opacity-60 ${sizeClasses}`}
      >
        {pendingAction === "approved" ? "Approving…" : approveLabel}
      </button>
      <button
        onClick={() => act("dismissed")}
        disabled={busy}
        className={`flex flex-1 items-center justify-center rounded-full border border-orbit-border font-medium text-orbit-text transition disabled:opacity-60 ${sizeClasses}`}
      >
        {pendingAction === "dismissed" ? "Dismissing…" : dismissLabel}
      </button>
    </div>
  );
}
