# TicTac 3x5 - Authentication & Deployment Guide

## Overview
Your TicTac 3x5 app uses a **dual authentication system** with both JSON file storage and PostgreSQL database. Here's everything you need to know about how authentication works and what you need to deploy elsewhere.

## Authentication System

### 1. **Dual Storage System**
Your app uses TWO storage systems for user data:

**JSON File Storage (`users.json`):**
- Location: `users.json` in root directory
- Stores: usernames, passwords, email verification tokens, profile data
- Used for: login/registration, password resets, email verification

**PostgreSQL Database:**
- Location: Connected via `DATABASE_URL` environment variable
- Stores: user profiles, game data, room data, statistics, blocked users
- Used for: game functionality, real-time features, social features

### 2. **User Authentication Flow**
1. User registers/logs in through JSON file system
2. User data is automatically synced to PostgreSQL database
3. Session is stored in PostgreSQL sessions table
4. All game features use PostgreSQL data

### 3. **Email System**
- **Service**: SMTP (Nodemailer)
- **Configuration**: Environment variables for SMTP settings
- **Features**: Email verification, password reset emails
- **URLs**: Hardcoded to `tic-tac-master-zanv1.replit.app`

## Required Environment Variables

To deploy your app elsewhere, you need these environment variables:

### **Database**
```
DATABASE_URL=postgresql://username:password@host:port/database
```

### **Email Service (SMTP)**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### **Session Security**
```
SESSION_SECRET=your-random-secret-key-here
```

## Files You Need to Deploy

### **Core Application Files**
- All `client/` folder (React frontend)
- All `server/` folder (Express backend)
- All `shared/` folder (shared types/schema)
- `package.json` and `package-lock.json`
- `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- `drizzle.config.ts` (database configuration)

### **Database Files**
- `users.json` (if you want to keep existing users)
- Database schema will be created automatically via Drizzle

### **Configuration Files**
- `.env` file with your environment variables
- `replit.md` (project documentation)

## Database Schema

Your PostgreSQL database contains these tables:

### **Users Table**
```sql
users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### **Sessions Table**
```sql
sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
)
```

### **Game Tables**
- `rooms` - Game rooms
- `games` - Individual games
- `room_participants` - Players in rooms
- `moves` - Game moves
- `blocked_users` - User blocking system

## Deployment Steps

### 1. **Set Up PostgreSQL Database**
- Create a PostgreSQL database
- Get the connection string
- Set `DATABASE_URL` environment variable

### 2. **Configure Email Service**
- Set up SMTP service (Gmail, SendGrid, etc.)
- Add SMTP environment variables
- Update email URLs in `server/emailService.ts`

### 3. **Update Domain References**
- Change `tic-tac-master-zanv1.replit.app` to your domain in:
  - `server/emailService.ts` (line 48)
  - Any other hardcoded URLs

### 4. **Install Dependencies**
```bash
npm install
```

### 5. **Set Up Database Schema**
```bash
npm run db:push
```

### 6. **Build and Deploy**
```bash
npm run build
npm start
```

## Real-time Features

### **WebSocket System**
- WebSocket server runs on same port as Express server
- Path: `/ws`
- Handles: Real-time game updates, chat, online users
- Authentication: Uses session cookies

### **Real-time Database**
- All game data is stored in PostgreSQL
- Real-time updates via WebSocket broadcasting
- No external real-time database needed

## Security Considerations

### **Password Security**
- Passwords are hashed using SHA-256
- Session-based authentication
- CSRF protection via same-origin policy

### **Email Verification**
- Optional email verification system
- Tokens expire after 24 hours
- Password reset tokens expire after 1 hour

## Migration Notes

### **From Current Setup**
1. Export `users.json` file
2. Set up new database
3. Update environment variables
4. Update domain references
5. Deploy and test

### **User Data Migration**
- Existing users in `users.json` will be automatically synced to database
- No manual migration needed
- Keep `users.json` for authentication

## Troubleshooting

### **Common Issues**
1. **Database Connection**: Check `DATABASE_URL` format
2. **Email Not Sending**: Verify SMTP credentials
3. **Session Issues**: Ensure `SESSION_SECRET` is set
4. **WebSocket Issues**: Check firewall/proxy settings

### **Development vs Production**
- Development: Uses memory sessions
- Production: Uses PostgreSQL sessions
- Both use same authentication system

## Summary

Your app is ready to deploy anywhere with:
- PostgreSQL database
- SMTP email service
- Node.js hosting
- Environment variables properly configured

The dual storage system ensures compatibility while providing robust game features through the database.