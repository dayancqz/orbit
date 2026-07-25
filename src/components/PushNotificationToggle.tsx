"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function Switch({ on }: { on: boolean }) {
  return (
    <span className={`relative h-6 w-11 shrink-0 rounded-full ${on ? "bg-orbit-accent" : "bg-orbit-border"}`}>
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </span>
  );
}

export function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {});
  }, []);

  async function enable() {
    setError(null);
    setBusy(true);
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("Push isn't set up on the server yet.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission wasn't granted.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      setSubscribed(true);
    } catch {
      setError("Couldn't enable notifications on this browser.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <div className="rounded-2xl border border-orbit-border bg-orbit-card p-4">
        <p className="mb-1 text-sm font-semibold text-orbit-text">Push notifications</p>
        <p className="text-xs text-orbit-muted">Not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orbit-border bg-orbit-card p-4">
      <button
        onClick={() => (subscribed ? disable() : enable())}
        disabled={busy}
        className="flex w-full items-center justify-between disabled:opacity-60"
      >
        <span className="text-left">
          <span className="block text-sm font-semibold text-orbit-text">Push notifications</span>
          <span className="block text-xs text-orbit-muted">
            {subscribed ? "Enabled on this browser" : "Get notified when an agent flags something"}
          </span>
        </span>
        <Switch on={subscribed} />
      </button>
      {error && <p className="mt-2 text-xs text-orbit-shield">{error}</p>}
    </div>
  );
}
