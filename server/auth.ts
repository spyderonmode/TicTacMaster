import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Express } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import MemoryStore from 'memorystore';
import { storage } from './storage';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { createEmailService } from './emailService';import { Pool } from 'pg';

interface User {
  id: string;
  username: string;
  password: string;
  email?: string;
  displayName?: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  isGuest?: boolean;
  guestExpiresAt?: string; // For JSON storage compatibility
  createdAt: string;
}

interface Session {
  userId: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: Session;
    }
    interface SessionData {
      user?: Session;
    }
  }
}

const usersFilePath = path.join(process.cwd(), 'users.json');

// Initialize users file if it doesn't exist
if (!fs.existsSync(usersFilePath)) {
  fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2));
}

// Simple hash function for passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getUsers(): User[] {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveUsers(users: User[]): void {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function findUserByUsername(username: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.username === username);
}

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createUser(username: string, password: string, email?: string): Promise<User> {
  const users = getUsers();
  const verificationToken = email ? generateVerificationCode() : undefined;
  const verificationExpiry = email ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined; // 24 hours
  
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    password: hashPassword(password),
    email: email ? email.toLowerCase() : email,
    displayName: username,
    profilePicture: undefined,
    isEmailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpiry: verificationExpiry,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  
  // Also create user in database
  try {
    await storage.upsertUser({
      id: newUser.id,
      email: email || null,
      firstName: newUser.displayName || newUser.username,
      displayName: newUser.displayName || newUser.username,
      lastName: null,
      profileImageUrl: newUser.profilePicture,
      isGuest: false,
    });
    console.log('User created in database:', newUser.id);
  } catch (error) {
    console.error('Error creating user in database:', error);
    // Don't return error here as the user is already created in JSON
  }
  
  return newUser;
}

async function createGuestUser(): Promise<User> {
  const guestId = crypto.randomUUID();
  const guestName = `Guest_${Math.floor(Math.random() * 10000)}`;
  
  const guestUser: User = {
    id: guestId,
    username: guestName,
    password: '', // No password for guests
    email: undefined,
    displayName: guestName,
    profilePicture: undefined,
    isEmailVerified: true, // Guests don't need email verification
    emailVerificationToken: undefined,
    emailVerificationExpiry: undefined,
    isGuest: true, // Flag to identify as guest user
    createdAt: new Date().toISOString()
  };
  
  // Store guest user in JSON (for consistency)
  const users = getUsers();
  users.push(guestUser);
  saveUsers(users);
  
  // Create guest user in database
  try {
    await storage.upsertUser({
      id: guestUser.id,
      email: null,
      firstName: guestName,
      displayName: guestName,
      lastName: null,
      profileImageUrl: null,
      isGuest: true,
      guestSessionExpiry: null, // No expiry - guest stays until logout
    });
    // Guest user created in database
  } catch (error) {
    console.error('Error creating guest user in database:', error);
    throw new Error('Failed to create guest user');
  }
  
  return guestUser;
}

function updateUser(userId: string, updates: Partial<User>): User | null {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return null;
  }
  
  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);
  
  // Also update user in database
  try {
    storage.upsertUser({
      id: userId,
      email: users[userIndex].email || null,
      firstName: users[userIndex].displayName || users[userIndex].username,
      displayName: users[userIndex].displayName || null,
      username: users[userIndex].username || null,
      profileImageUrl: users[userIndex].profilePicture || null,
    });
  } catch (error) {
    console.error('Error updating user in database:', error);
  }
  
  return users[userIndex];
}

function getUserById(userId: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.id === userId);
}

function findUserByEmail(email: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
}

async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const emailService = createEmailService();
  if (!emailService) {
    console.log('Email service not configured - verification email not sent');
    return false;
  }
  
  try {
    const result = await emailService.sendVerificationEmail(email, token);
    if (!result) {
      console.error('Failed to send verification email - sendEmail returned false');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const emailService = createEmailService();
  if (!emailService) {
    console.log('Email service not configured - password reset email not sent');
    return false;
  }
  
  try {
    console.log(`📧 Attempting to send password reset email to: ${email}`);
    const result = await emailService.sendPasswordResetEmail(email, token);
    if (!result) {
      console.error('❌ Failed to send password reset email - email service returned false');
      return false;
    }
    console.log(`✅ Password reset email sent successfully to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Exception while sending password reset email:', error);
    return false;
  }
}

// Clean up guest user when they log out
export async function cleanupGuestOnLogout(userId: string) {
  try {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user && user.isGuest) {
      // Remove guest from JSON storage
      const updatedUsers = users.filter(u => u.id !== userId);
      saveUsers(updatedUsers);
      
      // Remove guest from database
      await storage.deleteUser(userId);
      console.log(`🧹 Cleaned up guest user on logout: ${user.username} (${userId})`);
    }
  } catch (error: any) {
    console.error('❌ Error cleaning up guest user:', error.message || error);
  }
}

// Sync all existing JSON users to the database
async function syncAllUsersToDatabase() {
  try {
    const users = getUsers();
    console.log(`🔄 Syncing ${users.length} users from JSON to Neon database...`);
    
    for (const user of users) {
      try {
        await storage.upsertUser({
          id: user.id,
          email: user.email || null,
          firstName: user.displayName || user.username || 'Anonymous',
          lastName: null,
          displayName: user.displayName || user.username || 'Anonymous',
          username: user.username || null,
          profileImageUrl: user.profilePicture || null,
          isGuest: user.isGuest || false,
          guestSessionExpiry: null, // No expiry - guest stays until logout
        });
        console.log(`✅ Synced user: ${user.username} (${user.id})`);
      } catch (error: any) {
        // Log error but continue with other users
        console.error(`❌ Failed to sync user ${user.username}:`, error.message || error);
      }
    }
    
    console.log('🎉 User sync completed!');
  } catch (error: any) {
    console.error('Failed to sync users to database:', error.message || error);
  }
}

// Invalidate all active sessions for a specific user
async function invalidateAllUserSessions(userId: string): Promise<void> {
  try {
    // Delete all sessions from the session table where the user ID matches
    await db.execute(sql`
      DELETE FROM session 
      WHERE sess::jsonb->'user'->>'userId' = ${userId}
    `);
    console.log(`🔒 Invalidated all sessions for user: ${userId}`);
  } catch (error: any) {
    console.error('❌ Error invalidating user sessions:', error.message || error);
    throw error;
  }
}

export function setupAuth(app: Express) {
  const PostgreSQLStore = connectPgSimple(session);

  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_tNTYy7S9AMuP@ep-wandering-wave-aef2douv-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
  const isHTTPS = process.env.FORCE_HTTPS === 'true' || isProduction;

  console.log('🍪 Auth Session Configuration:', {
    isProduction,
    isHTTPS,
    nodeEnv: process.env.NODE_ENV,
  });

  let sessionStore: session.Store;

  try {
    sessionStore = new PostgreSQLStore({
      conString: DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: false,
      ttl: 100 * 365 * 24 * 60 * 60, // 100 years in seconds
    });

    console.log('✅ PostgreSQL session store initialized');
  } catch (err: any) {
    console.error('❌ Failed to initialize PostgreSQL session store. Falling back to MemoryStore:', err.message);

    const MemoryStoreSession = MemoryStore(session);
    sessionStore = new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired every 24h
    });
  }

  app.set('trust proxy', 1);

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'W13KtlyRasvYl3bzL4ZQsxBp40/f2D1rogkzczhNLNU=',
      resave: false,
      saveUninitialized: false,
      proxy: true,
      name: 'connect.sid',
      cookie: {
        secure: isHTTPS,
        httpOnly: true,
        sameSite: isProduction ? 'lax' : 'lax', // 'lax' works better for production
        maxAge: 100 * 365 * 24 * 60 * 60 * 1000, // 100 years in ms
        domain: undefined,
      },
    })
  );
  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    // Enhanced validation
    if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (findUserByUsername(username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    if (findUserByEmail(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    try {
      const user = await createUser(username, password, email);
      
      // DO NOT create session until email is verified
      // const sessionData = { userId: user.id, username: user.username };
      // req.session.user = sessionData;
      
      // Sync user to database
      try {
        await storage.upsertUser({
          id: user.id,
          email: user.email || null,
          firstName: user.displayName || user.username,
          displayName: user.displayName || null,
          username: user.username || null,
          profileImageUrl: user.profilePicture || null,
        });
      } catch (error) {
        console.error('Error syncing new user to database:', error);
      }
      
      // Send verification email (mandatory)
      if (email && user.emailVerificationToken) {
        const emailSent = await sendVerificationEmail(email, user.emailVerificationToken);
        if (!emailSent) {
          console.error('Failed to send verification email - email service returned false');
          return res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
        }
      }
      
      res.json({ 
        id: user.id, 
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        message: 'Registration successful! Please check your email to verify your account before logging in.'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Guest login endpoint
  app.post('/api/auth/guest', async (req, res) => {
    try {
      // Check if user already has a session (prevent duplicate guest creation)
      if ((req.session as any)?.user) {
        console.log('User already has session:', (req.session as any).user.userId);
        return res.status(400).json({ error: 'User already has an active session' });
      }

      const guestUser = await createGuestUser();
      const sessionData = { userId: guestUser.id, username: guestUser.username, displayName: guestUser.displayName };
      (req.session as any).user = sessionData;
      
      console.log('✅ Guest user created via explicit /api/auth/guest request:', guestUser.username);
      
      res.json({ 
        id: guestUser.id, 
        username: guestUser.username, 
        email: null, 
        isEmailVerified: true,
        isGuest: true 
      });
    } catch (error: any) {
      console.error('Error creating guest user:', error);
      res.status(500).json({ error: 'Failed to create guest user' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    // Enhanced validation
    if (typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username/email is required' });
    }

    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Try to find user by username first, then by email
    let user = findUserByUsername(username);
    if (!user) {
      user = findUserByEmail(username);
    }

    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    // Check if email is verified (mandatory) - Skip for admin testing and existing test users
    const skipVerification = ['admin', 'sam00', 'sam01', 'testuser', 'ethan'].includes(user.username);
    if (!user.isEmailVerified && !skipVerification) {
      return res.status(403).json({ 
        error: 'Email verification required',
        message: 'Please verify your email before logging in. Check your email for the verification link.',
        needsVerification: true 
      });
    }

    // Ensure user exists in database
    try {
      await storage.upsertUser({
        id: user.id,
        email: user.email || null,
        firstName: user.displayName || user.username || 'Anonymous',
        lastName: null,
        displayName: user.displayName || user.username || 'Anonymous',
        username: user.username || null,
        profileImageUrl: user.profilePicture || null,
      });
      console.log('User synced to database:', user.id);
    } catch (error) {
      console.error('Error syncing user to database:', error);
      return res.status(500).json({ error: 'Failed to sync user data' });
    }

    const sessionData = { userId: user.id, username: user.username, displayName: user.displayName };
    (req.session as any).user = sessionData;
    
    console.log('✅ Regular user logged in:', user.username, '(ID:', user.id, ')');
    
    res.json({ id: user.id, username: user.username, email: user.email, isEmailVerified: user.isEmailVerified });
  });

  // Logout endpoint
  app.post('/api/auth/logout', async (req, res) => {
    const userId = (req.session as any)?.user?.userId;
    
    req.session.destroy(async (err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      
      // Clean up guest user if logging out
      if (userId) {
        try {
          await cleanupGuestOnLogout(userId);
        } catch (error) {
          console.error('Error cleaning up guest user on logout:', error);
          // Don't fail logout if cleanup fails
        }
      }
      
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', async (req, res) => {
    if (!(req.session as any)?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get full user info including profile data
    const user = getUserById((req.session as any).user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    try {
      // Get selectedAchievementBorder from database
      const dbUser = await storage.getUser(user.id);
      
      res.json({
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        selectedAchievementBorder: dbUser?.selectedAchievementBorder || null
      });
    } catch (error) {
      console.error('Error fetching user from database:', error);
      // Return basic user info if database fails
      res.json({
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        selectedAchievementBorder: null
      });
    }
  });

  // Email verification endpoint
  app.post('/api/auth/verify-email', async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const users = getUsers();
    const user = users.find(u => u.emailVerificationToken === token);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Check if token is expired
    if (user.emailVerificationExpiry && new Date() > new Date(user.emailVerificationExpiry)) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Mark user as verified
    const updatedUser = updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpiry: undefined
    });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to verify email' });
    }

    // Sync updated user to database
    try {
      await storage.upsertUser({
        id: updatedUser.id,
        email: updatedUser.email || null,
        firstName: updatedUser.displayName || updatedUser.username || 'Anonymous',
        lastName: null,
        displayName: updatedUser.displayName || updatedUser.username || 'Anonymous',
        username: updatedUser.username || null,
        profileImageUrl: updatedUser.profilePicture || null,
      });
      console.log('User synced to database:', updatedUser.id);
    } catch (error) {
      console.error('Error syncing verified user to database:', error);
    }

    res.json({ message: 'Email verified successfully! You can now log in.' });
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification code
    const newToken = generateVerificationCode();
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const updatedUser = updateUser(user.id, {
      emailVerificationToken: newToken,
      emailVerificationExpiry: newExpiry
    });

    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to generate new verification token' });
    }

    // Sync updated user to database
    try {
      await storage.upsertUser({
        id: updatedUser.id,
        email: updatedUser.email || null,
        firstName: updatedUser.displayName || updatedUser.username || 'Anonymous',
        lastName: null,
        displayName: updatedUser.displayName || updatedUser.username || 'Anonymous',
        username: updatedUser.username || null,
        profileImageUrl: updatedUser.profilePicture || null,
      });
      console.log('User resend verification synced to database:', updatedUser.id);
    } catch (error) {
      console.error('Error syncing resend verification user to database:', error);
    }

    // Send verification email
    const emailSent = await sendVerificationEmail(email, newToken);
    if (!emailSent) {
      console.error('Failed to send verification email - email service returned false');
      return res.status(500).json({ error: 'Failed to send verification email. Please try again later.' });
    }
    
    res.json({ message: 'Verification email sent successfully' });
  });

  // Update user profile endpoint
  app.put('/api/auth/profile', async (req, res) => {
    if (!(req.session as any).user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { displayName, profilePicture } = req.body;
    const userId = (req.session as any).user.userId;
    
    try {
      const updates: Partial<User> = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (profilePicture !== undefined) updates.profilePicture = profilePicture;
      
      // Update user in JSON file
      const updatedUser = updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Also update user in database to keep session valid
      try {
        await storage.upsertUser({
          id: updatedUser.id,
          email: updatedUser.email || null,
          firstName: updatedUser.displayName || updatedUser.username || 'Anonymous',
          lastName: null,
          displayName: updatedUser.displayName || updatedUser.username || 'Anonymous',
          username: updatedUser.username || null,
          profileImageUrl: updatedUser.profilePicture || null,
        });
        // User profile synced to database
      } catch (error) {
        console.error('Error syncing updated user to database:', error);
        // Continue even if database sync fails to avoid breaking the session
      }
      
      // Keep session alive - update session data if needed
      (req.session as any).user = {
        ...(req.session as any).user,
        displayName: updatedUser.displayName,
        profilePicture: updatedUser.profilePicture
      };
      
      res.json({
        userId: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        profilePicture: updatedUser.profilePicture,
        email: updatedUser.email,
        isEmailVerified: updatedUser.isEmailVerified
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Send email verification
  app.post('/api/auth/send-verification', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    try {
      const verificationToken = crypto.randomUUID();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry
      });
      
      await sendVerificationEmail(email, verificationToken);
      
      res.json({ message: 'Verification email sent' });
    } catch (error) {
      console.error('Error sending verification email:', error);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  });

  // Test email endpoint (for debugging)
  app.post('/api/auth/test-email', async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailService = createEmailService();
    if (!emailService) {
      return res.status(500).json({ error: 'Email service is currently unavailable. Please contact support or try again later.' });
    }

    try {
      console.log(`📧 Sending test email to: ${email}`);
      const result = await emailService.sendTestEmail(email);
      
      if (result) {
        console.log(`✅ Test email sent successfully to: ${email}`);
        return res.json({ message: 'Test email sent successfully!' });
      } else {
        console.error(`❌ Failed to send test email to: ${email}`);
        return res.status(500).json({ error: 'Failed to send test email. Please check server logs.' });
      }
    } catch (error: any) {
      console.error('❌ Error sending test email:', error);
      return res.status(500).json({ error: 'Internal server error while sending email.' });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    try {
      const resetCode = generateVerificationCode();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const updatedUser = updateUser(user.id, {
        passwordResetToken: resetCode,
        passwordResetExpiry: resetExpiry
      });

      // Sync updated user to database
      if (updatedUser) {
        try {
          await storage.upsertUser({
            id: updatedUser.id,
            email: updatedUser.email || null,
            firstName: updatedUser.displayName || updatedUser.username || 'Anonymous',
            lastName: null,
            displayName: updatedUser.displayName || updatedUser.username || 'Anonymous',
            username: updatedUser.username || null,
            profileImageUrl: updatedUser.profilePicture || null,
          });
          console.log('User forgot password synced to database:', updatedUser.id);
        } catch (error) {
          console.error('Error syncing forgot password user to database:', error);
        }
      }

      const emailSent = await sendPasswordResetEmail(email, resetCode);
      if (!emailSent) {
        console.error('Failed to send password reset email - email service returned false');
        return res.status(500).json({ 
          error: 'Email service is currently unavailable. Please contact support or try again later.',
          details: 'The email service configuration is incomplete. Please ensure SMTP settings are properly configured.'
        });
      }

      res.json({ message: 'If an account with this email exists, a password reset code has been sent.' });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  });

  // Manual sync endpoint (admin only)
  app.post('/api/auth/sync-users', async (req, res) => {
    if (!(req.session as any).user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = (req.session as any).user.userId;
    const user = getUserById(userId);
    
    // Only allow admin to manually sync
    if (!user || user.username !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    try {
      await syncAllUsersToDatabase();
      res.json({ message: 'All users synced successfully' });
    } catch (error) {
      console.error('Manual sync error:', error);
      res.status(500).json({ error: 'Failed to sync users' });
    }
  });

  // Reset password endpoint
  app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const users = getUsers();
    const user = users.find(u => u.passwordResetToken === token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    if (user.passwordResetExpiry && new Date() > new Date(user.passwordResetExpiry)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    try {
      // Update password and clear reset token
      const updatedUser = updateUser(user.id, {
        password: hashPassword(newPassword),
        passwordResetToken: undefined,
        passwordResetExpiry: undefined
      });

      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update password' });
      }

      // Sync updated user to database
      try {
        await storage.upsertUser({
          id: updatedUser.id,
          email: updatedUser.email || null,
          firstName: updatedUser.displayName || updatedUser.username || 'Anonymous',
          lastName: null,
          displayName: updatedUser.displayName || updatedUser.username || 'Anonymous',
          username: updatedUser.username || null,
          profileImageUrl: updatedUser.profilePicture || null,
        });
        console.log('User password reset synced to database:', updatedUser.id);
      } catch (error) {
        console.error('Error syncing password reset user to database:', error);
      }

      // Invalidate all active sessions for this user
      try {
        await invalidateAllUserSessions(user.id);
        console.log('✅ All active sessions invalidated for user:', user.id);
      } catch (error) {
        console.error('Error invalidating user sessions:', error);
        // Don't fail the password reset if session invalidation fails
      }

      res.json({ message: 'Password has been reset successfully. All active sessions have been logged out. You can now log in with your new password.' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  // Middleware to check authentication
  app.use((req, res, next) => {
    if ((req.session as any).user) {
      req.user = (req.session as any).user;
    }
    next();
  });
}

export function requireAuth(req: any, res: any, next: any) {
  // Production debugging for session issues
  const hasSession = !!req.session;
  const hasUser = !!req.session?.user;
  const sessionId = req.sessionID;
  const cookies = req.headers.cookie;
  
  if (!hasSession || !hasUser) {
    console.log('🚫 Authentication failed:', {
      path: req.path,
      hasSession,
      hasUser,
      sessionId,
      hasCookies: !!cookies,
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Check if user's email is verified - Skip for admin testing and existing test users
  const user = getUserById(req.session.user.userId);
  const skipVerification = ['admin', 'sam00', 'sam01', 'testuser', 'ethan'].includes(user?.username || '');
  if (user && user.email && !user.isEmailVerified && !skipVerification) {
    return res.status(403).json({ error: 'Email verification required' });
  }
  
  req.user = req.session.user;
  next();
}