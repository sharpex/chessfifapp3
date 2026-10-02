// Push notifications only. This is deliberately a SEPARATE service worker from the one
// vite-plugin-pwa generates for offline app-shell caching (see vite.config.js) — that one
// is auto-generated at build time and shouldn't be hand-edited or replaced. Registering
// this one at its own narrower scope ('/push/', see utils/pushNotifications.js) means the
// two coexist without either one controlling or overwriting the other; there's no real
// content under /push/, that scope exists purely so this registration is distinct.

self.addEventListener('install', () => {
  self.skipWaiting(); // no existing content depends on this worker, so activate right away
});

self.addEventListener('push', event => {
  let payload = { title: 'ChessFifa', body: '' };
  try {
    if (event.data) payload = event.data.json();
  } catch (err) {
    // Non-JSON push payload (shouldn't happen — the backend always sends JSON via
    // utils/webPush.js) — fall back to the default title/body above rather than failing
    // to show anything at all.
  }

  const { title, body, data } = payload;
  event.waitUntil(
    self.registration.showNotification(title || 'ChessFifa', {
      body: body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      data: data || {},
      tag: (data && data.type) || 'chessfifa-notification', // replaces a previous unread
      // notification of the same type instead of stacking duplicates (e.g. two
      // "challenge accepted" pushes landing before either is read)
      renotify: true
    })
  );
});

// Clicking the notification focuses an already-open tab if there is one, rather than
// always opening a new one — most of the time the app is already open somewhere.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
