// Orbit service worker — exists solely to receive Web Push events and show
// a notification. No offline caching / asset interception on purpose,
// this isn't a PWA-offline project, just a push delivery endpoint.

self.addEventListener("push", (event) => {
  let payload = { title: "Orbit", body: "You have an update." };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    // fall back to the default payload above
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
