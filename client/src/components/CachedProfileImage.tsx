import { useState, useEffect, memo } from 'react';
import { getCachedImage, loadAndCacheImage } from '@/lib/imageCache';
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
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const cached = getCachedImage(src);
    if (cached) {
      setImageSrc(cached);
      setIsLoading(false);
      return;
    }

    loadAndCacheImage(src)
      .then((optimized) => {
        setImageSrc(optimized);
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
  }, [src]);

  if (isLoading) {
    return (
      <div className={`${fallbackClassName} animate-pulse bg-slate-600`}>
      </div>
    );
  }

  if (hasError || !imageSrc) {
    if (!showFallback) return null;
    return (
      <div className={fallbackClassName}>
        <User className={fallbackIconClassName} />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}

export const CachedProfileImage = memo(CachedProfileImageComponent);
