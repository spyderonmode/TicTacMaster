# Dynamic Sharing System Setup Guide

## Overview
Your app now has a flexible sharing system that automatically switches between Replit URLs and Play Store URLs based on the environment and configuration.

## How It Works

### Current Behavior (Replit)
- **Web App Sharing**: Uses current Replit URL
- **Social Media**: Shares Replit URL with game description
- **Copy Link**: Copies Replit URL to clipboard

### Future Behavior (Play Store Published)
- **Web App Sharing**: Uses your production website URL
- **Play Store Sharing**: Uses Google Play Store URL
- **Social Media**: Automatically chooses best URL (Play Store preferred)
- **Copy Link**: Options for both web app and Play Store links

## Setup Steps

### Step 1: Environment Variables
Create a `.env` file in your project root with these variables:

```env
# Production URL (when you deploy to your own domain)
VITE_PRODUCTION_URL=https://yourdomain.com

# Play Store URL (add this when you publish to Google Play Store)
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.yourcompany.tictac3x5
```

### Step 2: When You Publish to Play Store

1. **Publish your app** to Google Play Store
2. **Get your Play Store URL** (format: `https://play.google.com/store/apps/details?id=YOUR_PACKAGE_ID`)
3. **Add the URL** to your environment variables:
   ```env
   VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.yourcompany.tictac3x5
   ```
4. **Redeploy** your web app

### Step 3: Testing the System

The system automatically detects:
- **Replit Environment**: Uses Replit URLs
- **Production Environment**: Uses production URLs
- **Play Store Available**: Shows Play Store option in share menu

## Share Button Locations

Your sharing functionality is used in:
1. **Landing Page**: Header share button
2. **Game Over Modal**: Victory sharing
3. **Any future locations**: Just use `<ShareButton />` component

## Customization Options

### For specific sharing behavior:
```tsx
// Prefer Play Store link when available
<ShareButton preferPlayStore={true} />

// Custom text and title
<ShareButton 
  title="Custom Game Title"
  text="Custom share message"
/>

// Force specific URL
<ShareButton url="https://custom-url.com" />
```

### Share Menu Features:
- **Facebook Sharing**: Opens Facebook share dialog
- **Twitter Sharing**: Opens Twitter share dialog  
- **WhatsApp Sharing**: Opens WhatsApp share dialog
- **Copy Web App Link**: Copies current web app URL
- **Copy Play Store Link**: Copies Play Store URL (when configured)

## Technical Details

### Files Modified:
- `client/src/lib/shareConfig.ts` - Configuration and environment detection
- `client/src/components/ShareButton.tsx` - Enhanced sharing component
- `.env.example` - Environment variable template

### Environment Detection:
- Automatically detects Replit vs production
- Prioritizes Play Store URLs in production
- Falls back to web URLs when Play Store not configured

### Future-Proof Design:
- No code changes needed when publishing to Play Store
- Just add environment variable and redeploy
- Automatic switching between development and production URLs

## Benefits

✅ **No Manual Updates**: Automatically switches URLs based on environment
✅ **Play Store Ready**: Pre-configured for Play Store publishing
✅ **Flexible**: Multiple sharing options in one component
✅ **User-Friendly**: Clear labels for web vs Play Store links
✅ **Development-Friendly**: Works seamlessly in Replit during development