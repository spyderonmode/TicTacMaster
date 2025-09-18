import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Hardcoded database URL from Replit .env
const DATABASE_URL = "postgresql://neondb_owner:npg_tNTYy7S9AMuP@ep-wandering-wave-aef2douv-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle({ client: pool, schema });
