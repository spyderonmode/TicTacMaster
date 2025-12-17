const IMAGE_CACHE_KEY = 'profile_image_cache_v8';
const CACHE_VERSION = 8;
const STANDARD_SIZE = 256;
const DB_NAME = 'ProfileImageCacheDB';
const DB_VERSION = 5;
const STORE_NAME = 'images8';

interface CachedImageMeta {
  url: string;
  cachedAt: number;
}

interface ImageCacheMeta {
  version: number;
  images: Record<string, CachedImageMeta>;
}

let dbInstance: IDBDatabase | null = null;

// In-memory cache for instant access (no IndexedDB delay)
const memoryCache = new Map<string, string>();
const MAX_MEMORY_CACHE_SIZE = 100;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function getFromDB(key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToDB(key: string, value: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
  }
}

async function deleteFromDB(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  } catch {
  }
}

async function clearDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  } catch {
  }
}

function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function getMetaCache(): ImageCacheMeta {
  if (!isStorageAvailable()) {
    return { version: CACHE_VERSION, images: {} };
  }
  try {
    const cached = localStorage.getItem(IMAGE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as ImageCacheMeta;
      if (parsed.version === CACHE_VERSION) {
        return parsed;
      }
    }
  } catch {
  }
  return { version: CACHE_VERSION, images: {} };
}

function saveMetaCache(cache: ImageCacheMeta): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
  }
}

function getCacheKey(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `img_${Math.abs(hash)}`;
}

export function getCachedImage(originalUrl: string): string | null {
  if (!originalUrl) return null;
  // Check in-memory cache first for instant access
  return memoryCache.get(originalUrl) || null;
}

export async function getCachedImageAsync(originalUrl: string): Promise<string | null> {
  if (!originalUrl) return null;
  
  // Check in-memory cache first (instant)
  const memoryCached = memoryCache.get(originalUrl);
  if (memoryCached) return memoryCached;
  
  const meta = getMetaCache();
  const cachedMeta = meta.images[originalUrl];
  
  if (!cachedMeta) return null;
  
  const cacheKey = getCacheKey(originalUrl);
  const imageData = await getFromDB(cacheKey);
  
  // Store in memory cache for future instant access
  if (imageData) {
    if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey) memoryCache.delete(firstKey);
    }
    memoryCache.set(originalUrl, imageData);
  }
  
  return imageData;
}

export function getCachedThumbnail(originalUrl: string): string | null {
  return getCachedImage(originalUrl);
}

export async function setCachedImage(originalUrl: string, optimized: string): Promise<void> {
  if (!originalUrl || !optimized) return;
  
  // Store in memory cache immediately for instant access
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(originalUrl, optimized);
  
  const cacheKey = getCacheKey(originalUrl);
  await saveToDB(cacheKey, optimized);
  
  const meta = getMetaCache();
  meta.images[originalUrl] = {
    url: originalUrl,
    cachedAt: Date.now()
  };
  saveMetaCache(meta);
}

export function setCachedThumbnail(originalUrl: string, thumbnail: string): void {
  setCachedImage(originalUrl, thumbnail);
}

export async function clearImageCache(): Promise<void> {
  // Clear memory cache
  memoryCache.clear();
  
  if (isStorageAvailable()) {
    try {
      localStorage.removeItem(IMAGE_CACHE_KEY);
    } catch {
    }
  }
  await clearDB();
}

export async function invalidateCacheEntry(originalUrl: string): Promise<void> {
  if (!originalUrl) return;
  
  // Clear from memory cache immediately
  memoryCache.delete(originalUrl);
  
  const cacheKey = getCacheKey(originalUrl);
  await deleteFromDB(cacheKey);
  
  if (isStorageAvailable()) {
    const meta = getMetaCache();
    if (meta.images[originalUrl]) {
      delete meta.images[originalUrl];
      saveMetaCache(meta);
    }
  }
}

export function isImageCached(originalUrl: string): boolean {
  if (!originalUrl) return false;
  const meta = getMetaCache();
  return !!meta.images[originalUrl];
}

export async function generateOptimizedImage(
  file: File | Blob | string,
  maxSize: number = STANDARD_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      let width = img.width;
      let height = img.height;
      
      const aspectRatio = width / height;
      
      if (width > height) {
        if (width > maxSize) {
          width = maxSize;
          height = Math.round(maxSize / aspectRatio);
        }
      } else {
        if (height > maxSize) {
          height = maxSize;
          width = Math.round(maxSize * aspectRatio);
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const optimized = canvas.toDataURL('image/png');
      resolve(optimized);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    if (typeof file === 'string') {
      img.src = file;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }
  });
}

export async function generateThumbnail(
  file: File | Blob | string,
  maxSize: number = STANDARD_SIZE
): Promise<string> {
  return generateOptimizedImage(file, maxSize);
}

export async function loadAndCacheImage(
  imageUrl: string,
  _maxSize: number = STANDARD_SIZE
): Promise<string> {
  if (!imageUrl) return '';
  
  const cachedImage = await getCachedImageAsync(imageUrl);
  if (cachedImage) {
    return cachedImage;
  }
  
  try {
    const optimized = await generateOptimizedImage(imageUrl, STANDARD_SIZE);
    await setCachedImage(imageUrl, optimized);
    return optimized;
  } catch {
    return imageUrl;
  }
}

export async function processImageForUpload(
  file: File,
  thumbnailSize: number = STANDARD_SIZE,
  fullSize: number = 512
): Promise<{ thumbnail: string; optimized: string }> {
  const [thumbnail, optimized] = await Promise.all([
    generateOptimizedImage(file, thumbnailSize),
    generateOptimizedImage(file, fullSize)
  ]);
  
  return { thumbnail, optimized };
}
