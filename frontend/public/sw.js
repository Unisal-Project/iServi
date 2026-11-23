self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload;

  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = {};
  }

  const title = payload.title || "iServi";

  const options = {
    body: payload.body || "Você recebeu uma nova notificação.",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: payload.tag || undefined,
    data: payload.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.openWindow("/cardapio"),
  );
});