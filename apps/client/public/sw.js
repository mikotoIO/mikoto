/* eslint-disable no-restricted-globals */
// Mikoto push-only service worker.
//
// Deliberately has NO `fetch` handler — this SW never intercepts network
// requests, so it cannot serve stale JS bundles. Its only jobs are:
//   1. Receive Web Push events and show notifications.
//   2. Focus / open the app when a notification is clicked.
//
// If you add a fetch handler here, read apps/client/CLAUDE.md first and
// make sure you understand why the previous PWA attempt was rolled back.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Mikoto', body: event.data.text() };
  }

  const title = payload.title || 'Mikoto';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/logo/pwa-192x192.png',
    badge: '/logo/pwa-192x192.png',
    tag: payload.tag,
    renotify: Boolean(payload.tag),
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  const absolute = new URL(target, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientOrigin = new URL(client.url).origin;
        if (clientOrigin === self.location.origin && 'focus' in client) {
          client.navigate(absolute).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(absolute);
      }
      return undefined;
    }),
  );
});
