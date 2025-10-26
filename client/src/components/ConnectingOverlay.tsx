import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Wifi } from "lucide-react";

interface ConnectingOverlayProps {
  isVisible: boolean;
}

export function ConnectingOverlay({ isVisible }: ConnectingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          data-testid="connecting-overlay"
        >
          {/* Blurred background */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          {/* Connecting content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative z-10 flex flex-col items-center gap-4 bg-slate-900/90 backdrop-blur-md px-8 py-6 rounded-2xl border-2 border-slate-700 shadow-2xl"
          >
            {/* Animated icon */}
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Wifi className="w-16 h-16 text-blue-400" />
              </motion.div>
              
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 border-4 border-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            </div>

            {/* Connecting text */}
            <div className="flex flex-col items-center gap-2">
              <motion.h3
                className="text-2xl font-bold text-white"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                data-testid="text-connecting"
              >
                Connecting
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                >
                  .
                </motion.span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                >
                  .
                </motion.span>
              </motion.h3>
              
              <p className="text-sm text-slate-400">
                Re-establishing connection to game server
              </p>
            </div>

            {/* Loading spinner */}
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
