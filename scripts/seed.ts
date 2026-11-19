import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const envPath = resolve('.env');
if (existsSync(envPath)) process.loadEnvFile(envPath);
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
if (new URL(connectionString).hostname.endsWith('.supabase.com')) {
  throw new Error('The hosted Supabase project is already seeded; do not run db:seed against it.');
}

const pool = new Pool({ connectionString, max: 1 });
try {
  await pool.query(readFileSync(resolve('supabase/seed.sql'), 'utf8'));
  console.log('Seeded projects');
} finally {
  await pool.end();
}
