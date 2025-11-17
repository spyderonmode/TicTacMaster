import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import VerifyEmail from "@/pages/verify-email";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import LoadingScreen from "@/components/LoadingScreen";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";
import { UpdateNotificationManager } from "@/components/UpdateNotificationManager";
import { Component, useState, useEffect } from "react";

// Error boundary to catch white screen crashes
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button 
              onClick={() => this.setState({ hasError: false })} 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

 // Global navigation handler
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      setLocation(event.detail.path);
    };
    window.addEventListener('navigate', handleNavigate as EventListener);
    
    return () => window.removeEventListener('navigate', handleNavigate as EventListener);
     }, [setLocation]);
  // Router render state tracking

  // Define public routes that don't require authentication
  const publicRoutes = ['/reset-password', '/verify-email', '/auth', '/'];

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(location) || location.startsWith('/reset-password') || location.startsWith('/verify-email');

  // Mark as initially loaded once we get the first auth response (success or failure)
  useEffect(() => {
    if (!isLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
      // Set a flag to indicate we've moved past the initial load - faster for better performance
      setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
    }
  }, [isLoading, hasInitiallyLoaded]);

  // Force loading to complete after 1.5 seconds to prevent infinite loading - faster startup
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInitiallyLoaded) {
        setHasInitiallyLoaded(true);
        setIsInitialLoad(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasInitiallyLoaded]);

  // Prevent loading screen from showing on navigations (room exits, page refreshes, etc)
  useEffect(() => {
    // If we've already shown the initial loading screen once, don't show it again
    if (hasInitiallyLoaded) {
      setIsInitialLoad(false);
    }
  }, [location, hasInitiallyLoaded]);

  // Show loading screen during authentication check (but only for a limited time)
  if (isLoading && !hasInitiallyLoaded && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Background animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        </div>

        {/* Main content */}
        <div className="relative text-center space-y-4">
          {/* Made By DarkLayer Studios with enhanced styling */}
          <div className="relative group">
            <div className="text-2xl md:text-3xl font-bold tracking-wide">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Made By
              </span>
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent font-black text-3xl md:text-4xl tracking-wider animate-fade-in animation-delay-500">
                DarkLayer Studios
              </span>
            </div>
            
            {/* Glowing border effect */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-xl animate-pulse group-hover:blur-2xl transition-all duration-300"></div>
            
            {/* Sparkle effects */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-ping animation-delay-500"></div>
            <div className="absolute top-1/2 -left-4 w-1 h-1 bg-pink-400 rounded-full animate-ping animation-delay-1000"></div>
          </div>

          {/* Subtitle */}
          <p className="text-slate-400 text-sm md:text-base font-medium animate-fade-in animation-delay-1000 tracking-wide">
            Crafting Digital Experiences
          </p>
        </div>
      </div>
    );
  }

  // About to render content

  // Handle public routes without authentication check
  if (isPublicRoute) {
    return (
      <Switch>
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/auth">
          <Auth />
        </Route>
        <Route path="/">
          {isAuthenticated && user ? (
            (user as any).isEmailVerified ? (
              <Home />
            ) : <Auth />
          ) : (
            <Auth />
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  // For protected routes, check authentication
  if (!isAuthenticated) {
    // Rendering Auth component - user not authenticated
    return <Auth />;
  }

  // If user is authenticated but email is not verified, redirect to auth for verification
  if (isAuthenticated && user && !(user as any).isEmailVerified) {
    // Rendering Auth component - email not verified
    return <Auth />;
  }

  // User is authenticated and verified, show main app
  // Rendering main app content
  const content = (
    <Switch>
      <Route path="/auth">
        <Home />
      </Route>
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/not-found" component={NotFound} />
      <Route path="/shop">
        {/* Redirect to home and emit event to open shop */}
        {(() => {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-shop'));
            setLocation('/');
          }, 0);
          return <Home />;
        })()}
      </Route>
      <Route path="/">
        <Home />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );

  return content;
}

function App() {
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 2.5 seconds (same as auth loading)
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (showLoading) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <ThemeProvider>
              <TooltipProvider>
                <LoadingScreen />
              </TooltipProvider>
            </ThemeProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ThemeProvider>
            <TooltipProvider>
              <NetworkStatusIndicator />
              <Toaster />
              <UpdateNotificationManager />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;