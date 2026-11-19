import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { applyMigrations } from './database-migrations';

const envPath = resolve('.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
if (new URL(connectionString).hostname.endsWith('.supabase.com')) {
  throw new Error('Hosted Supabase migrations are managed by Supabase; do not run db:migrate against the hosted project.');
}

const pool = new Pool({ connectionString, max: 1 });

try {
  await applyMigrations(pool);
} finally {
  await pool.end();
}
