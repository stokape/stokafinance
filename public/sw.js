/**
 * Service worker mínimo, sólo para Web Push (VAPID) — sin cache-first, sin
 * offline shell, sin nada de Workbox (costo cero, cero dependencias). No
 * intercepta `fetch`: la app sigue funcionando 100% igual sin este archivo
 * si el navegador no lo soporta, sólo no habría notificaciones push.
 */

self.addEventListener("push", (event) => {
  let payload = { title: "STOKA Finance", body: "" };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "STOKA Finance", body: event.data.text() };
    }
  }

  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192",
    badge: "/icons/icon-192",
    data: { url: payload.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(payload.title || "STOKA Finance", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});
