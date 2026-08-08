begin;

create type public.organization_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.organization_member_role as enum ('member', 'admin');
create type public.organization_membership_status as enum ('pending', 'approved', 'rejected');
create type public.organization_claim_status as enum ('pending', 'approved', 'rejected');
create type public.organization_content_status as enum ('draft', 'published', 'archived');
create type public.event_registration_status as enum ('registered', 'cancelled');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 2 and 180),
  description text not null check (char_length(trim(description)) between 20 and 3000),
  city text not null check (char_length(trim(city)) between 2 and 120),
  state_region text not null check (char_length(trim(state_region)) between 2 and 120),
  public_email text check (public_email is null or public_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  website_url text check (website_url is null or website_url ~ '^https://'),
  status public.organization_status not null default 'pending',
  verification_status public.verification_status not null default 'unverified',
  source_url text check (source_url is null or source_url ~ '^https://'),
  last_verified_at timestamptz,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_verification_metadata check (verification_status <> 'verified' or (source_url is not null and last_verified_at is not null)),
  constraint organizations_review_audit check (status = 'pending' or (reviewed_by is not null and reviewed_at is not null))
);

create table public.organization_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  claimant_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 20 and 1500),
  evidence_url text check (evidence_url is null or evidence_url ~ '^https://'),
  status public.organization_claim_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, claimant_id)
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_member_role not null default 'member',
  status public.organization_membership_status not null default 'pending',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  constraint organization_memberships_approval_audit check (status <> 'approved' or (approved_by is not null and approved_at is not null))
);

create or replace function private.is_organization_admin(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.role = 'admin'
      and membership.status = 'approved'
  );
$$;
revoke all on function private.is_organization_admin(uuid) from public;
grant execute on function private.is_organization_admin(uuid) to authenticated;

create or replace function private.protect_organization_review_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not private.can_manage_country(old.country_code) and (
    new.country_code is distinct from old.country_code
    or new.status is distinct from old.status
    or new.verification_status is distinct from old.verification_status
    or new.source_url is distinct from old.source_url
    or new.last_verified_at is distinct from old.last_verified_at
    or new.submitted_by is distinct from old.submitted_by
    or new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at
  ) then
    raise exception 'Only platform moderators may change organization review fields';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_organization_review_fields() from public;

create or replace function private.protect_membership_approval_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  membership_country text;
begin
  select country_code into membership_country
  from public.organizations
  where id = old.organization_id;

  if not private.can_manage_country(membership_country) then
    if new.organization_id is distinct from old.organization_id
      or new.user_id is distinct from old.user_id
      or new.role is distinct from old.role then
      raise exception 'Organization admins cannot change membership identity or role';
    end if;

    if new.status = 'approved'
      and (new.approved_by is distinct from auth.uid() or new.approved_at is null) then
      raise exception 'Membership approval must be attributed to the signed-in organization admin';
    end if;
  end if;

  return new;
end;
$$;
revoke all on function private.protect_membership_approval_fields() from public;

create table public.organization_announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 180),
  body text not null check (char_length(trim(body)) between 10 and 5000),
  status public.organization_content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_announcements_publish_audit check (status <> 'published' or published_at is not null)
);

create table public.organization_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 180),
  description text not null check (char_length(trim(description)) between 10 and 5000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue_name text check (venue_name is null or char_length(trim(venue_name)) between 2 and 180),
  venue_address text check (venue_address is null or char_length(trim(venue_address)) between 5 and 500),
  online_url text check (online_url is null or online_url ~ '^https://'),
  capacity integer check (capacity is null or capacity > 0),
  status public.organization_content_status not null default 'draft',
  published_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_events_time_order check (ends_at is null or ends_at > starts_at),
  constraint organization_events_publish_audit check (status <> 'published' or published_at is not null),
  constraint organization_events_location check (venue_name is not null or online_url is not null)
);

create table public.organization_event_registrations (
  event_id uuid not null references public.organization_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.event_registration_status not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.organization_join_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint organization_join_links_expiry check (expires_at is null or expires_at > created_at)
);

create index organizations_directory_idx on public.organizations (country_code, status, state_region, city, name);
create index organization_claims_queue_idx on public.organization_claims (status, created_at);
create index organization_memberships_admin_idx on public.organization_memberships (organization_id, role, status);
create index organization_announcements_public_idx on public.organization_announcements (organization_id, status, published_at desc);
create index organization_events_public_idx on public.organization_events (organization_id, status, starts_at);
create index organization_registrations_user_idx on public.organization_event_registrations (user_id, status);

create trigger organizations_set_updated_at before update on public.organizations for each row execute function private.set_updated_at();
create trigger organizations_protect_review_fields before update on public.organizations for each row execute function private.protect_organization_review_fields();
create trigger organization_claims_set_updated_at before update on public.organization_claims for each row execute function private.set_updated_at();
create trigger organization_memberships_set_updated_at before update on public.organization_memberships for each row execute function private.set_updated_at();
create trigger organization_memberships_protect_approval before update on public.organization_memberships for each row execute function private.protect_membership_approval_fields();
create trigger organization_announcements_set_updated_at before update on public.organization_announcements for each row execute function private.set_updated_at();
create trigger organization_events_set_updated_at before update on public.organization_events for each row execute function private.set_updated_at();
create trigger organization_event_registrations_set_updated_at before update on public.organization_event_registrations for each row execute function private.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_claims enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_announcements enable row level security;
alter table public.organization_events enable row level security;
alter table public.organization_event_registrations enable row level security;
alter table public.organization_join_links enable row level security;

create policy "Public reads approved organizations" on public.organizations for select to anon, authenticated using (status = 'approved');
create policy "Submitters read own organizations" on public.organizations for select to authenticated using (submitted_by = (select auth.uid()));
create policy "Members submit pending organizations" on public.organizations for insert to authenticated with check (submitted_by = (select auth.uid()) and status = 'pending' and verification_status = 'unverified' and reviewed_by is null and reviewed_at is null);
create policy "Platform admins review organizations" on public.organizations for all to authenticated using ((select private.can_manage_country(country_code))) with check ((select private.can_manage_country(country_code)));
create policy "Organization admins update own organization" on public.organizations for update to authenticated using ((select private.is_organization_admin(id))) with check ((select private.is_organization_admin(id)) and status = 'approved');

create policy "Claimants read own claims" on public.organization_claims for select to authenticated using (claimant_id = (select auth.uid()));
create policy "Members submit pending claims" on public.organization_claims for insert to authenticated with check (claimant_id = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy "Platform admins manage claims" on public.organization_claims for all to authenticated using (exists (select 1 from public.organizations organization where organization.id = organization_id and private.can_manage_country(organization.country_code))) with check (exists (select 1 from public.organizations organization where organization.id = organization_id and private.can_manage_country(organization.country_code)));

create policy "Members read own memberships" on public.organization_memberships for select to authenticated using (user_id = (select auth.uid()));
create policy "Organization admins read own organization members" on public.organization_memberships for select to authenticated using ((select private.is_organization_admin(organization_id)));
create policy "Members request organization membership" on public.organization_memberships for insert to authenticated with check (user_id = (select auth.uid()) and role = 'member' and status = 'pending' and approved_by is null and approved_at is null);
create policy "Organization admins approve own organization members" on public.organization_memberships for update to authenticated using ((select private.is_organization_admin(organization_id))) with check ((select private.is_organization_admin(organization_id)) and role = 'member');
create policy "Platform admins manage organization memberships" on public.organization_memberships for all to authenticated using (exists (select 1 from public.organizations organization where organization.id = organization_id and private.can_manage_country(organization.country_code))) with check (exists (select 1 from public.organizations organization where organization.id = organization_id and private.can_manage_country(organization.country_code)));

create policy "Public reads published announcements" on public.organization_announcements for select to anon, authenticated using (status = 'published' and exists (select 1 from public.organizations organization where organization.id = organization_id and organization.status = 'approved'));
create policy "Organization admins manage own announcements" on public.organization_announcements for all to authenticated using ((select private.is_organization_admin(organization_id))) with check ((select private.is_organization_admin(organization_id)) and created_by = (select auth.uid()));

create policy "Public reads published events" on public.organization_events for select to anon, authenticated using (status = 'published' and exists (select 1 from public.organizations organization where organization.id = organization_id and organization.status = 'approved'));
create policy "Organization admins manage own events" on public.organization_events for all to authenticated using ((select private.is_organization_admin(organization_id))) with check ((select private.is_organization_admin(organization_id)) and created_by = (select auth.uid()));

create policy "Users read own event registrations" on public.organization_event_registrations for select to authenticated using (user_id = (select auth.uid()));
create policy "Users register themselves for published events" on public.organization_event_registrations for insert to authenticated with check (user_id = (select auth.uid()) and status = 'registered' and exists (select 1 from public.organization_events event where event.id = event_id and event.status = 'published'));
create policy "Users cancel own registrations" on public.organization_event_registrations for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and status = 'cancelled');
create policy "Organization admins read own event registrations" on public.organization_event_registrations for select to authenticated using (exists (select 1 from public.organization_events event where event.id = event_id and private.is_organization_admin(event.organization_id)));

create policy "Public reads active join links" on public.organization_join_links for select to anon, authenticated using (is_active and (expires_at is null or expires_at > now()) and exists (select 1 from public.organizations organization where organization.id = organization_id and organization.status = 'approved'));
create policy "Organization admins manage own join links" on public.organization_join_links for all to authenticated using ((select private.is_organization_admin(organization_id))) with check ((select private.is_organization_admin(organization_id)) and created_by = (select auth.uid()));

create or replace function public.approve_organization_claim(target_claim_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  selected_claim public.organization_claims%rowtype;
  selected_country text;
begin
  select * into selected_claim from public.organization_claims where id = target_claim_id and status = 'pending' for update;
  if selected_claim.id is null then raise exception 'Claim is unavailable'; end if;
  select country_code into selected_country from public.organizations where id = selected_claim.organization_id;
  if not private.can_manage_country(selected_country) then raise exception 'Forbidden'; end if;
  update public.organization_claims set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where id = target_claim_id;
  insert into public.organization_memberships (organization_id, user_id, role, status, approved_by, approved_at)
  values (selected_claim.organization_id, selected_claim.claimant_id, 'admin', 'approved', auth.uid(), now())
  on conflict (organization_id, user_id) do update set role = 'admin', status = 'approved', approved_by = auth.uid(), approved_at = now();
end;
$$;
revoke all on function public.approve_organization_claim(uuid) from public;
grant execute on function public.approve_organization_claim(uuid) to authenticated;

revoke all on public.organizations, public.organization_claims, public.organization_memberships, public.organization_announcements, public.organization_events, public.organization_event_registrations, public.organization_join_links from anon, authenticated;
grant select (id, country_code, slug, name, description, city, state_region, public_email, website_url, status, verification_status, source_url, last_verified_at, created_at, updated_at) on public.organizations to anon, authenticated;
grant select (id, organization_id, title, body, status, published_at, created_at, updated_at) on public.organization_announcements to anon, authenticated;
grant select (id, organization_id, title, description, starts_at, ends_at, venue_name, venue_address, online_url, capacity, status, published_at, created_at, updated_at) on public.organization_events to anon, authenticated;
grant select (id, organization_id, token, is_active, expires_at, created_at) on public.organization_join_links to anon, authenticated;
grant insert, update on public.organizations, public.organization_announcements, public.organization_events, public.organization_join_links to authenticated;
grant select, insert, update on public.organization_claims, public.organization_memberships, public.organization_event_registrations to authenticated;

commit;
