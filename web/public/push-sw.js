/* Push Notification Service Worker — registered alongside Workbox SW */
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'e-Tunisia';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon.png',
    badge: '/icon.png',
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
