/**
 * Exam Pattern Analyzer (EPA) - Service Worker
 * Brand: Developed by Mehedi364 | Tagline: Analyze. Understand. Practice.
 * Provides offline-first application shell, background asset synchronization, and reliable caching.
 */

const CACHE_VERSION = 'epa-shell-v2';
const STATIC_CACHE = `epa-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `epa-runtime-${CACHE_VERSION}`;

// Core application shell assets required for complete offline functionality
const SHELL_ASSETS = [
  './',
  './index.php',
  './manifest.json',
  './assets/css/neumorphic.css',
  './assets/js/app.js',
  './assets/js/ocr-engine.js',
  './assets/js/analysis-engine.js',
  './assets/js/practice-engine.js',
  './assets/js/charts.js',
  './assets/js/export.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './dashboard.php',
  './papers.php',
  './questions.php',
  './pattern.php',
  './repeated.php',
  './years.php',
  './practice.php',
  './settings.php'
];

// 1. Installation: Pre-cache application shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Use individual adds so one missing optional file doesn't break the entire pre-cache
      await Promise.allSettled(
        SHELL_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Pre-cache warning for ${asset}:`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// 2. Activation: Clean up old cache versions and claim clients
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

// 3. Fetch handling with resilient offline-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Strategy A: HTML Page Navigations (Network-First with App Shell Fallback)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: try matched request or fall back to cached index.php shell
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallbackShell = await caches.match('./index.php') || await caches.match('./');
          if (fallbackShell) return fallbackShell;
          return new Response('EPA is offline. Please check your internet connection.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        })
    );
    return;
  }

  // Strategy B: Static Assets (CSS, JS, Images, Icons) -> Cache-First with Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached immediately, fetch update in background (Stale-While-Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(STATIC_CACHE).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {
              /* ignore background fetch failures */
            });
          return cachedResponse;
        }

        // Not in cache: fetch from network and store in runtime cache
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => {
            // Placeholder / offline fallback if asset unavailable
            return new Response('', { status: 404, statusText: 'Not Found' });
          });
      })
    );
    return;
  }

  // Strategy C: All other requests (API calls, dynamic queries) -> Network-First with Cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
