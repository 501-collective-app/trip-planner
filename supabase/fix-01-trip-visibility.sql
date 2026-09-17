-- Fixes a bug: a trip's creator couldn't see their own just-created trip until
-- their membership row existed, which caused an infinite retry loop on first
-- sign-in. Also cleans up the empty duplicate trips that loop created.

drop policy if exists "trips: members can read" on trips;
create policy "trips: members can read" on trips
  for select using (is_trip_member(id) or created_by = auth.uid());

-- Remove orphaned trips (no members) left over from the bug above.
delete from trips where id not in (select trip_id from trip_members);
