/**
 * Exam Pattern Analyzer (EPA) - Android Embedded Service Worker
 * Brand: Developed by Mehedi364 | Tagline: Analyze. Understand. Practice.
 * Provides complete offline application shell support within Android WebView.
 */

const CACHE_VERSION = 'epa-android-v2';
const STATIC_CACHE = `epa-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `epa-runtime-${CACHE_VERSION}`;

// Core application shell assets
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/neumorphic.css',
  './js/app.js',
  './js/ocr-engine.js',
  './js/analysis-engine.js',
  './js/practice-engine.js',
  './js/charts.js',
  './js/export.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.allSettled(
        SHELL_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW-Android] Pre-cache warning for ${asset}:`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Cache version cleanup
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Resilient Offline-first fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // HTML Page Navigation -> Cache First or Network with Index.html fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  // Static Assets -> Cache First with Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
