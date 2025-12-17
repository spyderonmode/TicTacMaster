import { useState, useEffect, memo, useRef } from 'react';
import { isImageCached, getCachedImage, getCachedImageAsync, loadAndCacheImage, invalidateCacheEntry } from '@/lib/imageCache';
import { User } from 'lucide-react';

interface CachedProfileImageProps {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  fallbackIconClassName?: string;
  showFallback?: boolean;
}

function CachedProfileImageComponent({
  src,
  alt = 'Profile',
  className = 'w-10 h-10 rounded-full object-cover',
  fallbackClassName = 'w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center',
  fallbackIconClassName = 'w-5 h-5 text-white',
  showFallback = true
}: CachedProfileImageProps) {
  // Check memory cache synchronously for instant display
  const [imageSrc, setImageSrc] = useState<string | null>(() => {
    if (!src) return null;
    // First try memory cache (instant)
    const memoryCached = getCachedImage(src);
    if (memoryCached) return memoryCached;
    // If metadata says cached, use original src while loading from IndexedDB
    return isImageCached(src) ? src : null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!src) return false;
    // Not loading if we have memory cache
    if (getCachedImage(src)) return false;
    return !isImageCached(src);
  });
  const [hasError, setHasError] = useState(false);
  const loadedRef = useRef(false);
  const prevSrcRef = useRef<string | null | undefined>(src);

  useEffect(() => {
    // Detect URL change - invalidate old cache when URL changes
    if (src && prevSrcRef.current && src !== prevSrcRef.current) {
      // URL changed, invalidate the old cache
      invalidateCacheEntry(prevSrcRef.current).catch(() => {
        // Silently fail if cache invalidation errors
      });
    }
    prevSrcRef.current = src;
  }, [src]);

  useEffect(() => {
    let isMounted = true;
    
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      setImageSrc(null);
      return;
    }

    // Check memory cache first (instant - no async needed)
    const memoryCached = getCachedImage(src);
    if (memoryCached) {
      setImageSrc(memoryCached);
      setIsLoading(false);
      return;
    }

    const isCached = isImageCached(src);
    
    if (isCached) {
      // Fetch from IndexedDB (never use original src after cached)
      setIsLoading(true);
      getCachedImageAsync(src).then((cached) => {
        if (isMounted) {
          if (cached) {
            setImageSrc(cached);
          } else {
            // Fallback if IndexedDB fails but metadata exists
            setImageSrc(src);
          }
          setIsLoading(false);
        }
      }).catch(() => {
        if (isMounted) {
          setImageSrc(src);
          setIsLoading(false);
        }
      });
      return;
    }

    // Not cached - need to fetch from network
    if (loadedRef.current && imageSrc === src) {
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setImageSrc(src);

    loadAndCacheImage(src)
      .then((optimized) => {
        if (isMounted) {
          loadedRef.current = true;
          setImageSrc(optimized);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setImageSrc(src);
          setIsLoading(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [src]);

  if (!src || (hasError && !imageSrc)) {
    if (!showFallback) return null;
    return (
      <div className={fallbackClassName}>
        <User className={fallbackIconClassName} />
      </div>
    );
  }

  return (
    <img
      src={imageSrc || src}
      alt={alt}
      className={`${className} ${isLoading ? 'opacity-90' : ''}`}
      onError={() => {
        setHasError(true);
        setImageSrc(null);
      }}
      loading="lazy"
      decoding="async"
    />
  );
}

export const CachedProfileImage = memo(CachedProfileImageComponent);
