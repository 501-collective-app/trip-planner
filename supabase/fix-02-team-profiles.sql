-- Adds trip_leader / team_member tagging and a sensitive-info table (legal name,
-- emergency contact, passport photo) that's only readable by trip leaders —
-- enforced by RLS, not just hidden in the UI. Run after schema.sql + fix-01.
-- Safe to re-run: every statement is idempotent.

alter table trip_members add column if not exists member_type text not null default 'team_member'
  check (member_type in ('trip_leader', 'team_member'));

create or replace function is_trip_leader(_trip_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from trip_members tm
    where tm.trip_id = _trip_id
      and tm.member_type = 'trip_leader'
      and (tm.user_id = auth.uid() or lower(tm.email) = lower(coalesce(auth.jwt()->>'email', '')))
  );
$$;

-- Close a privilege-escalation gap: without this, any member could grant
-- themselves trip_leader (and therefore passport-photo access) directly via
-- the API, bypassing whatever the UI shows.
create or replace function prevent_member_type_self_promotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.member_type is distinct from old.member_type then
    if not is_trip_leader(old.trip_id) then
      raise exception 'Only trip leaders can change a member''s type';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trip_members_prevent_self_promotion on trip_members;
create trigger trip_members_prevent_self_promotion
  before update on trip_members
  for each row execute function prevent_member_type_self_promotion();

-- Roster edits (role, status, member_type, removal) are trip-leader actions;
-- inviting new people and confirming your own membership stay open to any member.
drop policy if exists "trip_members: members can update" on trip_members;
create policy "trip_members: leaders can update, self can confirm" on trip_members
  for update using (is_trip_leader(trip_id) or lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

drop policy if exists "trip_members: members can delete" on trip_members;
create policy "trip_members: leaders can delete" on trip_members for delete using (is_trip_leader(trip_id));

-- ---------- Sensitive profile info: own table, own (stricter) RLS ----------

create table if not exists trip_member_sensitive (
  trip_member_id uuid primary key references trip_members(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  legal_name text,
  emergency_contact text,
  passport_photo_path text,
  updated_at timestamptz not null default now()
);

alter table trip_member_sensitive enable row level security;

drop policy if exists "sensitive: leaders can read" on trip_member_sensitive;
create policy "sensitive: leaders can read" on trip_member_sensitive for select using (is_trip_leader(trip_id));
drop policy if exists "sensitive: leaders can write" on trip_member_sensitive;
create policy "sensitive: leaders can write" on trip_member_sensitive for insert with check (is_trip_leader(trip_id));
drop policy if exists "sensitive: leaders can update" on trip_member_sensitive;
create policy "sensitive: leaders can update" on trip_member_sensitive for update using (is_trip_leader(trip_id));
drop policy if exists "sensitive: leaders can delete" on trip_member_sensitive;
create policy "sensitive: leaders can delete" on trip_member_sensitive for delete using (is_trip_leader(trip_id));

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'trip_member_sensitive') then
    alter publication supabase_realtime add table trip_member_sensitive;
  end if;
end $$;

-- ---------- Passport photo storage (private bucket) ----------

insert into storage.buckets (id, name, public)
values ('passport-photos', 'passport-photos', false)
on conflict (id) do nothing;

drop policy if exists "passport photos: leaders can read" on storage.objects;
create policy "passport photos: leaders can read" on storage.objects for select
  using (bucket_id = 'passport-photos' and is_trip_leader((storage.foldername(name))[1]::uuid));

drop policy if exists "passport photos: leaders can upload" on storage.objects;
create policy "passport photos: leaders can upload" on storage.objects for insert
  with check (bucket_id = 'passport-photos' and is_trip_leader((storage.foldername(name))[1]::uuid));

drop policy if exists "passport photos: leaders can update" on storage.objects;
create policy "passport photos: leaders can update" on storage.objects for update
  using (bucket_id = 'passport-photos' and is_trip_leader((storage.foldername(name))[1]::uuid));

drop policy if exists "passport photos: leaders can delete" on storage.objects;
create policy "passport photos: leaders can delete" on storage.objects for delete
  using (bucket_id = 'passport-photos' and is_trip_leader((storage.foldername(name))[1]::uuid));

-- Make each trip's creator a trip_leader. This bypasses the anti-escalation
-- trigger deliberately: it's a one-time administrative bootstrap, not a user
-- action, and there's no logged-in user for is_trip_leader() to check against
-- here anyway.
alter table trip_members disable trigger trip_members_prevent_self_promotion;

update trip_members set member_type = 'trip_leader'
where id in (select tm.id from trip_members tm join trips t on t.id = tm.trip_id where t.created_by = tm.user_id);

alter table trip_members enable trigger trip_members_prevent_self_promotion;
