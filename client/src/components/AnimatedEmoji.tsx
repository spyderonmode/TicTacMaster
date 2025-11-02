import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedEmojiProps {
  emoji: {
    id: string;
    name: string;
    animationType: string;
  };
  onComplete?: () => void;
}

export function AnimatedEmoji({ emoji, onComplete }: AnimatedEmojiProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const getAnimationVariant = () => {
    switch (emoji.animationType) {
      case 'fly':
        return {
          initial: { opacity: 0, scale: 0.3, rotateY: -180 },
          animate: {
            opacity: 1,
            scale: [1, 1.4, 1.1],
            rotateY: [0, 360, 720],
            rotateX: [0, 20, -20, 0],
          },
          transition: {
            duration: 1.5,
            ease: 'easeInOut',
          },
        };

      case 'float':
        return {
          initial: { opacity: 0, y: 30, rotateX: 90 },
          animate: {
            opacity: 1,
            y: [0, -15, 0],
            scale: [1, 1.3, 1.1],
            rotateX: [0, 15, -15, 0],
            rotateZ: [0, 5, -5, 0],
          },
          transition: {
            duration: 2,
            ease: 'easeOut',
          },
        };

      case 'spin':
        return {
          initial: { opacity: 0, scale: 0.3, rotateZ: -180 },
          animate: {
            opacity: 1,
            scale: [1, 1.5, 1.2],
            rotateY: [0, 180, 360, 540, 720],
            rotateX: [0, 180, 360],
          },
          transition: {
            duration: 1.5,
            ease: 'easeInOut',
          },
        };

      case 'bounce':
        return {
          initial: { opacity: 0, y: 50, rotateX: -90 },
          animate: {
            opacity: 1,
            y: [0, -40, -10, -40, 0],
            scale: [1, 1.4, 1.1, 1.3, 1.1],
            rotateX: [0, 360, 720],
            rotateZ: [0, 15, -15, 10, 0],
          },
          transition: {
            duration: 1.4,
            ease: 'easeOut',
          },
        };

      case 'twinkle':
        return {
          initial: { opacity: 0, scale: 0.3, rotateY: -90 },
          animate: {
            opacity: [1, 0.6, 1, 0.6, 1],
            scale: [1, 1.6, 1.3, 1.6, 1.2],
            rotateY: [0, 180, 360, 540, 720],
            rotateX: [0, 20, -20, 20, 0],
            rotateZ: [0, 15, -15, 15, 0],
          },
          transition: {
            duration: 1.8,
            ease: 'easeInOut',
          },
        };

      case 'pulse':
        return {
          initial: { opacity: 0, scale: 0.3 },
          animate: {
            opacity: 1,
            scale: [1, 1.5, 1.2, 1.5, 1.2],
            rotateY: [0, 360, 720],
            rotateX: [0, 180, 360],
          },
          transition: {
            duration: 1.5,
            ease: 'easeInOut',
          },
        };

      default:
        return {
          initial: { opacity: 0, scale: 0.3, rotateY: -90 },
          animate: {
            opacity: 1,
            scale: [1, 1.3, 1.1],
            rotateY: [0, 360],
            rotateX: [0, 180],
          },
          transition: {
            duration: 1.5,
            ease: 'easeInOut',
          },
        };
    }
  };

  const variant = getAnimationVariant();

  return (
    <AnimatePresence>
      {isVisible && (
        <div 
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
          style={{
            perspective: '2000px',
          }}
        >
          <motion.div
            style={{
              transformStyle: 'preserve-3d',
            }}
            initial={variant.initial}
            animate={variant.animate}
            exit={{ opacity: 0, scale: 0.3, rotateY: 180 }}
            transition={{ ...variant.transition, exit: { duration: 0.5 } }}
          >
            <div 
              className="text-7xl"
              style={{
                textShadow: '0 0 40px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 255, 255, 0.8), 0 15px 40px rgba(0, 0, 0, 0.6)',
                filter: 'drop-shadow(0 5px 30px rgba(255, 215, 0, 0.9)) brightness(1.3) contrast(1.1)',
                transformStyle: 'preserve-3d',
                WebkitBackfaceVisibility: 'visible',
                backfaceVisibility: 'visible',
              }}
            >
              {emoji.name.split(' ')[0]}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
