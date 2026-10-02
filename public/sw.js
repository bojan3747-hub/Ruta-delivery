// Faza 21: minimalan service worker isključivo za Web Push notifikacije —
// namerno bez cache-ovanja ili offline logike (nije PWA, samo push
// endpoint). Mora biti u public/ (ne u src/), servira se kao statički fajl
// na /sw.js, u root-u sajta (scope zahteva da bude van /_next/).

self.addEventListener("push", (event) => {
  let data = { title: "Ruta-Dostava", body: "Imate novo obaveštenje." };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "Ruta-Dostava", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/klijent" },
  };

  event.waitUntil(self.registration.showNotification(data.title || "Ruta-Dostava", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/klijent";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
