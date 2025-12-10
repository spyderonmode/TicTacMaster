const IMAGE_CACHE_KEY = 'profile_image_cache_v3';
const CACHE_VERSION = 3;
const STANDARD_SIZE = 256;

interface CachedImage {
  url: string;
  optimized: string;
  cachedAt: number;
}

interface ImageCache {
  version: number;
  images: Record<string, CachedImage>;
}

function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function getCache(): ImageCache {
  if (!isStorageAvailable()) {
    return { version: CACHE_VERSION, images: {} };
  }
  try {
    const cached = sessionStorage.getItem(IMAGE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as ImageCache;
      if (parsed.version === CACHE_VERSION) {
        return parsed;
      }
    }
  } catch {
  }
  return { version: CACHE_VERSION, images: {} };
}

function saveCache(cache: ImageCache): void {
  if (!isStorageAvailable()) return;
  try {
    sessionStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
  }
}

export function getCachedImage(originalUrl: string): string | null {
  if (!originalUrl) return null;
  const cache = getCache();
  const cached = cache.images[originalUrl];
  if (cached) {
    return cached.optimized;
  }
  return null;
}

export function getCachedThumbnail(originalUrl: string): string | null {
  return getCachedImage(originalUrl);
}

export function setCachedImage(originalUrl: string, optimized: string): void {
  if (!originalUrl || !optimized) return;
  const cache = getCache();
  cache.images[originalUrl] = {
    url: originalUrl,
    optimized,
    cachedAt: Date.now()
  };
  saveCache(cache);
}

export function setCachedThumbnail(originalUrl: string, thumbnail: string): void {
  setCachedImage(originalUrl, thumbnail);
}

export function clearImageCache(): void {
  if (!isStorageAvailable()) return;
  try {
    sessionStorage.removeItem(IMAGE_CACHE_KEY);
  } catch {
  }
}

export function invalidateCacheEntry(originalUrl: string): void {
  if (!originalUrl || !isStorageAvailable()) return;
  const cache = getCache();
  if (cache.images[originalUrl]) {
    delete cache.images[originalUrl];
    saveCache(cache);
  }
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
  
  const cached = getCachedImage(imageUrl);
  if (cached) {
    return cached;
  }
  
  try {
    const optimized = await generateOptimizedImage(imageUrl, STANDARD_SIZE);
    setCachedImage(imageUrl, optimized);
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
