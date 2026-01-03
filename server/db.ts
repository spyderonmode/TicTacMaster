import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use environment variable with fallback for local development
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://gameuser:MyNew1999@127.0.0.1:5432/gamedb";

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: false
});

export const db = drizzle({ client: pool, schema });
