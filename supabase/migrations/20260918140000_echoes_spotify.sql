alter table public.echoes
  add column if not exists image_url text,
  add column if not exists spotify_url text;
