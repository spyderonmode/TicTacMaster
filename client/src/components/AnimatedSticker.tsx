import { motion, AnimatePresence } from 'framer-motion';
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
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div 
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative w-32 h-32">
              <img 
                src={`/gif/${sticker.assetPath}`}
                alt={sticker.name}
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
