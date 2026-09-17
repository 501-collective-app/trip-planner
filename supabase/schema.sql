-- 501 Collective Trip Planner — Supabase schema
-- Paste this whole file into the Supabase SQL Editor (your project → SQL Editor → New query) and run it once.

create extension if not exists pgcrypto;

-- ---------- Tables ----------

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'New Trip',
  organization text not null default '',
  start_date date not null,
  end_date date not null,
  total_budget numeric not null default 0,
  archived boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid references auth.users(id),
  email text not null,
  name text not null default '',
  role text not null default 'Team member',
  color text not null default '#81e0ae',
  status text not null default 'invited' check (status in ('confirmed', 'invited')),
  created_at timestamptz not null default now()
);
create index if not exists trip_members_trip_id_idx on trip_members(trip_id);
create unique index if not exists trip_members_trip_email_idx on trip_members(trip_id, lower(email));

create table if not exists destinations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  city text not null,
  country text not null default '',
  lat double precision not null,
  lon double precision not null,
  arrive date not null,
  depart date not null,
  notes text
);
create index if not exists destinations_trip_id_idx on destinations(trip_id);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  date date not null,
  time text,
  title text not null,
  destination_id uuid references destinations(id) on delete set null,
  category text not null default 'Other',
  cost numeric,
  attendee_ids uuid[] not null default '{}',
  notes text,
  from_option_id uuid
);
create index if not exists events_trip_id_idx on events(trip_id);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  date date not null,
  amount numeric not null,
  currency text not null default 'USD',
  original_amount numeric not null,
  fx_rate_to_usd numeric not null default 1,
  category text not null default 'Other',
  description text not null default '',
  destination_id uuid references destinations(id) on delete set null,
  paid_by text,
  receipt_path text,
  receipt_url text
);
create index if not exists expenses_trip_id_idx on expenses(trip_id);

create table if not exists activity_options (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  destination_id uuid not null references destinations(id) on delete cascade,
  name text not null,
  description text,
  cost numeric not null default 0,
  category text not null default 'Activities',
  added_to_schedule boolean not null default false
);
create index if not exists activity_options_trip_id_idx on activity_options(trip_id);

-- ---------- Access helper ----------
-- security definer so it can read trip_members without recursing into trip_members' own RLS policy.

create or replace function is_trip_member(_trip_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from trip_members tm
    where tm.trip_id = _trip_id
      and (tm.user_id = auth.uid() or lower(tm.email) = lower(coalesce(auth.jwt()->>'email', '')))
  );
$$;

-- ---------- RLS ----------

alter table trips enable row level security;
alter table trip_members enable row level security;
alter table destinations enable row level security;
alter table events enable row level security;
alter table expenses enable row level security;
alter table activity_options enable row level security;

create policy "trips: members can read" on trips for select using (is_trip_member(id));
create policy "trips: creator can insert" on trips for insert with check (created_by = auth.uid());
create policy "trips: members can update" on trips for update using (is_trip_member(id));
create policy "trips: members can delete" on trips for delete using (is_trip_member(id));

create policy "trip_members: members can read" on trip_members for select using (is_trip_member(trip_id));
create policy "trip_members: self or member can insert" on trip_members for insert
  with check (lower(email) = lower(coalesce(auth.jwt()->>'email', '')) or is_trip_member(trip_id));
create policy "trip_members: members can update" on trip_members for update using (is_trip_member(trip_id));
create policy "trip_members: members can delete" on trip_members for delete using (is_trip_member(trip_id));

create policy "destinations: members can read" on destinations for select using (is_trip_member(trip_id));
create policy "destinations: members can write" on destinations for insert with check (is_trip_member(trip_id));
create policy "destinations: members can update" on destinations for update using (is_trip_member(trip_id));
create policy "destinations: members can delete" on destinations for delete using (is_trip_member(trip_id));

create policy "events: members can read" on events for select using (is_trip_member(trip_id));
create policy "events: members can write" on events for insert with check (is_trip_member(trip_id));
create policy "events: members can update" on events for update using (is_trip_member(trip_id));
create policy "events: members can delete" on events for delete using (is_trip_member(trip_id));

create policy "expenses: members can read" on expenses for select using (is_trip_member(trip_id));
create policy "expenses: members can write" on expenses for insert with check (is_trip_member(trip_id));
create policy "expenses: members can update" on expenses for update using (is_trip_member(trip_id));
create policy "expenses: members can delete" on expenses for delete using (is_trip_member(trip_id));

create policy "activity_options: members can read" on activity_options for select using (is_trip_member(trip_id));
create policy "activity_options: members can write" on activity_options for insert with check (is_trip_member(trip_id));
create policy "activity_options: members can update" on activity_options for update using (is_trip_member(trip_id));
create policy "activity_options: members can delete" on activity_options for delete using (is_trip_member(trip_id));

-- ---------- Realtime ----------

alter publication supabase_realtime add table trips, trip_members, destinations, events, expenses, activity_options;
