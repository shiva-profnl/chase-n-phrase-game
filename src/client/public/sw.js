// Service Worker for Chase n' Phrase Game
// Implements aggressive caching for game assets
// Note: Service workers must be JavaScript files, not TypeScript

const CACHE_NAME = 'chase-n-phrase-v1';
const STATIC_CACHE_NAME = 'chase-n-phrase-static-v1';
const DYNAMIC_CACHE_NAME = 'chase-n-phrase-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/backgrounds/main-bg.png',
  '/ui/game-logo.gif',
  '/game-elements/trophy.png',
  '/backgrounds/sub-bg-orange.png',
  '/backgrounds/sub-bg-blue.png',
  '/backgrounds/sub-bg-pink.png',
  '/buttons/navigation/how-to-play.png',
  '/buttons/navigation/back.png',
  '/buttons/sound-controls/sound-on.png',
  '/buttons/sound-controls/sound-off.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests for our assets
  if (request.method !== 'GET') return;

  // Handle game assets
  if (url.pathname.startsWith('/backgrounds/') || 
      url.pathname.startsWith('/buttons/') || 
      url.pathname.startsWith('/game-elements/') || 
      url.pathname.startsWith('/ui/') || 
      url.pathname.startsWith('/sounds/') ||
      url.pathname.startsWith('/chaser-game-instructions/') ||
      url.pathname.startsWith('/phraser-game-instructions/')) {
    
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          // Cache successful responses
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Return a fallback for failed requests
          if (request.destination === 'image') {
            return new Response('', { status: 404 });
          }
        });
      })
    );
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(request);
      })
    );
  }
});

// Message event for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});