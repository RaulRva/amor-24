alter table public.couples
  add column if not exists cover_path text,
  add column if not exists theme jsonb not null default '{}'::jsonb;

drop policy if exists "own couple update" on public.couples;
create policy "own couple update" on public.couples
  for update to authenticated
  using (id = private.my_couple_id())
  with check (id = private.my_couple_id());

do $$
begin
  alter publication supabase_realtime add table public.couples;
exception
  when duplicate_object then null;
end $$;
