import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

export function useAuth() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include", // <-- This is the crucial part
      });

      if (!response.ok) {
        throw new Error("User not authenticated.");
      }
      return response.json();
    },
    retry: false,
  });

  // Prefetch user stats during loading screen so they're ready when homepage shows
  const { isLoading: statsLoading } = useQuery({
    queryKey: ["/api/users", (user as any)?.userId, "online-stats"],
    enabled: !!user && !!(user as any)?.userId,
    retry: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // Show loading for minimum 500ms, then wait for BOTH auth AND stats to complete
    const minLoadTime = 500;
    const elapsed = Date.now() - startTimeRef.current;
    
    // Check if we should wait for stats: only if user is authenticated
    const shouldWaitForStats = !!user && !!(user as any)?.userId;
    
    // Determine if all required queries are complete
    const allQueriesComplete = !userLoading && (!shouldWaitForStats || !statsLoading);
    
    if (allQueriesComplete) {
      // All queries finished, check if minimum time has passed
      if (elapsed >= minLoadTime) {
        setIsLoading(false);
      } else {
        // Wait for remaining time
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, minLoadTime - elapsed);
        return () => clearTimeout(timer);
      }
    }
  }, [userLoading, statsLoading, user]);

  // Store user data in localStorage as backup for session issues
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('backup_user_data', JSON.stringify(user));
        console.log('💾 User data backed up to localStorage');
      } catch (error) {
        console.warn('Failed to backup user data:', error);
      }
    }
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}