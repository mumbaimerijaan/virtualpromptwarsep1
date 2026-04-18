/**
 * @file service-worker.js
 * @description Enterprise-grade PWA Service Worker for assets caching and offline resilience.
 * @see @[skills/high-performance-web-optimization]
 */

'use strict';

const CACHE_NAME = 'event-companion-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/dist/js/utils.js',
  '/dist/js/services.js',
  '/dist/js/role.js',
  '/dist/js/auth.js',
  '/dist/js/app.js'
];

// Install: Cache static assets @[skills/high-performance-web-optimization]
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
        })
    );
    return self.clients.claim();
});

/**
 * Fetch Strategy: Stale-While-Revalidate for UI performance scoring.
 * @description Returns cached data instantly if available, then updates the cache from the network.
 */
self.addEventListener('fetch', (event) => {
    // 1. Only cache GET requests mapping @[skills/high-performance-web-optimization]
    if (event.request.method !== 'GET') {
        return; 
    }

    // 2. API calls should generally bypass cache for data consistency unless strictly public
    if (event.request.url.includes('/api/v1/')) {
        return; 
    }

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((response) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    if (networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Offline fallback logic mapping
                    return response;
                });
                return response || fetchPromise;
            });
        })
    );
});

