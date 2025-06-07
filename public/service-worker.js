// Service Worker for BeeKeeper Pro App
const CACHE_NAME = 'beekeeper-pro-v1';

// Assets to cache initially
const INITIAL_CACHED_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/src/main.tsx',
  '/src/App.tsx',
];

// Install event - caches core resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching initial resources');
        return cache.addAll(INITIAL_CACHED_RESOURCES);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Immediately claim clients so the SW takes control without waiting for reload
  return self.clients.claim();
});

// Fetch event - serve from cache, then network with cache refresh
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          // For API requests, check for fresh data in the background
          if (event.request.url.includes('/api/')) {
            fetchAndUpdateCache(event.request);
          }
          return cachedResponse;
        }

        // Otherwise try to fetch from network
        return fetchAndUpdateCache(event.request);
      })
      .catch(() => {
        // For navigation requests, return the offline page if network fails
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        
        // Return nothing for other types of requests that fail
        return null;
      })
  );
});

// Helper function to fetch and update cache
function fetchAndUpdateCache(request) {
  return fetch(request)
    .then((response) => {
      // Return early if response is invalid
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      // Clone the response since we need to use it twice
      const responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then((cache) => {
          // Don't cache API responses that are likely to change often
          if (!request.url.includes('/api/auth/')) {
            cache.put(request, responseToCache);
          }
        });

      return response;
    })
    .catch((error) => {
      console.error('Fetch failed:', error);
      throw error;
    });
}

// Handle sync events (for offline operations)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-operations') {
    event.waitUntil(syncPendingOperations());
  }
});

// Helper function to process operations saved while offline
async function syncPendingOperations() {
  try {
    // This is where you would implement your logic to process operations
    // that were stored while the app was offline
    console.log('Service Worker: Syncing pending operations');
    
    // Code to get pending operations from IndexedDB and process them
    // would go here in a real implementation
  } catch (error) {
    console.error('Service Worker: Sync failed', error);
  }
}
