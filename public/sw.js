self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "K-TECH MEDIA NETWORK", body: event.data?.text() || "New story published." }; }
  event.waitUntil(self.registration.showNotification(data.title || "K-TECH MEDIA NETWORK", {
    body: data.body || "A new story is available.",
    icon: "/icon.png",
    badge: "/icon.png",
    data: { url: data.url || "/news" },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/news", self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
    return existing ? existing.navigate(target.href).then(() => existing.focus()) : self.clients.openWindow(target.href);
  }));
});
