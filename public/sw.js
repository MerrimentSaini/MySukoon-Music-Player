const CACHE_NAME = 'mysukoon-pwa-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.json'
];

// Perform install caching
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[PWA SW] Pre-caching structural layout assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Cache activation cleanups
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[PWA SW] Clearing deprecated layouts cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch triggers
self.addEventListener('fetch', event => {
  // Only handle standard http/https schemes to prevent chrome-extension or file blocks
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache immediately, and try to refresh asset dynamically in background
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Fetch from network normally
        return fetch(event.request).then(response => {
          // Cache successful layout assets
          if (response.status === 200 && (event.request.url.includes('.js') || event.request.url.includes('.css') || event.request.url.includes('.woff2'))) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        });
      })
      .catch(() => {
        // Offline fallback if network fails completely
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});
