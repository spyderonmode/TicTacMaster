import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

export function useAuth() {
  const { data: user, isLoading: queryLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // Always show loading for at least 2.5 seconds, then stop regardless of query state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

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