import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface StickerPickerProps {
  isOpen: boolean;
  ownedStickers: Array<{ sticker: any }>;
  onStickerSelect: (stickerId: string, recipientSymbol: string) => void;
  onClose: () => void;
  currentUserSymbol: 'X' | 'O' | null;
  isPending: boolean;
}

export function StickerPicker({ 
  isOpen, 
  ownedStickers, 
  onStickerSelect, 
  onClose, 
  currentUserSymbol,
  isPending 
}: StickerPickerProps) {
  if (!isOpen) return null;

  const recipientSymbol = currentUserSymbol === 'X' ? 'O' : 'X';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute bottom-20 left-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-2 border-slate-300 dark:border-slate-600 p-4 w-[280px] max-h-[400px] overflow-y-auto"
        data-testid="sticker-shop-panel"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Send Sticker
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            data-testid="button-close-sticker-shop"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {ownedStickers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              You don't own any stickers yet!
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Visit the Shop to purchase
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {ownedStickers.map(({ sticker }) => (
              <motion.button
                key={sticker.id}
                onClick={() => onStickerSelect(sticker.id, recipientSymbol)}
                disabled={isPending}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 overflow-hidden"
                data-testid={`button-send-sticker-${sticker.id}`}
              >
                <img 
                  src={`/gif/${sticker.assetPath}`}
                  alt={sticker.name}
                  className="w-16 h-16 object-contain"
                />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
