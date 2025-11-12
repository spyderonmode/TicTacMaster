// Cache version - this will automatically update when sw.js content changes
// You can also manually increment the number below to force a cache update
const CACHE_VERSION = '12.4';
const CACHE_NAME = `tictactoe-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `tictactoe-runtime-v${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
];

const CACHE_DURATION = {
  images: 7 * 24 * 60 * 60 * 1000,      // 7 days
  scripts: 7 * 24 * 60 * 60 * 1000,     // 7 days
  styles: 7 * 24 * 60 * 60 * 1000,      // 7 days
  fonts: 30 * 24 * 60 * 60 * 1000,      // 30 days
  api: 5 * 60 * 1000,                   // 5 minutes
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

function shouldCacheRequest(url) {
  return (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.mp3')
  );
}

function getCacheDuration(url) {
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    return CACHE_DURATION.images;
  }
  if (url.pathname.match(/\.(js|mjs)$/)) {
    return CACHE_DURATION.scripts;
  }
  if (url.pathname.match(/\.css$/)) {
    return CACHE_DURATION.styles;
  }
  if (url.pathname.match(/\.(woff2|woff|ttf)$/)) {
    return CACHE_DURATION.fonts;
  }
  if (url.pathname.startsWith('/api/')) {
    return CACHE_DURATION.api;
  }
  return 24 * 60 * 60 * 1000;
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

async function cacheWithExpiry(cache, request, response, duration) {
  const responseToCache = response.clone();
  const headers = new Headers(responseToCache.headers);
  headers.set('sw-cache-time', Date.now().toString());
  headers.set('sw-cache-duration', duration.toString());
  
  const modifiedResponse = new Response(responseToCache.body, {
    status: responseToCache.status,
    statusText: responseToCache.statusText,
    headers: headers
  });
  
  await cache.put(request, modifiedResponse);
}

async function getCachedResponse(cache, request) {
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    return null;
  }
  
  const cacheTime = cachedResponse.headers.get('sw-cache-time');
  const cacheDuration = cachedResponse.headers.get('sw-cache-duration');
  
  if (cacheTime && cacheDuration) {
    const age = Date.now() - parseInt(cacheTime);
    if (age > parseInt(cacheDuration)) {
      await cache.delete(request);
      return null;
    }
  }
  
  return cachedResponse;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        
        try {
          const networkResponse = await fetch(request.clone());
          
          if (networkResponse.ok) {
            const duration = getCacheDuration(url);
            await cacheWithExpiry(cache, request, networkResponse.clone(), duration);
          }
          
          return networkResponse;
        } catch (error) {
          const cachedResponse = await getCachedResponse(cache, request);
          
          if (cachedResponse) {
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-From-Cache', 'true');
            headers.set('X-Cache-Fallback', 'network-error');
            
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: headers
            });
          }
          
          throw error;
        }
      })()
    );
    return;
  }

  if (shouldCacheRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cachedResponse = await getCachedResponse(cache, request);
        
        // If we have a valid cached response, use it (no background download)
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Only fetch from network if not in cache or cache expired
        try {
          const networkResponse = await fetch(request);
          
          if (networkResponse.ok) {
            const duration = getCacheDuration(url);
            await cacheWithExpiry(cache, request, networkResponse.clone(), duration);
          }
          
          return networkResponse;
        } catch (error) {
          throw error;
        }
      })()
    );
    return;
  }

  // Network-first strategy for HTML files to ensure fresh content
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request);
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
