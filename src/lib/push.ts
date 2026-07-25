// Thin wrapper around web-push. Deliberately has no database access of its
// own (just takes subscription keys and a payload) — src/lib/db.ts owns
// looking up who to notify and cleaning up dead subscriptions, so this
// module and db.ts don't import each other in a cycle.

import webpush from "web-push";

export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("Push notifications aren't configured");
  webpush.setVapidDetails("mailto:support@orbit.app", publicKey, privateKey);
  configured = true;
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Sends to every subscription given, best-effort — one failing endpoint
// doesn't stop the others. Returns the endpoints that came back 404/410
// (browser unsubscribed or the subscription expired) so the caller can
// remove them from the database.
export async function sendPush(
  subscriptions: PushSubscriptionKeys[],
  payload: PushPayload
): Promise<string[]> {
  if (!isPushConfigured() || subscriptions.length === 0) return [];
  ensureConfigured();

  const deadEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          deadEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  return deadEndpoints;
}
