create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  role text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists contacts_trip_id_idx on contacts(trip_id);

alter table contacts enable row level security;

drop policy if exists "contacts: members can read" on contacts;
create policy "contacts: members can read" on contacts for select using (is_trip_member(trip_id));
drop policy if exists "contacts: members can write" on contacts;
create policy "contacts: members can write" on contacts for insert with check (is_trip_member(trip_id));
drop policy if exists "contacts: members can update" on contacts;
create policy "contacts: members can update" on contacts for update using (is_trip_member(trip_id));
drop policy if exists "contacts: members can delete" on contacts;
create policy "contacts: members can delete" on contacts for delete using (is_trip_member(trip_id));

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'contacts') then
    alter publication supabase_realtime add table contacts;
  end if;
end $$;
