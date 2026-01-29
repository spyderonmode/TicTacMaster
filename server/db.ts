import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use environment variable with fallback for local development
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_In0jbVFXm3vh@ep-summer-rain-ahl17ouc-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: false
});

export const db = drizzle({ client: pool, schema });
