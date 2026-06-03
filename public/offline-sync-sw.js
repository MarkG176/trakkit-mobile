/* Background Sync: notify open clients to flush IndexedDB outbox (Android PWA) */
self.addEventListener('sync', (event) => {
  if (event.tag !== 'trakkit-outbox') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'FLUSH_OUTBOX' });
      });
    })
  );
});
