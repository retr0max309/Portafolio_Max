import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

export async function applyMigrations(pool: Pool): Promise<void> {
  await pool.query('create schema if not exists app_private');
  await pool.query(`create table if not exists app_private.schema_migrations (
    filename text primary key, applied_at timestamptz not null default now()
  )`);
  const migrationsPath = resolve('supabase/migrations');
  for (const filename of readdirSync(migrationsPath).filter(name => name.endsWith('.sql')).sort()) {
    const applied = await pool.query('select 1 from app_private.schema_migrations where filename = $1', [filename]);
    if (applied.rowCount) continue;
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(readFileSync(resolve(migrationsPath, filename), 'utf8'));
      await client.query('insert into app_private.schema_migrations (filename) values ($1)', [filename]);
      await client.query('commit');
      console.log(`Applied ${filename}`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }
}
