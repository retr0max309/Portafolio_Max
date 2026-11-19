create table public.projects (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  kind text not null,
  year_label text not null,
  summary text not null,
  contribution text not null,
  technologies text[] not null default '{}',
  site_url text,
  repository_url text,
  note text,
  published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint projects_title_length check (char_length(title) between 1 and 160)
);

create index projects_published_order_idx
  on public.projects (display_order, id) where published = true;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint contact_name_length check (char_length(name) between 2 and 120),
  constraint contact_email_length check (char_length(email) between 5 and 320),
  constraint contact_message_length check (char_length(message) between 10 and 3000)
);

-- The browser only talks to NestJS. Supabase's public Data API has no access
-- to these tables; the backend uses a server-only PostgreSQL connection.
alter table public.projects enable row level security;
alter table public.contact_messages enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.projects, public.contact_messages from anon';
    execute 'revoke all on sequence public.projects_id_seq from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on public.projects, public.contact_messages from authenticated';
    execute 'revoke all on sequence public.projects_id_seq from authenticated';
  end if;
end $$;
