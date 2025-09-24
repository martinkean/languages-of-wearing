// Service Worker for "The Language of Wearing" PWA
// Provides offline functionality and caching for better user experience

const CACHE_NAME = 'language-of-wearing-v1';
const STATIC_CACHE_NAME = 'language-of-wearing-static-v1';
const DYNAMIC_CACHE_NAME = 'language-of-wearing-dynamic-v1';

// Resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/stylesheet.css',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
];

// Network-first resources (API calls, dynamic content)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /supabase/,
  /\.json$/
];

// Cache-first resources (static assets, fonts, images)
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:css|js)$/,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove old versions of our caches
              return cacheName.startsWith('language-of-wearing-') && 
                     cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        // Ensure the service worker takes control of all pages immediately
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Service Worker: Activation failed', error);
      })
  );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Skip Chrome extension requests
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Apply different caching strategies based on resource type
  if (isNetworkFirstResource(request.url)) {
    // Network-first strategy for dynamic content and API calls
    event.respondWith(networkFirstStrategy(request));
  } else if (isCacheFirstResource(request.url)) {
    // Cache-first strategy for static assets
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Stale-while-revalidate strategy for HTML pages
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Helper function to determine if resource should use network-first strategy
function isNetworkFirstResource(url) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

// Helper function to determine if resource should use cache-first strategy  
function isCacheFirstResource(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

// Network-first caching strategy
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response for future offline access
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network request failed, trying cache:', request.url);
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If both network and cache fail, return offline page for navigation requests
    if (request.destination === 'document') {
      return createOfflineResponse();
    }
    
    // For other requests, throw the error
    throw error;
  }
}

// Cache-first caching strategy
async function cacheFirstStrategy(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache the response if successful
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Both cache and network failed for:', request.url);
    throw error;
  }
}

// Stale-while-revalidate caching strategy
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = caches.match(request);
  
  const networkResponse = fetch(request)
    .then((response) => {
      // Update cache with fresh response
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE_NAME);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch((error) => {
      console.log('Service Worker: Network request failed:', request.url, error);
    });
  
  // Return cached response immediately, network response will update cache in background
  const cached = await cachedResponse;
  return cached || networkResponse;
}

// Create an offline response for navigation requests
function createOfflineResponse() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - The Language of Wearing</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 2rem;
          background: #f9fafb;
          color: #374151;
          text-align: center;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .offline-container {
          max-width: 500px;
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          color: #6366f1;
          margin-bottom: 1rem;
          font-size: 1.875rem;
          font-weight: 600;
        }
        p {
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .retry-button {
          background: #6366f1;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s;
        }
        .retry-button:hover {
          background: #4f46e5;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>
          It looks like you're not connected to the internet. 
          The Language of Wearing app works best with an internet connection, 
          but you can still view cached content.
        </p>
        <p>
          <strong>Tips:</strong><br>
          • Check your internet connection<br>
          • Try refreshing the page when back online<br>
          • Previously submitted responses are saved safely
        </p>
        <button class="retry-button" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
      
      <script>
        // Automatically retry when back online
        window.addEventListener('online', () => {
          window.location.reload();
        });
        
        // Show connection status
        if (navigator.onLine) {
          document.querySelector('h1').textContent = 'Connection Restored';
          document.querySelector('p').innerHTML = 'Great! You\\'re back online. <a href="/" style="color: #6366f1;">Return to the app</a>';
        }
      </script>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}

// Handle background sync for offline form submissions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-form-data') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(syncFormData());
  }
});

// Background sync function to submit cached form data when back online
async function syncFormData() {
  try {
    // This would retrieve cached form submissions from IndexedDB
    // and attempt to submit them when back online
    console.log('Service Worker: Syncing cached form data...');
    
    // Implementation would go here for production app
    // 1. Retrieve pending submissions from IndexedDB
    // 2. Attempt to submit each one to Supabase
    // 3. Remove successfully submitted entries
    // 4. Keep failed submissions for next sync attempt
    
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New update from The Language of Wearing',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/action-dismiss.png'
        }
      ],
      requireInteraction: false,
      silent: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Language of Wearing', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          
          // If not open, open new window
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Log service worker version and status
console.log(`Service Worker: Language of Wearing PWA - Version 1.0.0`);
console.log(`Service Worker: Cache Strategy - Network-first for APIs, Cache-first for static assets`);
console.log(`Service Worker: Offline support enabled with fallback pages`);