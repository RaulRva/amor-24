-- Couple app schema, RLS, storage and seed data.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  couple_id uuid references public.couples (id) on delete set null,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create index profiles_couple_id_idx on public.profiles (couple_id);

create table public.echoes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('song', 'phrase')),
  title text not null,
  body text,
  why text,
  created_at timestamptz not null default now()
);

create index echoes_couple_id_idx on public.echoes (couple_id);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  note text,
  lat double precision not null,
  lng double precision not null,
  visited_on date,
  created_at timestamptz not null default now()
);

create index places_couple_id_idx on public.places (couple_id);

create table public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  sort_order int not null unique
);

create table public.question_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.daily_questions (id) on delete cascade,
  for_date date not null,
  answer text not null,
  created_at timestamptz not null default now(),
  unique (user_id, for_date)
);

create index question_answers_couple_date_idx on public.question_answers (couple_id, for_date);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  happened_on date not null,
  note text,
  photo_path text,
  created_at timestamptz not null default now()
);

create index memories_couple_id_idx on public.memories (couple_id, happened_on desc);

create table public.date_ideas (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null,
  detail text,
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);

create index date_ideas_couple_id_idx on public.date_ideas (couple_id);

create table public.moods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  for_date date not null,
  mood text not null check (mood in ('radiante', 'bien', 'regular', 'cansado', 'abrazo')),
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, for_date)
);

create index moods_couple_date_idx on public.moods (couple_id, for_date);

create table public.countdowns (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  target_at timestamptz not null,
  emoji text not null default '✨',
  created_at timestamptz not null default now()
);

create index countdowns_couple_id_idx on public.countdowns (couple_id, target_at);

create table public.dreams (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  note text,
  done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index dreams_couple_id_idx on public.dreams (couple_id);

create or replace function private.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.profiles where id = auth.uid()
$$;

grant usage on schema private to authenticated;
grant execute on function private.my_couple_id() to authenticated;

-- Auth profile
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1), 'tú')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.enforce_couple_size()
returns trigger
language plpgsql
as $$
begin
  if new.couple_id is not null then
    if (
      select count(*) from public.profiles
      where couple_id = new.couple_id and id <> new.id
    ) >= 2 then
      raise exception 'Esta pareja ya está completa';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_couple_size
  before insert or update of couple_id on public.profiles
  for each row execute function private.enforce_couple_size();

create or replace function private.seed_date_ideas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.date_ideas (couple_id, title, detail)
  values
    (new.id, 'Cena a ciegas en casa', 'Uno cocina, el otro no entra en la cocina hasta que esté listo.'),
    (new.id, 'Paseo sin destino', 'Salís y giráis donde apetezca. Nada de mapas.'),
    (new.id, 'Picnic improvisado', 'Manta, algo rico y un sitio con luz bonita.'),
    (new.id, 'Peli que nunca os atrevéis', 'La rara, la larga o la que siempre aplazáis.'),
    (new.id, 'Desayuno lento', 'Sin prisa. Móvil lejos. Café de verdad.'),
    (new.id, 'Atardecer', 'Buscad un sitio alto o junto al agua.'),
    (new.id, 'Receta nueva', 'Elegid un plato que nunca hayáis hecho juntos.'),
    (new.id, 'Museo o exposición', 'Aunque sea pequeño. Después, un café y hablar de lo que más os gustó.'),
    (new.id, 'Noche de juegos', 'Cartas, tablero o el que tengáis olvidado.'),
    (new.id, 'Carta escrita a mano', 'Cada uno escribe una. Se leen en voz alta.'),
    (new.id, 'Revivir la primera cita', 'El mismo sitio, o una versión de ahora.'),
    (new.id, 'Baile en el salón', 'Una canción vuestra, volumen alto, sin público.');
  return new;
end;
$$;

create trigger couples_seed_dates
  after insert on public.couples
  for each row execute function private.seed_date_ideas();

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.my_couple_id() to authenticated;

create or replace function public.create_couple()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  code text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if (select couple_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'Ya formas parte de una pareja';
  end if;

  code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.couples (invite_code) values (code) returning id into cid;
  update public.profiles set couple_id = cid where id = auth.uid();

  return json_build_object('couple_id', cid, 'invite_code', code);
end;
$$;

create or replace function public.join_couple(invite text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if (select couple_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'Ya formas parte de una pareja';
  end if;

  select id into cid from public.couples where invite_code = upper(trim(invite));
  if cid is null then
    raise exception 'Código no válido';
  end if;

  update public.profiles set couple_id = cid where id = auth.uid();
  return cid;
end;
$$;

revoke all on function public.create_couple() from public, anon;
revoke all on function public.join_couple(text) from public, anon;
grant execute on function public.create_couple() to authenticated;
grant execute on function public.join_couple(text) to authenticated;

alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.echoes enable row level security;
alter table public.places enable row level security;
alter table public.daily_questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.memories enable row level security;
alter table public.date_ideas enable row level security;
alter table public.moods enable row level security;
alter table public.countdowns enable row level security;
alter table public.dreams enable row level security;

create policy "insert own profile" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "own profile read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or couple_id = private.my_couple_id());

create policy "own profile update" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and couple_id is not distinct from private.my_couple_id());

create policy "own couple read" on public.couples
  for select to authenticated
  using (id = private.my_couple_id());

create policy "questions readable" on public.daily_questions
  for select to authenticated
  using (true);

create policy "echoes select" on public.echoes for select to authenticated
  using (couple_id = private.my_couple_id());
create policy "echoes insert" on public.echoes for insert to authenticated
  with check (
    created_by = auth.uid()
    and couple_id = private.my_couple_id()
  );
create policy "echoes update" on public.echoes for update to authenticated
  using (couple_id = private.my_couple_id())
  with check (couple_id = private.my_couple_id());
create policy "echoes delete" on public.echoes for delete to authenticated
  using (couple_id = private.my_couple_id());

create policy "places select" on public.places for select to authenticated
  using (couple_id = private.my_couple_id());
create policy "places insert" on public.places for insert to authenticated
  with check (
    created_by = auth.uid()
    and couple_id = private.my_couple_id()
  );
create policy "places update" on public.places for update to authenticated
  using (couple_id = private.my_couple_id())
  with check (couple_id = private.my_couple_id());
create policy "places delete" on public.places for delete to authenticated
  using (couple_id = private.my_couple_id());

create policy "answers select" on public.question_answers for select to authenticated
  using (couple_id = private.my_couple_id());
create policy "answers insert" on public.question_answers for insert to authenticated
  with check (
    user_id = auth.uid()
    and couple_id = private.my_couple_id()
  );
create policy "answers update" on public.question_answers for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "memories select" on public.memories for select to authenticated
  using (couple_id = private.my_couple_id());
create policy "memories insert" on public.memories for insert to authenticated
  with check (
    created_by = auth.uid()
    and couple_id = private.my_couple_id()
  );
create policy "memories update" on public.memories for update to authenticated
  using (couple_id = private.my_couple_id())
  with check (couple_id = private.my_couple_id());
create policy "memories delete" on public.memories for delete to authenticated
  using (couple_id = private.my_couple_id());

create policy "dates select" on public.date_ideas for select to authenticated
  using (couple_id = private.my_couple_id());
create policy "dates insert" on public.date_ideas for insert to authenticated
  with check (couple_id = private.my_couple_id());
create policy "dates update" on public.date_ideas for update to authenticated
  using (couple_id = private.my_couple_id())
  with check (couple_id = private.my_couple_id());
create policy "dates delete" on public.date_ideas for delete to authenticated
  using (couple_id = private.my_couple_id());

create policy "moods select" on public.moods for select to authenticated
  using (couple_id = private.my_couple_id());
create policy "moods insert" on public.moods for insert to authenticated
  with check (
    user_id = auth.uid()
    and couple_id = private.my_couple_id()
  );
create policy "moods update" on public.moods for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "countdowns select" on public.countdowns for select to authenticated
  using (couple_id = private.my_couple_id());
create policy "countdowns insert" on public.countdowns for insert to authenticated
  with check (
    created_by = auth.uid()
    and couple_id = private.my_couple_id()
  );
create policy "countdowns update" on public.countdowns for update to authenticated
  using (couple_id = private.my_couple_id())
  with check (couple_id = private.my_couple_id());
create policy "countdowns delete" on public.countdowns for delete to authenticated
  using (couple_id = private.my_couple_id());

create policy "dreams select" on public.dreams for select to authenticated
  using (couple_id = private.my_couple_id());
create policy "dreams insert" on public.dreams for insert to authenticated
  with check (
    created_by = auth.uid()
    and couple_id = private.my_couple_id()
  );
create policy "dreams update" on public.dreams for update to authenticated
  using (couple_id = private.my_couple_id())
  with check (couple_id = private.my_couple_id());
create policy "dreams delete" on public.dreams for delete to authenticated
  using (couple_id = private.my_couple_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'album',
  'album',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
on conflict (id) do nothing;

create policy "album select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'album'
    and (storage.foldername(name))[1] = private.my_couple_id()::text
  );

create policy "album insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'album'
    and (storage.foldername(name))[1] = private.my_couple_id()::text
  );

create policy "album update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'album'
    and (storage.foldername(name))[1] = private.my_couple_id()::text
  )
  with check (
    bucket_id = 'album'
    and (storage.foldername(name))[1] = private.my_couple_id()::text
  );

create policy "album delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'album'
    and (storage.foldername(name))[1] = private.my_couple_id()::text
  );

alter publication supabase_realtime add table public.moods;
alter publication supabase_realtime add table public.question_answers;
alter publication supabase_realtime add table public.countdowns;

insert into public.daily_questions (prompt, sort_order) values
  ('¿Qué es lo primero que te viene cuando piensas en mí?', 1),
  ('¿Qué momento de esta semana te gustaría repetir?', 2),
  ('Si pudiéramos desaparecer un fin de semana, ¿adónde iríamos?', 3),
  ('¿Qué canción te recuerda a nosotros ahora mismo?', 4),
  ('¿En qué te he hecho sentir querido/a últimamente?', 5),
  ('¿Qué detalle mío te gusta y casi nunca dices?', 6),
  ('¿De qué tienes ganas que hagamos juntos este mes?', 7),
  ('¿Cuál fue la última vez que te reíste mucho conmigo?', 8),
  ('Si hoy fuera una cita, ¿qué harías tú?', 9),
  ('¿Qué te gustaría que te preguntara más a menudo?', 10),
  ('¿Qué miedo te gustaría que sostuviéramos juntos?', 11),
  ('¿Qué lugar de los que conocemos es más “nuestro”?', 12),
  ('¿Qué te gustaría que recordáramos de este año?', 13),
  ('¿Cómo te apetece que te cuide hoy?', 14),
  ('¿Qué hábito bonito podríamos inventar los dos?', 15),
  ('¿Qué película o serie somos ahora mismo?', 16),
  ('¿Qué te gustaría enseñarme que aún no sepa de ti?', 17),
  ('Si te escribiera una nota ahora, ¿qué te gustaría leer?', 18),
  ('¿Qué plan casero te apetecería más que uno grande?', 19),
  ('¿En qué te he sorprendido últimamente?', 20),
  ('¿Qué parte de tu día te gustaría que conociera mejor?', 21),
  ('¿Qué es algo pequeño que me hace muy yo?', 22),
  ('¿A quién de los dos le toca elegir la próxima cita, y por qué?', 23),
  ('¿Qué recuerdo nuestro te da paz?', 24),
  ('Si tuviéramos un día sin reloj, ¿cómo lo llenaríamos?', 25),
  ('¿Qué te gustaría celebrar aunque no sea “importante”?', 26),
  ('¿Qué comida es nuestra, aunque no lo sea para nadie más?', 27),
  ('¿Qué te gustaría que no se nos olvidara cuando discutimos?', 28),
  ('¿Qué estación del año te parece más de los dos?', 29),
  ('¿Qué te gustaría que te dijera más, sin que lo pidas?', 30),
  ('¿Cuál es tu forma favorita de perder el tiempo conmigo?', 31),
  ('¿Qué sueño de los nuestros te da más mariposas?', 32),
  ('¿Qué foto nuestra te gustaría tener en la mesilla?', 33),
  ('¿Qué te hace sentir en casa cuando estás conmigo?', 34),
  ('Si tuviéramos que elegir una frase para nosotros, ¿cuál sería?', 35),
  ('¿Qué te gustaría aprender juntos?', 36),
  ('¿Cuál fue un “casi nada” que para ti fue mucho?', 37),
  ('¿Qué parte de mi día te da curiosidad?', 38),
  ('¿Qué te gustaría que guardáramos en un tarro del tiempo?', 39),
  ('Hoy, en una palabra, ¿cómo estás conmigo?', 40);
