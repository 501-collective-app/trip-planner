-- Adds structured flight details (flight number, airports, times, seat map) on
-- top of existing calendar events tagged category = 'Flights'. One row per
-- flight event; seats are a small per-member map since a flight rarely has
-- more than a handful of your own travelers on it.

create table if not exists flight_details (
  event_id uuid primary key references events(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  airline text,
  flight_number text,
  departure_airport text, -- IATA code, e.g. JFK
  arrival_airport text,
  departure_time timestamptz,
  arrival_time timestamptz,
  seats jsonb not null default '{}', -- { "<trip_member_id>": "14C" }
  updated_at timestamptz not null default now()
);
create index if not exists flight_details_trip_id_idx on flight_details(trip_id);

alter table flight_details enable row level security;

create policy "flight_details: members can read" on flight_details for select using (is_trip_member(trip_id));
create policy "flight_details: members can write" on flight_details for insert with check (is_trip_member(trip_id));
create policy "flight_details: members can update" on flight_details for update using (is_trip_member(trip_id));
create policy "flight_details: members can delete" on flight_details for delete using (is_trip_member(trip_id));

alter publication supabase_realtime add table flight_details;
