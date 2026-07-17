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
  const sizeClasses = compact ? "h-10 text-[13px]" : "h-[52px] text-[15px]";

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act("approved")}
        disabled={busy}
        className={`flex flex-1 items-center justify-center rounded-full bg-orbit-pulse font-semibold text-[#0A0F1E] transition disabled:opacity-60 ${sizeClasses}`}
      >
        {pendingAction === "approved" ? "Approving…" : approveLabel}
      </button>
      <button
        onClick={() => act("dismissed")}
        disabled={busy}
        className={`flex flex-1 items-center justify-center rounded-full border border-orbit-border font-medium text-white transition disabled:opacity-60 ${sizeClasses}`}
      >
        {pendingAction === "dismissed" ? "Dismissing…" : dismissLabel}
      </button>
    </div>
  );
}
