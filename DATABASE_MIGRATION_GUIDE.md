# Database Migration Guide: Moving to Your Own Neon Database

## Overview
This guide helps you migrate from the current Replit-managed Neon database to your own Neon account for full database ownership and portability.

## Benefits of Your Own Neon Database
- **Full Control**: Complete ownership of your database
- **Portability**: Database travels with you to any hosting provider
- **Backup Control**: Direct access to export/import your data
- **No Vendor Lock-in**: Standard PostgreSQL works everywhere
- **Migration Ready**: Easy to move between hosting providers

## Step 1: Create Your Neon Account

1. Visit [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Choose your preferred region (recommend US West 2 for best performance)

## Step 2: Get Your Connection String

After creating your Neon project, you'll find a connection string like:
```
postgresql://username:password@ep-your-endpoint.region.aws.neon.tech/dbname?sslmode=require
```

## Step 3: Database Schema Setup

Your new database will need these tables (automatically created by our migration):

### Core Tables
- `sessions` - User session storage
- `users` - User profiles and authentication
- `rooms` - Game rooms and settings
- `games` - Individual game instances
- `moves` - Game move history
- `room_participants` - Room membership tracking
- `blocked_users` - User blocking system

## Step 4: Migration Process

### Option A: Fresh Start (Recommended)
- Clean database setup
- Users re-register with existing credentials
- No data migration needed
- Fastest and cleanest approach

### Option B: Full Data Migration
- Export current user data
- Import to new database
- Preserve user profiles and statistics
- More complex but maintains history

## Step 5: Environment Configuration

Once you provide your connection string, I'll update:
1. Database connection in `server/db.ts`
2. Environment variables
3. Run database migrations
4. Test all functionality

## Current Database Usage
Your app currently uses:
- **Total Size**: ~848 KB
- **Users**: 632 KB (main table)
- **Other Tables**: 216 KB combined
- **Well within limits**: Neon free tier supports 0.5 GB

## Migration Checklist
- [ ] Create Neon account
- [ ] Get connection string
- [ ] Choose migration approach (fresh vs full)
- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Test user authentication
- [ ] Test game functionality
- [ ] Verify WebSocket connections
- [ ] Test all features end-to-end

## Post-Migration Benefits
✅ **Database Ownership**: Complete control over your data
✅ **Portability**: Deploy anywhere with same database
✅ **Backup Control**: Export/import data as needed
✅ **No Dependencies**: Independent from Replit's database
✅ **Scalability**: Upgrade Neon plan as needed

## Need Help?
Provide your Neon connection string and preferred migration approach (fresh start or full data migration), and I'll handle the technical setup for you.