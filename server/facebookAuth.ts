import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Express } from 'express';
import { storage } from './storage';

export function setupFacebookAuth(app: Express) {
  // Only setup Facebook auth if environment variables are provided
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    console.log('⚠️ Facebook auth not configured - missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET');
    return;
  }

  // Configure Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || "/api/auth/facebook/callback",
    profileFields: ['id', 'name', 'picture.type(large)']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract user information from Facebook profile
      const facebookId = profile.id;
      const firstName = profile.name?.givenName || '';
      const lastName = profile.name?.familyName || '';
      const displayName = profile.displayName || `${firstName} ${lastName}`.trim();
      const profileImageUrl = profile.photos?.[0]?.value;

      // Check if user already exists by Facebook ID
      let user = await storage.getUserByFacebookId(facebookId);
      
      if (!user) {
        // Create new user without email access
        const newUserId = `facebook_${facebookId}`;
        await storage.upsertUser({
          id: newUserId,
          email: null, // No email access requested
          firstName: firstName,
          lastName: lastName,
          displayName: displayName,
          username: `facebook_${facebookId}`,
          profileImageUrl: profileImageUrl || null,
          facebookId: facebookId,
          isGuest: false
        });
        
        user = await storage.getUser(newUserId);
      }

      return done(null, {
        userId: user!.id,
        username: user!.username || user!.displayName || 'Facebook User',
        displayName: user!.displayName,
        email: null, // No email access requested
        profileImageUrl: user!.profileImageUrl,
        isEmailVerified: false // No email to verify
      });
    } catch (error) {
      console.error('Facebook auth error:', error);
      return done(error);
    }
  }));

  // Facebook auth routes
  app.get('/api/auth/facebook', 
    passport.authenticate('facebook')
  );

  app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/auth?error=facebook_auth_failed' }),
    (req, res) => {
      // Successful authentication
      const user = req.user as any;
      
      // Create session
      req.session.user = {
        userId: user.userId,
        username: user.username
      };
      
      // Redirect to home page
      res.redirect('/?login=success&provider=facebook');
    }
  );
}