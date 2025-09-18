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
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running database migrations:', error);
    // Don't throw error to prevent app from crashing
  }
}