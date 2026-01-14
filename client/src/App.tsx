import startPng from "@/lib/start.png";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { OnlineStatusProvider } from "@/contexts/OnlineStatusContext";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import VerifyEmail from "@/pages/verify-email";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import VideoRewards from "@/pages/video-rewards";
import WatchAd from "@/pages/watch-ad";
import LoadingScreen from "@/components/LoadingScreen";
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

  // Define public routes that don't require authentication
  const publicRoutes = ['/reset-password', '/verify-email', '/auth', '/video-rewards/watch', '/home', '/'];

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(location) || 
                       location.startsWith('/reset-password') || 
                       location.startsWith('/verify-email') || 
                       location === '/video-rewards/watch' ||
                       location === '/home';

  // Mark as initially loaded once we get the first auth response (success or failure)
  useEffect(() => {
    if (!isLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
      // Hide loading screen immediately once auth completes
      setIsInitialLoad(false);
    }
  }, [isLoading, hasInitiallyLoaded]);

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
      <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden bg-black">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-110 contrast-110"
          style={{ 
            backgroundImage: `url(${startPng})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            height: '100%',
            width: '100%'
          }}
        />
        
        {/* Main content */}
        <div className="relative flex flex-col items-center justify-end h-full py-20 w-full max-w-md px-8">
          <div className="text-center space-y-2">
            <p className="text-[#4ade80] text-xs font-bold tracking-[0.3em] uppercase [text-shadow:1px_1px_2px_black,0_0_1em_black,0_0_0.2em_black] drop-shadow-lg">
              Crafting Digital Experiences
            </p>
            <p className="text-[#4ade80] font-black text-sm tracking-[0.4em] uppercase [text-shadow:1px_1px_2px_black,0_0_1em_black,0_0_0.2em_black] drop-shadow-lg">
              Made By DarkLayer Studios
            </p>
          </div>
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
        <Route path="/video-rewards/watch">
          <WatchAd />
        </Route>
        <Route path="/home">
          <Home />
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
      <Route path="/video-rewards/watch">
        <WatchAd />
      </Route>
      <Route path="/home">
        <Home />
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
            <OnlineStatusProvider>
              <TooltipProvider>
                <Toaster />
                <UpdateNotificationManager />
                <Router />
              </TooltipProvider>
            </OnlineStatusProvider>
          </ThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;