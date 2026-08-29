/* Self-destructing service worker.
   The previous site on this domain was a PWA that registered a service worker
   at this exact path with scope "/". That worker intercepts every navigation
   and serves its own cached shell, so returning visitors keep seeing the old
   app no matter where DNS points. Browsers re-fetch this file on their update
   check, so replacing it with this script clears those caches, unregisters the
   worker and reloads any open tab onto the real site. */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(function (c) { c.navigate(c.url); });
  })());
});

/* Until the unregister lands, never answer from cache. */
self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request));
});
