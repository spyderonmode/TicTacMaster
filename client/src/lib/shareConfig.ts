// Share configuration that automatically detects environment and uses appropriate URLs

interface ShareConfig {
  appUrl: string;
  playStoreUrl?: string;
  appName: string;
  description: string;
}

// Environment detection
const isReplit = () => {
  return window.location.hostname.includes('replit.') || 
         window.location.hostname.includes('.replit.app') ||
         import.meta.env.VITE_REPLIT_DOMAIN;
};

const isProduction = () => {
  return import.meta.env.PROD && !isReplit();
};

// Share configuration
export const shareConfig: ShareConfig = {
  // Dynamic URL based on environment
  appUrl: isProduction() 
    ? import.meta.env.VITE_PRODUCTION_URL || window.location.origin
    : window.location.origin,
    
  // Play Store URL (always use this link for sharing)
  playStoreUrl: "https://tictac3x5.darklayerstudios.com",
  
  appName: "TicTac 3x5 - Strategic Tic-Tac-Toe",
  description: "Experience the next level of tic-tac-toe with strategic 3x5 gameplay!"
};

// Get the appropriate share URL - always use Play Store link for sharing
export const getShareUrl = (preferPlayStore: boolean = true): string => {
  // Always prefer Play Store link for sharing
  if (shareConfig.playStoreUrl) {
    return shareConfig.playStoreUrl;
  }
  
  // Fallback to web app URL if Play Store URL is not available
  return shareConfig.appUrl;
};

// Get share text based on the URL being shared
export const getShareText = (url: string): string => {
  if (url === shareConfig.playStoreUrl) {
    return `🎮 Check out ${shareConfig.appName} on Google Play! ${shareConfig.description}`;
  }
  
  return `🎯 ${shareConfig.description} Play ${shareConfig.appName} now!`;
};

// Environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    isReplit: isReplit(),
    isProduction: isProduction(),
    hostname: window.location.hostname,
    currentUrl: window.location.origin,
    playStoreConfigured: !!shareConfig.playStoreUrl
  };
};