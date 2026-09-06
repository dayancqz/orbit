"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MemberRow {
  name: string;
  email: string;
  userId?: string;
  lookupStatus: "idle" | "checking" | "found" | "not_found";
}

function emptyRow(): MemberRow {
  return { name: "", email: "", lookupStatus: "idle" };
}

export function NewSplitGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateMember(index: number, patch: Partial<MemberRow>) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  async function lookupEmail(index: number) {
    const email = members[index].email.trim();
    if (!email) {
      updateMember(index, { userId: undefined, lookupStatus: "idle" });
      return;
    }
    updateMember(index, { lookupStatus: "checking" });
    const res = await fetch(`/api/users/lookup?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      updateMember(index, { userId: data.user.id, name: data.user.name, lookupStatus: "found" });
    } else {
      updateMember(index, { userId: undefined, lookupStatus: "not_found" });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Enter a group name");
    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length === 0) return setError("Add at least one other member");

    setSubmitting(true);
    const res = await fetch("/api/split/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        members: validMembers.map((m) => ({ name: m.name.trim(), userId: m.userId })),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't create group");
      return;
    }

    const data = await res.json();
    router.push(`/split/${data.group.id}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-4">
      <div>
        <label className="mb-1 block text-xs text-orbit-muted">Group name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Seoul Trip"
          className="w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs text-orbit-muted">
          You&apos;re automatically included. Add everyone else below — enter their email if they&apos;re on
          Orbit, or just a name if they&apos;re not.
        </p>
        {members.map((m, i) => (
          <div key={i} className="rounded-2xl border border-orbit-border bg-orbit-card p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-orbit-muted">Member {i + 1}</p>
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMembers((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-xs text-orbit-shield"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              value={m.name}
              onChange={(e) => updateMember(i, { name: e.target.value })}
              placeholder="Name"
              className="mt-2 w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
            />
            <input
              value={m.email}
              onChange={(e) => updateMember(i, { email: e.target.value, userId: undefined, lookupStatus: "idle" })}
              onBlur={() => lookupEmail(i)}
              placeholder="Email (optional — leave blank if they're not on Orbit)"
              className="mt-2 w-full rounded-lg border border-orbit-border bg-orbit-surface px-3 py-2 text-sm text-orbit-text placeholder:text-orbit-muted"
            />
            {m.lookupStatus === "checking" && <p className="mt-1 text-[11px] text-orbit-muted">Checking…</p>}
            {m.lookupStatus === "found" && (
              <p className="mt-1 text-[11px] text-orbit-yield">
                ✓ Orbit user — settling up will transfer real balance
              </p>
            )}
            {m.lookupStatus === "not_found" && (
              <p className="mt-1 text-[11px] text-orbit-muted">
                No Orbit account found — will be tracked as a friend by name only
              </p>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setMembers((prev) => [...prev, emptyRow()])}
          className="rounded-2xl border border-dashed border-orbit-border py-3 text-center text-sm font-medium text-orbit-muted"
        >
          + Add another member
        </button>
      </div>

      {error && <p className="text-xs text-orbit-shield">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="h-12 rounded-full bg-orbit-accent text-sm font-semibold text-orbit-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create group"}
      </button>
    </form>
  );
}
