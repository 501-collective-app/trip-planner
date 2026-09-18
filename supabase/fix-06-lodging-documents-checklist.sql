-- Adds lodging details to destinations, travel-document fields (passport
-- number/expiry, visa status) to the leader-only sensitive member table, and
-- a new shared prep checklist.

alter table destinations add column if not exists lodging_name text;
alter table destinations add column if not exists lodging_address text;
alter table destinations add column if not exists lodging_confirmation text;
alter table destinations add column if not exists lodging_checkin text;
alter table destinations add column if not exists lodging_checkout text;

alter table trip_member_sensitive add column if not exists passport_number text;
alter table trip_member_sensitive add column if not exists passport_expiry date;
alter table trip_member_sensitive add column if not exists visa_status text;

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists checklist_items_trip_id_idx on checklist_items(trip_id);

alter table checklist_items enable row level security;

drop policy if exists "checklist: members can read" on checklist_items;
create policy "checklist: members can read" on checklist_items for select using (is_trip_member(trip_id));
drop policy if exists "checklist: members can write" on checklist_items;
create policy "checklist: members can write" on checklist_items for insert with check (is_trip_member(trip_id));
drop policy if exists "checklist: members can update" on checklist_items;
create policy "checklist: members can update" on checklist_items for update using (is_trip_member(trip_id));
drop policy if exists "checklist: members can delete" on checklist_items;
create policy "checklist: members can delete" on checklist_items for delete using (is_trip_member(trip_id));

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'checklist_items') then
    alter publication supabase_realtime add table checklist_items;
  end if;
end $$;
