"use client";

import { useState } from "react";

export function PulsePlanner({ initialEvents }: { initialEvents: Array<{ id: string; title: string; startsAt: string; endsAt: string; location?: string }> }) {
  const [events, setEvents] = useState(initialEvents);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt || !endsAt) return;

    const nextEvent = {
      id: `manual_${Date.now()}`,
      title: title.trim(),
      startsAt,
      endsAt,
      location: location.trim() || undefined,
    };

    setEvents((current) => [nextEvent, ...current]);
    setTitle("");
    setStartsAt("");
    setEndsAt("");
    setLocation("");
    setIsOpen(false);
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
          <div className="mt-3 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full px-3 py-1.5 text-sm text-orbit-muted">
              Cancel
            </button>
            <button type="submit" className="rounded-full bg-orbit-pulse px-3 py-1.5 text-sm font-semibold text-white">
              Save plan
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
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvents((current) => current.filter((item) => item.id !== event.id))}
                className="rounded-full px-2 py-1 text-xs font-semibold text-orbit-muted hover:bg-orbit-surface"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
