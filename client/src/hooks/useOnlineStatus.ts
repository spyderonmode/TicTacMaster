import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";

/**
 * Custom hook to track user's actual online status using heartbeat-based logic
 * This prioritizes heartbeat API success over WebSocket connection status
 * to provide accurate online status when users switch tabs
 */
export function useOnlineStatus() {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [userOnlineStatus, setUserOnlineStatus] = useState(true);
  const [lastHeartbeatSuccess, setLastHeartbeatSuccess] = useState(true);
  const [heartbeatFailures, setHeartbeatFailures] = useState(0);

  // Heartbeat to maintain accurate online status
  useEffect(() => {
    if (!user) {
      setUserOnlineStatus(false);
      return;
    }

    const runHeartbeat = async () => {
      try {
        const response = await fetch('/api/heartbeat', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (response.ok) {
          setLastHeartbeatSuccess(true);
          setUserOnlineStatus(true);
          setHeartbeatFailures(0); // Reset failure counter on success
        } else {
          setLastHeartbeatSuccess(false);
          setHeartbeatFailures(prev => {
            const newCount = prev + 1;
            // Only mark as offline after 3 consecutive failures (45 seconds)
            if (newCount >= 2) {
              setUserOnlineStatus(false);
            }
            return newCount;
          });
        }
      } catch (error) {
        setLastHeartbeatSuccess(false);
        setHeartbeatFailures(prev => {
          const newCount = prev + 1;
          // Only mark as offline after 3 consecutive failures (45 seconds)
          if (newCount >= 2) {
            setUserOnlineStatus(false);
          }
          return newCount;
        });
      }
    };

    // Run heartbeat immediately
    runHeartbeat();
    
    // Then run it every 15 seconds
    const heartbeat = setInterval(runHeartbeat, 45000);

    return () => clearInterval(heartbeat);
  }, [user]);

  // Determine actual online status - prioritize heartbeat status since that's what backend uses
  // If heartbeat is working (< 3 failures), user is online regardless of WebSocket
  // If heartbeat fails repeatedly, then check WebSocket as backup
  const actualOnlineStatus = heartbeatFailures < 2 ? userOnlineStatus : isConnected;

  return {
    isOnline: actualOnlineStatus,
    isConnected,
    heartbeatFailures,
    lastHeartbeatSuccess
  };
}