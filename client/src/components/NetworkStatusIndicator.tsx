import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'slow' | 'offline'>('good');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
      setShowIndicator(true);
      
      setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
      setShowIndicator(true);
    };

    const checkConnectionQuality = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }

      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const latency = Date.now() - startTime;

        if (latency < 1000) {
          setConnectionQuality('good');
        } else if (latency < 3000) {
          setConnectionQuality('slow');
          setShowIndicator(true);
          setTimeout(() => setShowIndicator(false), 5000);
        } else {
          setConnectionQuality('slow');
          setShowIndicator(true);
        }
      } catch (error) {
        setConnectionQuality('offline');
        setShowIndicator(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const qualityCheck = setInterval(checkConnectionQuality, 30000);
    checkConnectionQuality();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(qualityCheck);
    };
  }, []);

  const getIndicatorConfig = () => {
    switch (connectionQuality) {
      case 'good':
        return {
          icon: Wifi,
          text: 'Back online!',
          bgColor: 'bg-green-500',
          textColor: 'text-white',
        };
      case 'slow':
        return {
          icon: Wifi,
          text: 'Slow connection',
          bgColor: 'bg-yellow-500',
          textColor: 'text-black',
        };
      case 'offline':
        return {
          icon: WifiOff,
          text: 'No connection - Using cached data',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
        };
    }
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          data-testid="network-status-indicator"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${config.bgColor} ${config.textColor} px-4 py-2 rounded-lg shadow-lg flex items-center gap-2`}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium text-sm">{config.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
