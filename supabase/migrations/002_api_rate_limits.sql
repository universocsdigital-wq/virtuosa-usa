create table if not exists public.api_rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  current_reset timestamptz;
begin
  insert into public.api_rate_limits as limits (key, count, reset_at, updated_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds), now())
  on conflict (key) do update
  set
    count = case when limits.reset_at <= now() then 1 else limits.count + 1 end,
    reset_at = case
      when limits.reset_at <= now() then now() + make_interval(secs => p_window_seconds)
      else limits.reset_at
    end,
    updated_at = now()
  returning count, reset_at into current_count, current_reset;

  allowed := current_count <= p_limit;
  retry_after := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from (current_reset - now())))::integer)
  end;
  return next;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;

create index if not exists api_rate_limits_reset_at_idx on public.api_rate_limits (reset_at);
