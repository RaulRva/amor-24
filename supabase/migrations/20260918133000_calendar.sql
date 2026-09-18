-- Calendar events and intimacy hearts.

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  note text,
  happens_on date not null,
  created_at timestamptz not null default now()
);

create index calendar_events_couple_date_idx on public.calendar_events (couple_id, happens_on);

create table public.calendar_hearts (
  couple_id uuid not null references public.couples (id) on delete cascade,
  happens_on date not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (couple_id, happens_on)
);

alter table public.calendar_events enable row level security;
alter table public.calendar_hearts enable row level security;

grant select, insert, update, delete on table public.calendar_events to authenticated;
grant select, insert, update, delete on table public.calendar_hearts to authenticated;

create policy "calendar_events select" on public.calendar_events
  for select to authenticated
  using (couple_id = private.my_couple_id());

create policy "calendar_events insert" on public.calendar_events
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and couple_id = private.my_couple_id()
  );

create policy "calendar_events update" on public.calendar_events
  for update to authenticated
  using (couple_id = private.my_couple_id())
  with check (couple_id = private.my_couple_id());

create policy "calendar_events delete" on public.calendar_events
  for delete to authenticated
  using (couple_id = private.my_couple_id());

create policy "calendar_hearts select" on public.calendar_hearts
  for select to authenticated
  using (couple_id = private.my_couple_id());

create policy "calendar_hearts insert" on public.calendar_hearts
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and couple_id = private.my_couple_id()
  );

create policy "calendar_hearts delete" on public.calendar_hearts
  for delete to authenticated
  using (couple_id = private.my_couple_id());
