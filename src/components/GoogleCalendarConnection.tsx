"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";

export function GoogleCalendarConnection({
  configured,
  connection,
}: {
  configured: boolean;
  connection: { email: string | null; lastSyncedAt: string | null } | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function disconnect() {
    setBusy(true);
    await fetch("/api/calendar/google/disconnect", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  async function syncNow() {
    setBusy(true);
    await fetch("/api/calendar/google/sync", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-orbit-border bg-orbit-card p-4">
      <p className="mb-1 text-sm font-semibold text-orbit-text">Google Calendar</p>

      {!configured ? (
        <p className="text-xs text-orbit-muted">
          Not set up yet — add Google OAuth credentials to .env to turn this on.
        </p>
      ) : connection ? (
        <>
          <p className="mb-3 text-xs text-orbit-muted">
            Connected{connection.email ? ` as ${connection.email}` : ""}
            {connection.lastSyncedAt ? ` · synced ${formatRelativeTime(connection.lastSyncedAt)}` : " · not synced yet"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={syncNow}
              disabled={busy}
              className="flex-1 rounded-full border border-orbit-border py-2 text-xs font-medium text-orbit-text disabled:opacity-60"
            >
              {busy ? "Working…" : "Sync now"}
            </button>
            <button
              onClick={disconnect}
              disabled={busy}
              className="flex-1 rounded-full border border-orbit-border py-2 text-xs font-medium text-orbit-shield disabled:opacity-60"
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-xs leading-relaxed text-orbit-muted">
            Connect your real calendar so Pulse can spot trips automatically — no need to enter them by hand.
          </p>
          <a
            href="/api/calendar/google/connect"
            className="block rounded-full bg-orbit-accent py-2 text-center text-xs font-semibold text-orbit-accent-contrast"
          >
            Connect Google Calendar
          </a>
        </>
      )}
    </div>
  );
}
