begin;

create type public.official_source_scope as enum ('representative_office', 'news');
create type public.office_type as enum ('embassy', 'consulate_general', 'consulate', 'other');
create type public.contact_channel_type as enum ('phone', 'whatsapp', 'email', 'website');
create type public.news_integration_type as enum ('manual_url', 'authorized_feed', 'authorized_api');
create type public.publication_status as enum ('draft', 'published', 'archived');

create table public.official_sources (
  id uuid primary key default gen_random_uuid(),
  scope public.official_source_scope not null,
  country_code text references public.countries(code),
  name text not null check (char_length(trim(name)) between 2 and 160),
  source_url text not null check (source_url ~ '^https://'),
  verification_status public.verification_status not null default 'unverified',
  last_verified_at timestamptz,
  integration_type public.news_integration_type,
  integration_endpoint_url text check (integration_endpoint_url is null or integration_endpoint_url ~ '^https://'),
  integration_enabled boolean not null default false,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_sources_verification_metadata check (
    verification_status <> 'verified' or last_verified_at is not null
  ),
  constraint official_sources_integration_scope check (
    scope = 'news' or (
      integration_type is null
      and integration_endpoint_url is null
      and integration_enabled = false
    )
  ),
  constraint official_sources_future_integrations_disabled check (
    integration_type not in ('authorized_feed', 'authorized_api')
    or integration_enabled = false
  )
);

create table public.representative_offices (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code),
  name text not null check (char_length(trim(name)) between 2 and 180),
  office_type public.office_type not null,
  source_id uuid not null references public.official_sources(id),
  verification_status public.verification_status not null default 'unverified',
  last_verified_at timestamptz,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint representative_offices_verification_metadata check (
    verification_status <> 'verified' or last_verified_at is not null
  )
);

create table public.office_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.representative_offices(id) on delete cascade,
  country_code text not null references public.countries(code),
  state_name text not null check (char_length(trim(state_name)) between 2 and 120),
  source_id uuid not null references public.official_sources(id),
  verification_status public.verification_status not null default 'unverified',
  last_verified_at timestamptz,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, state_name, office_id),
  constraint office_jurisdictions_verification_metadata check (
    verification_status <> 'verified' or last_verified_at is not null
  )
);

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.office_contact_channels (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.representative_offices(id) on delete cascade,
  service_category_id uuid not null references public.service_categories(id),
  channel_type public.contact_channel_type not null,
  label text not null check (char_length(trim(label)) between 2 and 120),
  channel_value text not null check (char_length(trim(channel_value)) between 3 and 500),
  source_id uuid not null references public.official_sources(id),
  verification_status public.verification_status not null default 'unverified',
  last_verified_at timestamptz,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint office_contacts_verification_metadata check (
    verification_status <> 'verified' or last_verified_at is not null
  )
);

create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.official_sources(id),
  title text not null check (char_length(trim(title)) between 3 and 220),
  official_url text not null check (official_url ~ '^https://'),
  summary text,
  published_at timestamptz,
  publication_status public.publication_status not null default 'draft',
  verification_status public.verification_status not null default 'unverified',
  last_verified_at timestamptz,
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_items_verification_metadata check (
    verification_status <> 'verified' or last_verified_at is not null
  ),
  constraint news_items_publication_safety check (
    publication_status <> 'published'
    or is_demo
    or (verification_status = 'verified' and last_verified_at is not null)
  )
);

create or replace function private.can_manage_country(target_country_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles viewer
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

create or replace function private.can_manage_office(target_office_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.representative_offices office
    where office.id = target_office_id
      and private.can_manage_country(office.country_code)
  );
$$;

create or replace function private.can_manage_source(target_source_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.official_sources source
    where source.id = target_source_id
      and private.can_manage_country(source.country_code)
  );
$$;

revoke all on function private.can_manage_country(text) from public;
revoke all on function private.can_manage_office(uuid) from public;
revoke all on function private.can_manage_source(uuid) from public;
grant execute on function private.can_manage_country(text) to authenticated;
grant execute on function private.can_manage_office(uuid) to authenticated;
grant execute on function private.can_manage_source(uuid) to authenticated;

create trigger official_sources_set_updated_at before update on public.official_sources
for each row execute function private.set_updated_at();
create trigger representative_offices_set_updated_at before update on public.representative_offices
for each row execute function private.set_updated_at();
create trigger office_jurisdictions_set_updated_at before update on public.office_jurisdictions
for each row execute function private.set_updated_at();
create trigger service_categories_set_updated_at before update on public.service_categories
for each row execute function private.set_updated_at();
create trigger office_contact_channels_set_updated_at before update on public.office_contact_channels
for each row execute function private.set_updated_at();
create trigger news_items_set_updated_at before update on public.news_items
for each row execute function private.set_updated_at();

alter table public.official_sources enable row level security;
alter table public.representative_offices enable row level security;
alter table public.office_jurisdictions enable row level security;
alter table public.service_categories enable row level security;
alter table public.office_contact_channels enable row level security;
alter table public.news_items enable row level security;

create policy "Public can read publishable official sources" on public.official_sources
for select to anon, authenticated using (
  is_active and (is_demo or (verification_status = 'verified' and last_verified_at is not null))
);
create policy "Admins manage official sources" on public.official_sources
for all to authenticated using ((select private.can_manage_country(country_code)))
with check ((select private.can_manage_country(country_code)));

create policy "Public can read publishable offices" on public.representative_offices
for select to anon, authenticated using (
  is_active and (is_demo or (verification_status = 'verified' and last_verified_at is not null))
);
create policy "Admins manage offices" on public.representative_offices
for all to authenticated using ((select private.can_manage_country(country_code)))
with check ((select private.can_manage_country(country_code)));

create policy "Public can read publishable jurisdictions" on public.office_jurisdictions
for select to anon, authenticated using (
  is_demo or (verification_status = 'verified' and last_verified_at is not null)
);
create policy "Admins manage jurisdictions" on public.office_jurisdictions
for all to authenticated using ((select private.can_manage_country(country_code)))
with check ((select private.can_manage_country(country_code)));

create policy "Public can read active service categories" on public.service_categories
for select to anon, authenticated using (is_active);
create policy "Admins manage service categories" on public.service_categories
for all to authenticated using (
  (select private.can_manage_country(null))
)
with check ((select private.can_manage_country(null)));

create policy "Public can read publishable contact channels" on public.office_contact_channels
for select to anon, authenticated using (
  is_active and (is_demo or (verification_status = 'verified' and last_verified_at is not null))
);
create policy "Admins manage contact channels" on public.office_contact_channels
for all to authenticated using ((select private.can_manage_office(office_id)))
with check ((select private.can_manage_office(office_id)));

create policy "Public can read published news" on public.news_items
for select to anon, authenticated using (
  publication_status = 'published'
  and (is_demo or (verification_status = 'verified' and last_verified_at is not null))
);
create policy "Admins manage news" on public.news_items
for all to authenticated using ((select private.can_manage_source(source_id)))
with check ((select private.can_manage_source(source_id)));

revoke all on public.official_sources, public.representative_offices,
  public.office_jurisdictions, public.service_categories,
  public.office_contact_channels, public.news_items from anon, authenticated;
grant select on public.official_sources, public.representative_offices,
  public.office_jurisdictions, public.service_categories,
  public.office_contact_channels, public.news_items to anon, authenticated;
grant insert, update, delete on public.official_sources, public.representative_offices,
  public.office_jurisdictions, public.service_categories,
  public.office_contact_channels, public.news_items to authenticated;

insert into public.official_sources (
  id, scope, country_code, name, source_url, integration_type, is_demo
) values
  ('10000000-0000-0000-0000-000000000001', 'representative_office', 'MY',
   'DEMO — Representative Office Source', 'https://example.invalid/duta-ai/demo-office-source', null, true),
  ('10000000-0000-0000-0000-000000000002', 'news', 'MY',
   'DEMO — Official News Source', 'https://example.invalid/duta-ai/demo-news-source', 'manual_url', true);

insert into public.representative_offices (
  id, country_code, name, office_type, source_id, is_demo
) values (
  '20000000-0000-0000-0000-000000000001', 'MY',
  'DEMO — Indonesian Representative Office', 'other',
  '10000000-0000-0000-0000-000000000001', true
);

insert into public.office_jurisdictions (
  id, office_id, country_code, state_name, source_id, is_demo
) values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', 'MY', 'DEMO State',
  '10000000-0000-0000-0000-000000000001', true
);

insert into public.service_categories (id, slug, name, description, is_demo)
values (
  '40000000-0000-0000-0000-000000000001', 'demo-general-inquiry',
  'DEMO — General Inquiry', 'Development-only category. Not an official service listing.', true
);

insert into public.office_contact_channels (
  office_id, service_category_id, channel_type, label, channel_value, source_id, is_demo
) values (
  '20000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001', 'website',
  'DEMO — Website', 'https://example.invalid/duta-ai/demo-contact',
  '10000000-0000-0000-0000-000000000001', true
);

insert into public.news_items (
  source_id, title, official_url, summary, publication_status, is_demo
) values (
  '10000000-0000-0000-0000-000000000002',
  'DEMO — Official News URL Entry', 'https://example.invalid/duta-ai/demo-news-item',
  'Development-only news record. This is not real official information.', 'published', true
);

commit;
