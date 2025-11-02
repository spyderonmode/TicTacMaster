import { sql } from "drizzle-orm";
import { db } from "./db";

export async function runMigrations(): Promise<void> {
  console.log('🔄 Running database migrations...');
  
  try {
    // Add current_win_streak column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS current_win_streak INTEGER DEFAULT 0;
    `);
    
    // Add best_win_streak column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS best_win_streak INTEGER DEFAULT 0;
    `);
    
    // Add guest user columns if they don't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;
    `);
    
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS guest_session_expiry TIMESTAMP;
    `);
    
    // Create level_ups table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS level_ups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        previous_level INTEGER NOT NULL,
        new_level INTEGER NOT NULL,
        acknowledged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create emoji_items table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS emoji_items (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT NOT NULL,
        price BIGINT NOT NULL,
        animation_type VARCHAR NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create user_emojis table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_emojis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        emoji_id VARCHAR NOT NULL REFERENCES emoji_items(id),
        purchased_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create unique index on user_emojis if it doesn't exist to prevent duplicate purchases
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_user_emoji ON user_emojis(user_id, emoji_id);
    `);
    
    // Create game_emoji_sends table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_emoji_sends (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id VARCHAR NOT NULL REFERENCES games(id),
        sender_id VARCHAR NOT NULL REFERENCES users(id),
        recipient_id VARCHAR NOT NULL REFERENCES users(id),
        emoji_id VARCHAR NOT NULL REFERENCES emoji_items(id),
        sent_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running database migrations:', error);
    // Don't throw error to prevent app from crashing
  }
}