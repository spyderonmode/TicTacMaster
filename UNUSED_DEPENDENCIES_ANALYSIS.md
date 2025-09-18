# Unused Dependencies Analysis

Based on code analysis, here are dependencies that appear to be unused and can be safely removed:

## ❌ **Definitely Unused - Safe to Remove:**

### Core Libraries:
1. **`@sendgrid/mail`** - SendGrid removed, using nodemailer instead
2. **`openid-client`** - Only used in replitAuth.ts (likely unused feature)
3. **`memoizee`** + **`@types/memoizee`** - Only imported in replitAuth.ts
4. **`passport`** + **`passport-local`** + **`@types/passport`** + **`@types/passport-local`** - Only used in replitAuth.ts

### UI Components (Shadcn/Radix that aren't imported anywhere):
5. **`embla-carousel-react`** - Only in ui/carousel.tsx, not used in app
6. **`recharts`** - Only in ui/chart.tsx, not used in app  
7. **`react-day-picker`** - Only in ui/calendar.tsx, not used in app
8. **`vaul`** - Only in ui/drawer.tsx, not used in app
9. **`react-resizable-panels`** - Only in ui/resizable.tsx, not used in app

### Potentially Unused Radix Components:
10. **`@radix-ui/react-accordion`** - Check if Accordion is used
11. **`@radix-ui/react-alert-dialog`** - Check if AlertDialog is used  
12. **`@radix-ui/react-aspect-ratio`** - Check if AspectRatio is used
13. **`@radix-ui/react-collapsible`** - Check if Collapsible is used
14. **`@radix-ui/react-context-menu`** - Check if ContextMenu is used
15. **`@radix-ui/react-hover-card`** - Check if HoverCard is used
16. **`@radix-ui/react-menubar`** - Check if Menubar is used
17. **`@radix-ui/react-navigation-menu`** - Check if NavigationMenu is used
18. **`@radix-ui/react-popover`** - Check if Popover is used
19. **`@radix-ui/react-progress`** - Check if Progress is used
20. **`@radix-ui/react-radio-group`** - Check if RadioGroup is used
21. **`@radix-ui/react-scroll-area`** - Check if ScrollArea is used
22. **`@radix-ui/react-slider`** - Check if Slider is used
23. **`@radix-ui/react-switch`** - Check if Switch is used
24. **`@radix-ui/react-toggle`** - Check if Toggle is used
25. **`@radix-ui/react-toggle-group`** - Check if ToggleGroup is used
26. **`@radix-ui/react-tooltip`** - Check if Tooltip is used

### Other Libraries:
27. **`input-otp`** - Check if OTP input is used
28. **`cmdk`** - Check if Command component is used
29. **`tw-animate-css`** - Check if this animation library is used

## ⚠️ **Investigate Further:**

1. **`connect-pg-simple`** - Used for PostgreSQL session store (might be needed)
2. **`memorystore`** - Alternative session store (might be used)
3. **`date-fns`** - Date manipulation (check usage)
4. **`@jridgewell/trace-mapping`** - Development tool (might be needed for sourcemaps)

## ✅ **Definitely Keep - Actively Used:**

- `@radix-ui/react-dialog` - Used for modals
- `@radix-ui/react-dropdown-menu` - Used in ShareButton
- `@radix-ui/react-avatar` - Used for profile pictures
- `@radix-ui/react-button` (via shadcn)
- `@radix-ui/react-label` - Used in forms
- `@radix-ui/react-select` - Used for dropdowns
- `@radix-ui/react-tabs` - Used in UI
- `@radix-ui/react-toast` - Used for notifications
- `framer-motion` - Used for animations
- `firebase` - Used for authentication
- `lucide-react` - Used for icons
- `react-hook-form` - Used for forms
- `wouter` - Used for routing
- `ws` - Used for WebSockets
- All database related: `drizzle-orm`, `pg`, etc.
- All build tools: `vite`, `typescript`, etc.

## 💾 **Estimated Size Savings:**

Removing all unused dependencies could save approximately:
- **50-100MB** from node_modules
- **5-15MB** from final bundle size
- **Faster build times**
- **Reduced maintenance overhead**

## 📋 **Recommended Action Plan:**

1. Remove definitely unused dependencies first (items 1-9)
2. Audit Radix UI components to see which are actually imported in your app
3. Test thoroughly after each removal
4. Keep backups of package.json before making changes