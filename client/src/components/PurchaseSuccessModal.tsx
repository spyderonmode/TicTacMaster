import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { AnimatedPiece } from "@/components/AnimatedPieces";

interface PurchaseSuccessModalProps {
  open: boolean;
  onClose: () => void;
  purchaseType: "piece" | "sticker" | "frame";
  itemName: string;
  itemDescription: string;
  itemId?: string;
  stickerAnimation?: string;
}

export function PurchaseSuccessModal({
  open,
  onClose,
  purchaseType,
  itemName,
  itemDescription,
  itemId,
  stickerAnimation,
}: PurchaseSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        // 🚨 MODIFIED LINE: Changed background to dark blue/indigo and max-width to 90vw.
        className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 border-2 border-yellow-400/50 text-white w-full max-w-[90vw] overflow-hidden"
        data-testid="modal-purchase-success"
      >
        {/* Confetti Animation Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: -20,
                backgroundColor: [
                  '#FFD700',
                  '#FF69B4',
                  '#00CED1',
                  '#FF6347',
                  '#9370DB',
                  '#32CD32'
                ][Math.floor(Math.random() * 6)]
              }}
              animate={{
                y: [0, 500],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, Math.random() * 360],
                opacity: [1, 0.8, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          data-testid="button-close-modal"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center py-6 px-4">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className="mb-6"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent"
            data-testid="text-success-title"
          >
            Purchase Successful!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            // Changed text color from 'text-purple-200' to a blue/indigo shade for better contrast with the new background
            className="text-base text-center text-blue-200 mb-6"
          >
            Thanks for your purchase!
          </motion.p>

          {/* Purchased Item Preview */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: 0.6,
              type: "spring",
              stiffness: 150,
              damping: 10
            }}
            className="bg-slate-900/60 backdrop-blur-sm border-2 border-yellow-400/30 rounded-2xl p-6 mb-4 w-full"
          >
            <div className="flex flex-col items-center gap-4">
              {/* Item Display */}
              {purchaseType === "piece" && itemId && (
                <div className="flex items-center justify-center gap-8 mb-4">
                  <motion.div
                    className="w-16 h-16 flex items-center justify-center"
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <AnimatedPiece 
                      symbol="X" 
                      style={itemId as any} 
                      className="text-blue-400"
                    />
                  </motion.div>
                  <motion.div
                    className="w-16 h-16 flex items-center justify-center"
                    animate={{
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                  >
                    <AnimatedPiece 
                      symbol="O" 
                      style={itemId as any} 
                      className="text-red-400"
                    />
                  </motion.div>
                </div>
              )}

              {purchaseType === "sticker" && stickerAnimation && (
                <motion.div
                  className="text-5xl mb-4"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {stickerAnimation}
                </motion.div>
              )}

              {/* Item Name */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-400 mb-2" data-testid="text-item-name">
                  {itemName}
                </h3>
                {/* Changed text color from 'text-purple-200' to a blue/indigo shade */}
                <p className="text-sm text-blue-200" data-testid="text-item-description">
                  {itemDescription}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="w-full"
          >
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 hover:from-yellow-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold text-lg py-6 rounded-xl shadow-2xl transform hover:scale-105 transition-all"
              data-testid="button-continue"
            >
              Continue
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            // Changed text color from 'text-purple-300' to 'text-blue-300'
            className="text-xs text-blue-300 text-center mt-4"
          >
            Your new {purchaseType === "piece" ? "piece style" : purchaseType === "emoji" ? "emoji" : "avatar frame"} is ready to use!
          </motion.p>
        </div>
      </DialogContent>
    </Dialog>
  );
}