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
    
    // Migrate emoji tables to sticker tables
    // First check if old emoji tables exist and rename them
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'emoji_items') THEN
          -- Drop old indexes and constraints first
          DROP INDEX IF EXISTS unique_user_emoji;
          
          -- Rename tables
          ALTER TABLE IF EXISTS game_emoji_sends RENAME TO game_sticker_sends;
          ALTER TABLE IF EXISTS user_emojis RENAME TO user_stickers;
          ALTER TABLE IF EXISTS emoji_items RENAME TO sticker_items;
          
          -- Rename columns in sticker_items (add asset_path if needed)
          ALTER TABLE sticker_items ADD COLUMN IF NOT EXISTS asset_path VARCHAR;
          
          -- Rename columns in user_stickers
          ALTER TABLE user_stickers RENAME COLUMN emoji_id TO sticker_id;
          
          -- Rename columns in game_sticker_sends
          ALTER TABLE game_sticker_sends RENAME COLUMN emoji_id TO sticker_id;
          
          -- Recreate unique index with new name
          CREATE UNIQUE INDEX IF NOT EXISTS unique_user_sticker ON user_stickers(user_id, sticker_id);
        END IF;
      END $$;
    `);
    
    // Create sticker_items table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sticker_items (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        description TEXT NOT NULL,
        price BIGINT NOT NULL DEFAULT 100000000,
        asset_path VARCHAR NOT NULL,
        animation_type VARCHAR NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create user_stickers table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_stickers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        sticker_id VARCHAR NOT NULL REFERENCES sticker_items(id),
        purchased_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create unique index on user_stickers if it doesn't exist to prevent duplicate purchases
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_user_sticker ON user_stickers(user_id, sticker_id);
    `);
    
    // Create game_sticker_sends table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS game_sticker_sends (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID NOT NULL REFERENCES games(id),
        sender_id VARCHAR NOT NULL REFERENCES users(id),
        recipient_id VARCHAR NOT NULL REFERENCES users(id),
        sticker_id VARCHAR NOT NULL REFERENCES sticker_items(id),
        sent_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running database migrations:', error);
    // Don't throw error to prevent app from crashing
  }
}