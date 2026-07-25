"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlannerEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  source: "manual" | "google";
}

export function PulsePlanner({ events }: { events: PlannerEvent[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !startsAt || !endsAt) {
      setError("Fill in a title and both dates");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        location: location.trim() || undefined,
      }),
    });
    setBusy(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't save that plan");
      return;
    }

    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setLocation("");
    setIsOpen(false);
    router.refresh();
  }

  async function deleteEvent(id: string) {
    setBusy(true);
    await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-orbit-pulse/40 bg-orbit-pulse/10 px-3 py-2 text-sm font-semibold text-orbit-pulse"
      >
        <span className="text-lg leading-none">+</span>
        Add plan
      </button>

      {isOpen && (
        <form onSubmit={addEvent} className="mt-3 rounded-2xl border border-orbit-border bg-orbit-card p-3 shadow-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-orbit-pulse">Manual planning</p>
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full rounded-xl border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-xl border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text outline-none"
              />
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full rounded-xl border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text outline-none"
              />
            </div>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (optional)"
              className="w-full rounded-xl border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text outline-none"
            />
          </div>
          {error && <p className="mt-2 text-xs text-orbit-shield">{error}</p>}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full px-3 py-1.5 text-sm text-orbit-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-orbit-pulse px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save plan"}
            </button>
          </div>
        </form>
      )}

      {events.length > 0 && (
        <div className="mt-3 space-y-2">
          {events.map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-2 rounded-2xl border border-orbit-border bg-orbit-card p-3">
              <div>
                <p className="text-sm font-semibold text-orbit-text">{event.title}</p>
                <p className="mt-1 text-xs text-orbit-muted">
                  {new Date(event.startsAt).toLocaleString()} {event.location ? `• ${event.location}` : ""}
                  {event.source === "google" ? " • synced from Google" : ""}
                </p>
              </div>
              {event.source === "manual" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => deleteEvent(event.id)}
                  className="rounded-full px-2 py-1 text-xs font-semibold text-orbit-muted hover:bg-orbit-surface disabled:opacity-60"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
