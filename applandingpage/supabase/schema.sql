create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('producteur', 'acheteur', 'transporteur', 'indecis')),
  city text not null,
  locale text not null default 'fr' check (locale in ('fr', 'en', 'es')),
  position integer,
  referral_code text,
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups add column if not exists position integer;
alter table public.waitlist_signups add column if not exists referral_code text;

with ranked as (
  select id, row_number() over (order by created_at, id)::integer as position
  from public.waitlist_signups
  where position is null
)
update public.waitlist_signups as signups
set position = ranked.position
from ranked
where signups.id = ranked.id;

update public.waitlist_signups
set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

create unique index if not exists waitlist_signups_email_key on public.waitlist_signups (lower(email));
create unique index if not exists waitlist_signups_position_key on public.waitlist_signups (position);
create unique index if not exists waitlist_signups_referral_code_key on public.waitlist_signups (referral_code);

create or replace function public.join_waitlist(
  p_name text,
  p_email text,
  p_role text,
  p_city text,
  p_locale text,
  p_limit integer
)
returns table(position integer, referral_code text, created boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  next_position integer;
  existing_position integer;
  existing_referral_code text;
begin
  perform pg_advisory_xact_lock(hashtext('onabaya_waitlist'));

  select signups.position, signups.referral_code
  into existing_position, existing_referral_code
  from public.waitlist_signups as signups
  where lower(signups.email) = lower(p_email);

  if existing_position is not null then
    return query select existing_position, existing_referral_code, false;
    return;
  end if;

  select coalesce(max(signups.position), 0) + 1
  into next_position
  from public.waitlist_signups as signups;

  if next_position > p_limit then
    raise exception using errcode = 'P0001', message = 'WAITLIST_FULL';
  end if;

  return query
  insert into public.waitlist_signups (name, email, role, city, locale, position, referral_code)
  values (
    p_name,
    lower(p_email),
    p_role,
    p_city,
    p_locale,
    next_position,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  returning waitlist_signups.position, waitlist_signups.referral_code, true;
end;
$$;

revoke all on function public.join_waitlist(text, text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.join_waitlist(text, text, text, text, text, integer) to service_role;

alter table public.waitlist_signups enable row level security;

revoke all on public.waitlist_signups from anon, authenticated;
