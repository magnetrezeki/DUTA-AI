begin;

create type public.community_moderation_status as enum ('pending', 'approved', 'rejected', 'needs_changes');
create type public.community_trust_label as enum (
  'community_unverified',
  'community_confirmed',
  'trusted_contributor_confirmed',
  'admin_reviewed'
);
create type public.place_report_reason as enum (
  'incorrect_information', 'closed', 'duplicate', 'unsafe', 'other'
);

create table public.place_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.place_categories(id),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_categories_not_self_parent check (parent_id is null or parent_id <> id)
);

create table public.community_places (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code),
  category_id uuid not null references public.place_categories(id),
  name text not null check (char_length(trim(name)) between 2 and 180),
  normalized_name text generated always as (
    lower(regexp_replace(trim(name), '[^[:alnum:]]+', '', 'g'))
  ) stored,
  description text check (description is null or char_length(description) <= 2000),
  address_text text not null check (char_length(trim(address_text)) between 5 and 500),
  city text not null check (char_length(trim(city)) between 2 and 120),
  state_region text not null check (char_length(trim(state_region)) between 2 and 120),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  phone text check (phone is null or char_length(trim(phone)) between 3 and 50),
  website_url text check (website_url is null or website_url ~ '^https://'),
  moderation_status public.community_moderation_status not null default 'pending',
  trust_label public.community_trust_label not null default 'community_unverified',
  potential_duplicate_id uuid references public.community_places(id) on delete set null,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_places_moderation_audit check (
    moderation_status = 'pending'
    or (moderated_by is not null and moderated_at is not null)
  ),
  constraint community_places_no_self_duplicate check (
    potential_duplicate_id is null or potential_duplicate_id <> id
  )
);

create table public.place_corrections (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.community_places(id) on delete cascade,
  proposed_changes jsonb not null check (
    jsonb_typeof(proposed_changes) = 'object'
    and proposed_changes <@ jsonb_build_object(
      'name', proposed_changes->'name',
      'description', proposed_changes->'description',
      'address_text', proposed_changes->'address_text',
      'city', proposed_changes->'city',
      'state_region', proposed_changes->'state_region',
      'phone', proposed_changes->'phone',
      'website_url', proposed_changes->'website_url'
    )
  ),
  reason text not null check (char_length(trim(reason)) between 10 and 1000),
  moderation_status public.community_moderation_status not null default 'pending',
  submitted_by uuid not null references auth.users(id) on delete cascade,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.place_reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.community_places(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  review_text text not null check (char_length(trim(review_text)) between 10 and 1500),
  moderation_status public.community_moderation_status not null default 'pending',
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, author_id)
);

create table public.place_recommendations (
  place_id uuid not null references public.community_places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, user_id)
);

create table public.place_confirmations (
  place_id uuid not null references public.community_places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, user_id)
);

create table public.place_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.community_places(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason public.place_report_reason not null,
  details text not null check (char_length(trim(details)) between 10 and 1000),
  moderation_status public.community_moderation_status not null default 'pending',
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_places_public_search_idx
  on public.community_places (country_code, moderation_status, category_id, state_region, city);
create index community_places_duplicate_idx
  on public.community_places (country_code, normalized_name, city);
create index community_places_location_idx
  on public.community_places (latitude, longitude)
  where moderation_status = 'approved';
create index place_corrections_moderation_idx on public.place_corrections (moderation_status, created_at);
create index place_reviews_public_idx on public.place_reviews (place_id, moderation_status, created_at);
create index place_reports_moderation_idx on public.place_reports (moderation_status, created_at);

create or replace function private.flag_place_duplicate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select candidate.id into new.potential_duplicate_id
  from public.community_places candidate
  where candidate.country_code = new.country_code
    and candidate.normalized_name = lower(regexp_replace(trim(new.name), '[^[:alnum:]]+', '', 'g'))
    and lower(candidate.city) = lower(new.city)
    and candidate.id <> new.id
  order by candidate.created_at
  limit 1;
  return new;
end;
$$;

revoke all on function private.flag_place_duplicate() from public;

create trigger community_places_flag_duplicate
before insert or update of name, city, country_code on public.community_places
for each row execute function private.flag_place_duplicate();

create trigger place_categories_set_updated_at before update on public.place_categories
for each row execute function private.set_updated_at();
create trigger community_places_set_updated_at before update on public.community_places
for each row execute function private.set_updated_at();
create trigger place_corrections_set_updated_at before update on public.place_corrections
for each row execute function private.set_updated_at();
create trigger place_reviews_set_updated_at before update on public.place_reviews
for each row execute function private.set_updated_at();
create trigger place_reports_set_updated_at before update on public.place_reports
for each row execute function private.set_updated_at();

alter table public.place_categories enable row level security;
alter table public.community_places enable row level security;
alter table public.place_corrections enable row level security;
alter table public.place_reviews enable row level security;
alter table public.place_recommendations enable row level security;
alter table public.place_confirmations enable row level security;
alter table public.place_reports enable row level security;

create policy "Public reads active map categories" on public.place_categories
for select to anon, authenticated using (is_active);
create policy "Admins manage map categories" on public.place_categories
for all to authenticated
using ((select private.can_manage_country(null)))
with check ((select private.can_manage_country(null)));

create policy "Public reads approved community places" on public.community_places
for select to anon, authenticated using (moderation_status = 'approved');
create policy "Members read own place submissions" on public.community_places
for select to authenticated using (submitted_by = (select auth.uid()));
create policy "Members submit pending community places" on public.community_places
for insert to authenticated with check (
  submitted_by = (select auth.uid())
  and moderation_status = 'pending'
  and trust_label = 'community_unverified'
  and moderated_by is null
  and moderated_at is null
);
create policy "Admins moderate community places" on public.community_places
for all to authenticated
using ((select private.can_manage_country(country_code)))
with check ((select private.can_manage_country(country_code)));

create policy "Members read own corrections" on public.place_corrections
for select to authenticated using (submitted_by = (select auth.uid()));
create policy "Members submit pending corrections" on public.place_corrections
for insert to authenticated with check (
  submitted_by = (select auth.uid()) and moderation_status = 'pending'
  and moderated_by is null and moderated_at is null
);
create policy "Admins manage corrections" on public.place_corrections
for all to authenticated
using (exists (
  select 1 from public.community_places p
  where p.id = place_id and private.can_manage_country(p.country_code)
))
with check (exists (
  select 1 from public.community_places p
  where p.id = place_id and private.can_manage_country(p.country_code)
));

create policy "Public reads approved reviews" on public.place_reviews
for select to anon, authenticated using (moderation_status = 'approved');
create policy "Members read own reviews" on public.place_reviews
for select to authenticated using (author_id = (select auth.uid()));
create policy "Members submit pending reviews" on public.place_reviews
for insert to authenticated with check (
  author_id = (select auth.uid()) and moderation_status = 'pending'
  and moderated_by is null and moderated_at is null
);
create policy "Admins moderate reviews" on public.place_reviews
for all to authenticated using (exists (
  select 1 from public.community_places p
  where p.id = place_id and private.can_manage_country(p.country_code)
)) with check (exists (
  select 1 from public.community_places p
  where p.id = place_id and private.can_manage_country(p.country_code)
));

create policy "Members manage own recommendations" on public.place_recommendations
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.community_places p where p.id = place_id and p.moderation_status = 'approved'
));
create policy "Members manage own confirmations" on public.place_confirmations
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and exists (
  select 1 from public.community_places p where p.id = place_id and p.moderation_status = 'approved'
));

create policy "Members read own reports" on public.place_reports
for select to authenticated using (reporter_id = (select auth.uid()));
create policy "Members submit pending reports" on public.place_reports
for insert to authenticated with check (
  reporter_id = (select auth.uid()) and moderation_status = 'pending'
  and moderated_by is null and moderated_at is null
);
create policy "Admins manage reports" on public.place_reports
for all to authenticated using (exists (
  select 1 from public.community_places p
  where p.id = place_id and private.can_manage_country(p.country_code)
)) with check (exists (
  select 1 from public.community_places p
  where p.id = place_id and private.can_manage_country(p.country_code)
));

revoke all on public.place_categories, public.community_places, public.place_corrections,
  public.place_reviews, public.place_recommendations, public.place_confirmations,
  public.place_reports from anon, authenticated;
grant select on public.place_categories to anon, authenticated;
grant select (
  id, country_code, category_id, name, description, address_text, city,
  state_region, latitude, longitude, phone, website_url, moderation_status,
  trust_label, created_at, updated_at
) on public.community_places to anon, authenticated;
grant select (potential_duplicate_id) on public.community_places to authenticated;
grant select (
  id, place_id, rating, review_text, moderation_status, created_at, updated_at
) on public.place_reviews to anon, authenticated;
grant select, insert on public.place_corrections, public.place_reports to authenticated;
grant insert on public.community_places, public.place_reviews to authenticated;
grant select, insert, delete on public.place_recommendations, public.place_confirmations to authenticated;
grant update, delete on public.place_categories, public.community_places, public.place_corrections,
  public.place_reviews, public.place_reports to authenticated;
grant insert on public.place_categories to authenticated;

insert into public.place_categories (id, parent_id, slug, name, sort_order) values
  ('51000000-0000-0000-0000-000000000001', null, 'indonesian-restaurants', 'Restoran Indonesia', 10),
  ('51000000-0000-0000-0000-000000000002', null, 'indonesian-stores', 'Toko Indonesia', 20),
  ('51000000-0000-0000-0000-000000000003', null, 'mosques', 'Masjid', 30),
  ('51000000-0000-0000-0000-000000000004', null, 'community-organizations', 'Organisasi Komunitas', 40),
  ('51000000-0000-0000-0000-000000000005', null, 'education', 'Pendidikan', 50),
  ('51000000-0000-0000-0000-000000000006', null, 'services', 'Layanan', 60),
  ('51000000-0000-0000-0000-000000000007', null, 'accommodation', 'Akomodasi', 70),
  ('51000000-0000-0000-0000-000000000008', null, 'health', 'Kesehatan', 80),
  ('51000000-0000-0000-0000-000000000009', '51000000-0000-0000-0000-000000000008', 'general-clinics', 'Klinik Umum', 81),
  ('51000000-0000-0000-0000-000000000010', '51000000-0000-0000-0000-000000000008', 'dental-clinics', 'Klinik Gigi', 82),
  ('51000000-0000-0000-0000-000000000011', '51000000-0000-0000-0000-000000000008', 'hospitals', 'Rumah Sakit', 83),
  ('51000000-0000-0000-0000-000000000012', '51000000-0000-0000-0000-000000000008', 'pharmacies', 'Apotek', 84),
  ('51000000-0000-0000-0000-000000000013', '51000000-0000-0000-0000-000000000008', 'diagnostic-facilities', 'Fasilitas Diagnostik', 85);

commit;
