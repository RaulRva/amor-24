create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  update public.profiles
  set couple_id = null
  where id = auth.uid();
end;
$$;

revoke all on function public.leave_couple() from public, anon;
grant execute on function public.leave_couple() to authenticated;
