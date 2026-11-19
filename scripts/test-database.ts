import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { applyMigrations } from './database-migrations';

const envPath = resolve('.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);

export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is required for database tests');
  const parsedUrl = new URL(url);
  if (parsedUrl.hostname.endsWith('.supabase.com')) {
    throw new Error('Database tests must not target a hosted Supabase project');
  }
  if (!parsedUrl.pathname.toLowerCase().includes('test')) {
    throw new Error('TEST_DATABASE_URL must point to a database with "test" in its name');
  }
  return url;
}

export async function prepareTestDatabase(seed = false): Promise<Pool> {
  const pool = new Pool({ connectionString: getTestDatabaseUrl(), max: 2 });
  try {
    await applyMigrations(pool);
    if (seed) {
      await pool.query('truncate table public.contact_messages, public.projects restart identity');
      await pool.query(readFileSync(resolve('supabase/seed.sql'), 'utf8'));
    }
  } catch (error) {
    await pool.end();
    throw error;
  }
  return pool;
}
