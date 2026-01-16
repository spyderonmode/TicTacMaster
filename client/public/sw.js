// Persistent cache for native app wrapper
const CACHE_VERSION = 'v140';
const CACHE_NAME = `tictactoe-persistent-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tictactoe-runtime-${CACHE_VERSION}`;
const PROFILE_IMAGE_CACHE = `tictactoe-profile-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
];

const CACHE_DURATION = {
  images: 30 * 24 * 60 * 60 * 1000,
  scripts: 30 * 24 * 60 * 60 * 1000,
  styles: 30 * 24 * 60 * 60 * 1000,
  fonts: 90 * 24 * 60 * 60 * 1000,
  audio: 90 * 24 * 60 * 60 * 1000,
  api: 30 * 60 * 1000,
  html: 24 * 60 * 60 * 1000,
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
          .filter((cacheName) => {
            return (
              cacheName.startsWith('tictactoe-') &&
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== PROFILE_IMAGE_CACHE
            );
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
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
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.ico')
  );
}

function getCacheDuration(url) {
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    return CACHE_DURATION.images;
  }
  if (url.pathname.match(/\.(js|mjs)$/)) {
    return CACHE_DURATION.scripts;
  }
  if (url.pathname.match(/\.css$/)) {
    return CACHE_DURATION.styles;
  }
  if (url.pathname.match(/\.(woff2|woff|ttf|eot)$/)) {
    return CACHE_DURATION.fonts;
  }
  if (url.pathname.match(/\.(wav|mp3|ogg)$/)) {
    return CACHE_DURATION.audio;
  }
  if (url.pathname.startsWith('/api/')) {
    return CACHE_DURATION.api;
  }
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    return CACHE_DURATION.html;
  }
  return 7 * 24 * 60 * 60 * 1000;
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isProfileImage(url) {
  return (
    url.hostname.includes('googleusercontent') ||
    url.hostname.includes('githubusercontent') ||
    url.hostname.includes('facebook') ||
    url.hostname.includes('fbcdn') ||
    url.hostname.includes('twimg') ||
    url.hostname.includes('gravatar') ||
    url.hostname.includes('cloudinary') ||
    url.hostname.includes('imgur') ||
    url.hostname.includes('unsplash') ||
    url.hostname.includes('firebasestorage')
  );
}

function isExternalImage(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/);
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

async function getCachedResponse(cache, request, ignoreExpiry = false) {
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    return null;
  }
  
  if (ignoreExpiry) {
    return cachedResponse;
  }
  
  const cacheTime = cachedResponse.headers.get('sw-cache-time');
  const cacheDuration = cachedResponse.headers.get('sw-cache-duration');
  
  if (cacheTime && cacheDuration) {
    const age = Date.now() - parseInt(cacheTime);
    if (age > parseInt(cacheDuration)) {
      return { response: cachedResponse, expired: true };
    }
  }
  
  return { response: cachedResponse, expired: false };
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // Profile images from external sources - NEVER re-download if cached
  if (url.origin !== self.location.origin && (isProfileImage(url) || isExternalImage(url))) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PROFILE_IMAGE_CACHE);
        const cached = await cache.match(request);
        
        // If cached, return immediately - NO background update
        if (cached) {
          return cached;
        }
        
        // Not in cache, fetch and cache permanently
        try {
          const response = await fetch(request, { mode: 'cors', credentials: 'omit' });
          if (response.ok) {
            await cache.put(request, response.clone());
          }
          return response;
        } catch (error) {
          throw error;
        }
      })()
    );
    return;
  }

  // Skip other external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests: Network first, cache fallback
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
          const cached = await getCachedResponse(cache, request, true);
          
          if (cached?.response || cached) {
            const response = cached.response || cached;
            const headers = new Headers(response.headers);
            headers.set('X-From-Cache', 'true');
            
            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: headers
            });
          }
          
          throw error;
        }
      })()
    );
    return;
  }

  // Static assets: Cache first, background update
  if (shouldCacheRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await getCachedResponse(cache, request);
        
        if (cached?.response) {
          if (cached.expired) {
            fetch(request).then(async (networkResponse) => {
              if (networkResponse.ok) {
                const duration = getCacheDuration(url);
                await cacheWithExpiry(cache, request, networkResponse.clone(), duration);
              }
            }).catch(() => {});
          }
          return cached.response;
        }
        
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

  // HTML files: Cache first with background update
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        
        if (cached) {
          fetch(request).then(async (networkResponse) => {
            if (networkResponse.ok) {
              await cache.put(request, networkResponse.clone());
            }
          }).catch(() => {});
          
          return cached;
        }
        
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          throw error;
        }
      })()
    );
    return;
  }

  // Everything else: Cache first
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
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
  
  // Allow clearing only profile image cache
  if (event.data && event.data.type === 'CLEAR_PROFILE_IMAGES') {
    event.waitUntil(caches.delete(PROFILE_IMAGE_CACHE));
  }
  
  // Invalidate specific image URL from cache
  if (event.data && event.data.type === 'INVALIDATE_IMAGE') {
    event.waitUntil(
      caches.open(PROFILE_IMAGE_CACHE).then((cache) => {
        return cache.delete(event.data.url);
      })
    );
  }
});
