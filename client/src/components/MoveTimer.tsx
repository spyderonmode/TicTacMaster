import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface MoveTimerProps {
  isPlayerTurn: boolean;
  currentPlayer: 'X' | 'O';
  onTimeout?: () => void;
  gameStatus?: string;
  resetKey?: string; // Add reset key to force timer reset
}

export function MoveTimer({ isPlayerTurn, currentPlayer, onTimeout, gameStatus, resetKey }: MoveTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isActive, setIsActive] = useState(false);

  // Reset timer when it becomes player's turn or current player changes
  useEffect(() => {
    if (isPlayerTurn && gameStatus === 'active') {
      setTimeRemaining(30);
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [isPlayerTurn, currentPlayer, gameStatus, resetKey]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeRemaining > 0 && gameStatus === 'active') {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsActive(false);
            onTimeout?.();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, timeRemaining, onTimeout, gameStatus]);

  // Don't show timer if game is not active or it's not the player's turn
  if (!isPlayerTurn || gameStatus !== 'active' || !isActive) {
    return null;
  }

  const getTimerColor = () => {
    if (timeRemaining > 20) return 'text-green-500';
    if (timeRemaining > 10) return 'text-yellow-500';
    if (timeRemaining > 5) return 'text-orange-500';
    return 'text-red-500';
  };

  const getProgressColor = () => {
    if (timeRemaining > 20) return 'bg-green-500';
    if (timeRemaining > 10) return 'bg-yellow-500';
    if (timeRemaining > 5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const progressPercentage = (timeRemaining / 30) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border"
      data-testid="move-timer"
    >
      <Clock className={`w-4 h-4 ${getTimerColor()}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Your turn
          </span>
          <span className={`text-sm font-bold ${getTimerColor()}`}>
            {timeRemaining}s
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      {timeRemaining <= 5 && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className="text-red-500 font-bold text-xs"
        >
          HURRY!
        </motion.div>
      )}
    </motion.div>
  );
}