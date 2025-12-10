import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";

interface OnlineStatusContextType {
  isOnline: boolean;
  isConnected: boolean;
  heartbeatFailures: number;
  lastHeartbeatSuccess: boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

interface OnlineStatusProviderProps {
  children: ReactNode;
}

interface HeartbeatState {
  interval: ReturnType<typeof setInterval> | null;
  running: boolean;
  ownerId: string | null;
  userId: string | null;
  listeners: Set<(success: boolean, failures: number) => void>;
}

const heartbeatState: HeartbeatState = {
  interval: null,
  running: false,
  ownerId: null,
  userId: null,
  listeners: new Set()
};

async function executeHeartbeat(): Promise<{ success: boolean; failures: number }> {
  if (heartbeatState.running) {
    return { success: false, failures: 0 };
  }
  heartbeatState.running = true;
  
  try {
    const response = await fetch('/api/heartbeat', {
      method: 'POST',
      credentials: 'include'
    });
    
    const success = response.ok;
    heartbeatState.listeners.forEach(listener => listener(success, success ? 0 : 1));
    return { success, failures: success ? 0 : 1 };
  } catch (error) {
    heartbeatState.listeners.forEach(listener => listener(false, 1));
    return { success: false, failures: 1 };
  } finally {
    heartbeatState.running = false;
  }
}

function startHeartbeat(ownerId: string, userId: string): void {
  if (heartbeatState.interval && heartbeatState.userId === userId) {
    return;
  }
  
  if (heartbeatState.interval) {
    clearInterval(heartbeatState.interval);
  }
  
  heartbeatState.ownerId = ownerId;
  heartbeatState.userId = userId;
  executeHeartbeat();
  heartbeatState.interval = setInterval(executeHeartbeat, 45000);
}

function stopHeartbeat(ownerId: string): void {
  if (heartbeatState.ownerId === ownerId && heartbeatState.interval) {
    clearInterval(heartbeatState.interval);
    heartbeatState.interval = null;
    heartbeatState.ownerId = null;
    heartbeatState.userId = null;
  }
}

export function OnlineStatusProvider({ children }: OnlineStatusProviderProps) {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [userOnlineStatus, setUserOnlineStatus] = useState(true);
  const [lastHeartbeatSuccess, setLastHeartbeatSuccess] = useState(true);
  const [heartbeatFailures, setHeartbeatFailures] = useState(0);
  const ownerIdRef = useRef<string>(Math.random().toString(36).substring(7));

  useEffect(() => {
    const listener = (success: boolean, failures: number) => {
      setLastHeartbeatSuccess(success);
      if (success) {
        setUserOnlineStatus(true);
        setHeartbeatFailures(0);
      } else {
        setHeartbeatFailures(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            setUserOnlineStatus(false);
          }
          return newCount;
        });
      }
    };
    
    heartbeatState.listeners.add(listener);
    
    return () => {
      heartbeatState.listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const currentUserId = (user as any)?.userId || null;
    const ownerId = ownerIdRef.current;
    
    if (!user || !currentUserId) {
      setUserOnlineStatus(false);
      stopHeartbeat(ownerId);
      return;
    }

    startHeartbeat(ownerId, currentUserId);

    return () => {
      stopHeartbeat(ownerId);
    };
  }, [user]);

  const actualOnlineStatus = heartbeatFailures < 2 ? userOnlineStatus : isConnected;

  return (
    <OnlineStatusContext.Provider value={{
      isOnline: actualOnlineStatus,
      isConnected,
      heartbeatFailures,
      lastHeartbeatSuccess
    }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatusContext() {
  const context = useContext(OnlineStatusContext);
  if (context === undefined) {
    throw new Error('useOnlineStatusContext must be used within an OnlineStatusProvider');
  }
  return context;
}
