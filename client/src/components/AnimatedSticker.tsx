import { useEffect, useState } from 'react';

interface AnimatedStickerProps {
  sticker: {
    id: string;
    name: string;
    assetPath: string;
    animationType: string;
  };
  onComplete?: () => void;
}

export function AnimatedSticker({ sticker, onComplete }: AnimatedStickerProps) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Show sticker for 3 seconds, then fade out over 500ms
    const showTimer = setTimeout(() => {
      setOpacity(0);
    }, 3000);
    
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3500);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
      style={{ opacity, transition: 'opacity 0.5s ease-out' }}
    >
      <div className="w-32 h-32">
        <img 
          src={`/gif/${sticker.assetPath}`}
          alt={sticker.name}
          className="w-full h-full object-contain"
          decoding="async"
        />
      </div>
    </div>
  );
}
