'use strict';
// Dummy service worker to satisfy PWA installation constraints successfully
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(clients.claim()); });
self.addEventListener('fetch', (event) => {
    // Only intercept basic GET if we wanted to cache, otherwise passthrough
    event.respondWith(fetch(event.request));
});
