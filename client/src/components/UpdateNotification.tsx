import { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss?: () => void;
}

// --- Animated Update Notification (Recommended) ---
export function UpdateNotification({ onUpdate, onDismiss }: UpdateNotificationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth entrance
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    setShow(false);
    // Delay onUpdate to allow exit animation to run
    setTimeout(onUpdate, 300); 
  };

  const handleDismiss = () => {
    setShow(false);
    // Delay onDismiss to allow exit animation to run
    setTimeout(() => onDismiss?.(), 300);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          // Fixed position, bottom-4, centered, max-w-sm for compactness
          className="fixed bottom-4 left-0 right-0 z-[9999] w-full px-4 max-w-sm mx-auto" 
          data-testid="update-notification"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl shadow-2xl border border-white/20 dark:border-white/10 backdrop-blur-sm overflow-hidden">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" />
            
            {/* Content - Compacted */}
            <div className="relative px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      New Update Available! ✨
                    </p>
                    <p className="text-white/80 text-xs truncate">
                      Click Update to get the latest features.
                    </p>
                  </div>
                </div>

                {/* Action buttons - Moved inline and simplified */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={handleUpdate}
                    className="bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 font-semibold py-2 px-3 rounded-lg hover:bg-white/95 transition-all duration-200 shadow-md flex items-center justify-center gap-1 text-xs"
                    data-testid="button-update-now"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Update</span>
                  </button>
                  
                  {/* Dismiss button */}
                  {onDismiss && (
                    <button
                      onClick={handleDismiss}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                      aria-label="Dismiss update notification"
                      data-testid="button-dismiss-update"
                    >
                      <X className="w-4 h-4 text-white/80" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 animate-pulse" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Simple Update Notification (Fallback/Non-Animated Version) ---
export function SimpleUpdateNotification({ onUpdate, onDismiss }: UpdateNotificationProps) {
  return (
    <div
      // Fixed position, bottom-4, centered, max-w-sm for compactness
      className="fixed bottom-4 left-0 right-0 z-[9999] w-full px-4 max-w-sm mx-auto"
      data-testid="update-notification"
    >
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl shadow-2xl border border-white/20 dark:border-white/10 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-9 h-9 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  New Update Available! ✨
                </p>
                <p className="text-white/80 text-xs truncate">
                  Click Update to get the latest features.
                </p>
              </div>
            </div>

            {/* Action buttons - Moved inline and simplified */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                onClick={onUpdate}
                className="bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 font-semibold py-2 px-3 rounded-lg hover:bg-white/95 transition-all duration-200 shadow-md flex items-center justify-center gap-1 text-xs"
                data-testid="button-update-now"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Update</span>
              </button>
              
              {/* Dismiss button */}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Dismiss update notification"
                  data-testid="button-dismiss-update"
                >
                  <X className="w-4 h-4 text-white/80" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500" />
      </div>
    </div>
  );
}