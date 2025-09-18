import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameExpirationTimerProps {
  lastMoveAt: string | Date;
  createdAt: string | Date;
  onExpired?: () => void;
  serverTime?: string; // Server timestamp for sync
  timeRemaining?: number; // Pre-calculated time remaining from server
}

export function GameExpirationTimer({ lastMoveAt, createdAt, onExpired, serverTime, timeRemaining: serverTimeRemaining }: GameExpirationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  
  // Store the reference point for timer calculations
  const [referenceTime, setReferenceTime] = useState<{ 
    lastActivity: Date; 
    clientTime: number; 
    serverRemaining?: number; 
  }>(() => {
    const lastActivity = new Date(lastMoveAt || createdAt);
    return {
      lastActivity,
      clientTime: Date.now(),
      serverRemaining: serverTimeRemaining
    };
  });

  // Update reference time when we get new server data
  useEffect(() => {
    if (serverTimeRemaining !== undefined) {
      console.log('⏱️ Timer: Updating reference with server time remaining:', serverTimeRemaining);
      setReferenceTime({
        lastActivity: new Date(lastMoveAt || createdAt),
        clientTime: Date.now(),
        serverRemaining: serverTimeRemaining
      });
    }
  }, [serverTimeRemaining]); // Removed lastMoveAt and createdAt from dependencies to prevent timer reset on moves

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      let remaining: number;
      
      if (referenceTime.serverRemaining !== undefined) {
        // Use server-provided time as baseline
        const elapsedSinceReference = now - referenceTime.clientTime;
        remaining = Math.max(0, referenceTime.serverRemaining - elapsedSinceReference);
        console.log('⏱️ Timer calculation:', {
          serverRemaining: referenceTime.serverRemaining,
          elapsedSinceReference,
          finalRemaining: remaining
        });
      } else {
        // Fallback to client calculation
        const tenMinutes = 10 * 60 * 1000;
        const elapsed = now - referenceTime.lastActivity.getTime();
        remaining = Math.max(0, tenMinutes - elapsed);
      }
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        onExpired?.();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [referenceTime, onExpired, isExpired]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (timeRemaining / (10 * 60 * 1000)) * 100;
    if (percentage > 50) return 'text-green-500';
    if (percentage > 25) return 'text-yellow-500';
    if (percentage > 10) return 'text-orange-500';
    return 'text-red-500';
  };

  const getProgressColor = () => {
    const percentage = (timeRemaining / (10 * 60 * 1000)) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    if (percentage > 10) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const isWarning = timeRemaining < 2 * 60 * 1000; // Last 2 minutes
  const isCritical = timeRemaining < 1 * 60 * 1000; // Last 1 minute

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center space-x-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg"
      >
        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
        <span className="text-sm font-medium text-red-600 dark:text-red-400">
          Game Expired
        </span>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isCritical ? [1, 1.05, 1] : 1
        }}
        transition={{
          scale: {
            duration: 0.5,
            repeat: isCritical ? Infinity : 0,
            repeatType: "reverse"
          }
        }}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-300 ${
          isCritical 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
            : isWarning 
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' 
            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
        }`}
      >
        <motion.div
          animate={isCritical ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.3, repeat: isCritical ? Infinity : 0 }}
        >
          <Clock className={`w-4 h-4 ${getTimeColor()}`} />
        </motion.div>
        
        <div className="flex flex-col space-y-1">
          <span className={`text-sm font-mono font-medium ${getTimeColor()}`}>
            {formatTime(timeRemaining)}
          </span>
          
          {/* Progress bar */}
          <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getProgressColor()} transition-all duration-300`}
              style={{ 
                width: `${(timeRemaining / (10 * 60 * 1000)) * 100}%` 
              }}
              animate={isCritical ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ 
                duration: 0.5, 
                repeat: isCritical ? Infinity : 0,
                repeatType: "reverse" 
              }}
            />
          </div>
        </div>
        
        {isWarning && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            until expiry
          </motion.span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}