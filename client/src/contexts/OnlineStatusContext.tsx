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
  listeners: Set<(success: boolean) => void>;
}

const heartbeatState: HeartbeatState = {
  interval: null,
  running: false,
  ownerId: null,
  userId: null,
  listeners: new Set(),
};

async function executeHeartbeat(): Promise<boolean> {
  // If a heartbeat is already running, SKIP silently
  if (heartbeatState.running) return true;

  heartbeatState.running = true;
  try {
    const response = await fetch("/api/heartbeat", {
      method: "POST",
      credentials: "include",
    });

    const success = response.ok;
    heartbeatState.listeners.forEach((listener) => listener(success));
    return success;
  } catch {
    heartbeatState.listeners.forEach((listener) => listener(false));
    return false;
  } finally {
    heartbeatState.running = false;
  }
}

function startHeartbeat(ownerId: string, userId: string): void {
  if (heartbeatState.interval && heartbeatState.userId === userId) return;

  if (heartbeatState.interval) clearInterval(heartbeatState.interval);

  heartbeatState.ownerId = ownerId;
  heartbeatState.userId = userId;

  // immediate heartbeat
  executeHeartbeat();

  // periodic heartbeat
  heartbeatState.interval = setInterval(() => {
    executeHeartbeat();
  }, 55000);
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
    const listener = (success: boolean) => {
      setLastHeartbeatSuccess(success);

      if (success) {
        setUserOnlineStatus(true);
        setHeartbeatFailures(0);
      } else {
        setHeartbeatFailures((prev) => {
          const next = prev + 1;
          if (next >= 2) setUserOnlineStatus(false);
          return next;
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
      setHeartbeatFailures(0);
      stopHeartbeat(ownerId);
      return;
    }

    startHeartbeat(ownerId, currentUserId);

    return () => {
      stopHeartbeat(ownerId);
    };
  }, [user]);

  // Trigger heartbeat on network change / resume for faster UI updates
  useEffect(() => {
    if (!user) return;

    const trigger = () => {
      executeHeartbeat();
    };

    window.addEventListener("online", trigger);

    const conn = (navigator as any).connection;
    if (conn?.addEventListener) conn.addEventListener("change", trigger);

    const onVis = () => {
      if (document.visibilityState === "visible") trigger();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("online", trigger);
      if (conn?.removeEventListener) conn.removeEventListener("change", trigger);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user]);

  /**
   * ✅ Correct online logic for realtime games:
   * - If heartbeat fails twice => offline (don’t trust stale sockets)
   * - Otherwise require heartbeat AND websocket to be healthy
   */
  const actualOnlineStatus =
    heartbeatFailures >= 2 ? false : (userOnlineStatus && isConnected);

  return (
    <OnlineStatusContext.Provider
      value={{
        isOnline: actualOnlineStatus,
        isConnected,
        heartbeatFailures,
        lastHeartbeatSuccess,
      }}
    >
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatusContext() {
  const context = useContext(OnlineStatusContext);
  if (context === undefined) {
    throw new Error("useOnlineStatusContext must be used within an OnlineStatusProvider");
  }
  return context;
}
