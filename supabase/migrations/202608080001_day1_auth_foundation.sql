begin;

create type public.user_role as enum (
  'member',
  'trusted_contributor',
  'organization_admin',
  'employer',
  'moderator',
  'country_admin',
  'super_admin'
);

create type public.verification_status as enum (
  'unverified',
  'verified'
);

create table public.countries (
  code text primary key,
  name text not null,
  is_active boolean not null default false,
  source_url text not null,
  verification_status public.verification_status not null default 'unverified',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint countries_code_iso_format check (code ~ '^[A-Z]{2}$'),
  constraint countries_verified_metadata check (
    verification_status <> 'verified' or verified_at is not null
  )
);

comment on table public.countries is
  'Official country reference data. Every row includes provenance and verification status.';

insert into public.countries (
  code,
  name,
  is_active,
  source_url,
  verification_status,
  verified_at
)
values (
  'MY',
  'Malaysia',
  true,
  'https://www.iso.org/obp/ui/#iso:code:3166:MY',
  'verified',
  now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  current_country_code text not null default 'MY'
    references public.countries(code),
  role public.user_role not null default 'member',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    char_length(trim(display_name)) between 2 and 100
  )
);

comment on table public.profiles is
  'Private user profile and authorization data. Access is restricted with RLS.';

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.can_read_profile(target_country_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles viewer
    where viewer.id = (select auth.uid())
      and viewer.onboarding_completed
      and (
        viewer.role in ('moderator', 'super_admin')
        or (
          viewer.role = 'country_admin'
          and viewer.current_country_code = target_country_code
        )
      )
  );
$$;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles viewer
    where viewer.id = (select auth.uid())
      and viewer.onboarding_completed
      and viewer.role in ('moderator', 'country_admin', 'super_admin')
  );
$$;

revoke all on function private.can_read_profile(text) from public;
revoke all on function private.is_platform_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.can_read_profile(text) to authenticated;
grant execute on function private.is_platform_admin() to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger countries_set_updated_at
before update on public.countries
for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := trim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  if char_length(requested_name) < 2 then
    requested_name := split_part(coalesce(new.email, 'Member'), '@', 1);
  end if;

  if char_length(requested_name) < 2 then
    requested_name := 'Member';
  end if;

  insert into public.profiles (id, display_name, current_country_code)
  values (new.id, left(requested_name, 100), 'MY');

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.countries enable row level security;
alter table public.profiles enable row level security;

create policy "Active countries are publicly readable"
on public.countries
for select
to anon, authenticated
using (is_active = true);

create policy "Users and authorized admins can read profiles"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.can_read_profile(current_country_code))
);

create policy "Users can create only their own profile"
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
  and role = 'member'
);

create policy "Users can update only their own profile"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke all on public.countries from anon, authenticated;
grant select on public.countries to anon, authenticated;

revoke all on public.profiles from anon, authenticated;
grant select, insert on public.profiles to authenticated;
grant update (display_name, current_country_code, onboarding_completed)
  on public.profiles to authenticated;

commit;
