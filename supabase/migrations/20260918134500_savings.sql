-- Shared savings goal and monthly contributions.

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null unique references public.couples (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  monthly_amount numeric(12,2) not null check (monthly_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  goal_id uuid not null references public.savings_goals (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12,2) not null check (amount <> 0),
  for_month date not null,
  note text,
  created_at timestamptz not null default now()
);

create index savings_entries_goal_month_idx on public.savings_entries (goal_id, for_month desc);

alter table public.savings_goals enable row level security;
alter table public.savings_entries enable row level security;

grant select, insert, update, delete on table public.savings_goals to authenticated;
grant select, insert, update, delete on table public.savings_entries to authenticated;
