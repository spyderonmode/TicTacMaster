import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmojiPickerProps {
  isOpen: boolean;
  ownedEmojis: Array<{ emoji: any }>;
  onEmojiSelect: (emojiId: string, recipientSymbol: string) => void;
  onClose: () => void;
  currentUserSymbol: 'X' | 'O' | null;
  isPending: boolean;
}

export function EmojiPicker({ 
  isOpen, 
  ownedEmojis, 
  onEmojiSelect, 
  onClose, 
  currentUserSymbol,
  isPending 
}: EmojiPickerProps) {
  if (!isOpen) return null;

  const recipientSymbol = currentUserSymbol === 'X' ? 'O' : 'X';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute bottom-20 left-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border-2 border-slate-300 dark:border-slate-600 p-4 w-[280px] max-h-[400px] overflow-y-auto"
        data-testid="emoji-shop-panel"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Send Emoji
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            data-testid="button-close-emoji-shop"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {ownedEmojis.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              You don't own any emojis yet!
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Visit the Shop to purchase
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {ownedEmojis.map(({ emoji }) => (
              <motion.button
                key={emoji.id}
                onClick={() => onEmojiSelect(emoji.id, recipientSymbol)}
                disabled={isPending}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center p-4 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                data-testid={`button-send-emoji-${emoji.id}`}
              >
                <span className="text-3xl">
                  {emoji.name.split(' ')[0]}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
