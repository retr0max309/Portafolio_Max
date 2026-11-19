-- Public visitors may read published projects and submit contact messages.
-- Message contents remain readable only from the Supabase dashboard/database owner.
do $$
begin
  -- Plain PostgreSQL in Docker has no anon role. This migration also runs there.
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on public.projects to anon;
    grant insert (name, email, message) on public.contact_messages to anon;

    create policy projects_public_read
      on public.projects for select to anon
      using (published = true);

    create policy contact_messages_public_insert
      on public.contact_messages for insert to anon
      with check (
        char_length(trim(name)) between 2 and 120
        and char_length(email) between 5 and 320
        and email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
        and char_length(trim(message)) between 10 and 3000
      );
  end if;
end $$;
