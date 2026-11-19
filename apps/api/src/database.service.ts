import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { ProjectRow } from './projects/project';

type ContactRecord = { name: string; email: string; message: string };

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool?: Pool;
  private readonly supabaseUrl?: string;
  private readonly publishableKey?: string;

  constructor() {
    const provider = process.env.DATABASE_PROVIDER || 'postgres';
    if (provider === 'supabase') {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required');
      this.supabaseUrl = new URL(url).origin;
      this.publishableKey = key;
    } else if (provider === 'postgres') {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) throw new Error('DATABASE_URL is required');
      this.pool = new Pool({ connectionString, max: 5 });
    } else {
      throw new Error(`Unsupported DATABASE_PROVIDER: ${provider}`);
    }
  }

  async listPublishedProjects(): Promise<ProjectRow[]> {
    if (this.pool) {
      const result = await this.pool.query<ProjectRow>(
        `select id, slug, title, kind, year_label, summary, contribution,
                technologies, site_url, repository_url, note
           from public.projects
          where published = true
          order by display_order asc, id asc`,
      );
      return result.rows;
    }
    const params = new URLSearchParams({
      select: 'id,slug,title,kind,year_label,summary,contribution,technologies,site_url,repository_url,note',
      published: 'eq.true',
      order: 'display_order.asc,id.asc',
    });
    const response = await this.supabaseRequest(`projects?${params}`);
    const rows = (await response.json()) as Array<ProjectRow & { id: number | string }>;
    return rows.map((row) => ({ ...row, id: String(row.id) }));
  }

  async saveContact(record: ContactRecord): Promise<void> {
    if (this.pool) {
      await this.pool.query(
        `insert into public.contact_messages (name, email, message)
         values ($1, $2, $3)`,
        [record.name, record.email, record.message],
      );
      return;
    }
    await this.supabaseRequest('contact_messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(record),
    });
  }

  async check(): Promise<void> {
    if (this.pool) {
      await this.pool.query('select 1');
      return;
    }
    await this.supabaseRequest('projects?select=id&limit=1');
  }

  private async supabaseRequest(path: string, init: RequestInit = {}): Promise<Response> {
    const response = await fetch(`${this.supabaseUrl}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: this.publishableKey!, ...init.headers },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Supabase request failed: ${response.status} ${await response.text()}`);
    return response;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}
