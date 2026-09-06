"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteQrPanel({
  groupId,
  joinUrl,
  qrDataUrl,
  canRegenerate,
}: {
  groupId: string;
  joinUrl: string;
  qrDataUrl: string;
  canRegenerate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyLink() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerate() {
    setRegenerating(true);
    setError(null);
    const res = await fetch(`/api/split/groups/${groupId}/invite/regenerate`, { method: "POST" });
    setRegenerating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't regenerate the invite code");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-orbit-border bg-orbit-card p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-medium text-orbit-muted"
      >
        <span>INVITE VIA QR</span>
        <span>{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col items-center gap-3">
          <div className="rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="Scan to join this Split group" width={180} height={180} />
          </div>
          <p className="text-center text-xs text-orbit-muted">
            Anyone with an Orbit account can scan this to join instantly.
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="w-full rounded-full border border-orbit-border py-2.5 text-sm font-medium text-orbit-text"
          >
            {copied ? "Link copied ✓" : "Copy link"}
          </button>
          {canRegenerate && (
            <button
              type="button"
              onClick={regenerate}
              disabled={regenerating}
              className="text-xs text-orbit-shield disabled:opacity-60"
            >
              {regenerating ? "Regenerating…" : "Regenerate code (invalidates the old one)"}
            </button>
          )}
          {error && <p className="text-xs text-orbit-shield">{error}</p>}
        </div>
      )}
    </div>
  );
}
