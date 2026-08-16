begin;

-- DUTA Layanan WNI Phase 2: additive operational schema only.
-- Malaysia operational records and evidence-backed seed data are intentionally separate.

create type public.service_publishability_status as enum (
  'VERIFIED_CURRENT',
  'VERIFIED_OFFICIAL',
  'OFFICIAL_BUT_DATE_UNCERTAIN',
  'SUPERSEDED',
  'UNVERIFIED'
);
create type public.jurisdiction_type as enum ('STATE_WIDE', 'DISTRICT', 'FEDERAL_TERRITORY');
create type public.channel_purpose as enum (
  'SERVICE_SPECIFIC', 'CONSULAR', 'PROTECTION', 'APPOINTMENT', 'GENERAL'
);
create type public.channel_health_status as enum ('HEALTHY', 'FAILED_CHECK', 'REVIEW_REQUIRED', 'UNKNOWN');
create type public.appointment_type as enum ('WEB_PORTAL', 'WHATSAPP', 'CHATBOT', 'OTHER');
create type public.service_verification_event_type as enum (
  'VERIFIED', 'REVERIFIED', 'MARKED_REVIEW_DUE', 'MARKED_STALE', 'SUPERSEDED', 'DISABLED'
);
create type public.service_conflict_status as enum ('OPEN', 'RESOLVED', 'DISMISSED');
create type public.official_service_event_type as enum (
  'MOBILE_CONSULAR_SERVICE', 'PASSPORT_OUTREACH', 'PMI_SERVICE',
  'PROTECTION_OUTREACH', 'DOCUMENT_SERVICE', 'OTHER'
);
create type public.user_service_report_category as enum (
  'NUMBER_NOT_WORKING', 'WHATSAPP_UNAVAILABLE', 'BROKEN_APPOINTMENT_LINK',
  'POSSIBLE_FEE_CHANGE', 'OUTDATED_INFORMATION', 'OTHER'
);
create type public.user_service_report_status as enum ('NEW', 'REVIEWING', 'RESOLVED', 'REJECTED');

alter type public.contact_channel_type add value if not exists 'emergency_hotline';
alter type public.contact_channel_type add value if not exists 'appointment_whatsapp';
alter type public.contact_channel_type add value if not exists 'chatbot';
alter type public.contact_channel_type add value if not exists 'service_portal';
alter type public.contact_channel_type add value if not exists 'appointment_portal';
alter type public.contact_channel_type add value if not exists 'directions';

alter table public.representative_offices
  add column mission_code text,
  add column city text,
  add column address text,
  add column latitude numeric(9,6),
  add column longitude numeric(9,6),
  add column enabled boolean not null default false,
  add column publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  add column effective_from timestamptz,
  add column effective_until timestamptz,
  add column review_due_at timestamptz,
  add constraint representative_offices_mission_code_format check (
    mission_code is null or mission_code ~ '^[A-Z0-9]+(?:-[A-Z0-9]+)*$'
  ),
  add constraint representative_offices_coordinates_paired check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  ),
  add constraint representative_offices_effective_period check (
    effective_until is null or effective_from is null or effective_until > effective_from
  ),
  add constraint representative_offices_publication_safety check (
    not enabled or (
      not is_demo
      and verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  );

alter table public.office_jurisdictions
  add column state_normalized text,
  add column district_name text,
  add column district_normalized text,
  add column jurisdiction_type public.jurisdiction_type,
  add column routing_priority smallint not null default 100,
  add column enabled boolean not null default false,
  add column publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  add column effective_from timestamptz,
  add column effective_until timestamptz,
  add column review_due_at timestamptz,
  add constraint office_jurisdictions_routing_priority check (routing_priority between 1 and 1000),
  add constraint office_jurisdictions_normalized_state check (
    state_normalized is null or state_normalized ~ '^[a-z0-9]+(?:[ -][a-z0-9]+)*$'
  ),
  add constraint office_jurisdictions_normalized_district check (
    district_normalized is null or district_normalized ~ '^[a-z0-9]+(?:[ -][a-z0-9]+)*$'
  ),
  add constraint office_jurisdictions_district_required check (
    jurisdiction_type is distinct from 'DISTRICT'
    or (district_name is not null and district_normalized is not null)
  ),
  add constraint office_jurisdictions_effective_period check (
    effective_until is null or effective_from is null or effective_until > effective_from
  ),
  add constraint office_jurisdictions_publication_safety check (
    not enabled or (
      not is_demo
      and state_normalized is not null
      and jurisdiction_type is not null
      and verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  );

alter table public.service_categories
  add column service_code text,
  add column intent_group text,
  add column display_order smallint not null default 100,
  add column review_due_at timestamptz,
  add constraint service_categories_service_code_format check (
    service_code is null or service_code ~ '^[A-Z0-9]+(?:_[A-Z0-9]+)*$'
  ),
  add constraint service_categories_intent_group_format check (
    intent_group is null or intent_group ~ '^[A-Z0-9]+(?:_[A-Z0-9]+)*$'
  ),
  add constraint service_categories_display_order check (display_order between 1 and 1000);

alter table public.office_contact_channels
  add column raw_value text,
  add column normalized_value text,
  add column e164_phone text,
  add column url text,
  add column purpose public.channel_purpose,
  add column display_order smallint not null default 100,
  add column fallback_priority smallint not null default 100,
  add column enabled boolean not null default false,
  add column publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  add column effective_from timestamptz,
  add column effective_until timestamptz,
  add column review_due_at timestamptz,
  add column health_status public.channel_health_status not null default 'UNKNOWN',
  add column last_health_check_at timestamptz,
  add column last_success_at timestamptz,
  add column failure_count integer not null default 0,
  add constraint office_contact_channels_e164_format check (
    e164_phone is null or e164_phone ~ '^\+[1-9][0-9]{7,14}$'
  ),
  add constraint office_contact_channels_url_https check (url is null or url ~ '^https://'),
  add constraint office_contact_channels_display_order check (display_order between 1 and 1000),
  add constraint office_contact_channels_fallback_priority check (fallback_priority between 1 and 1000),
  add constraint office_contact_channels_failure_count check (failure_count >= 0),
  add constraint office_contact_channels_effective_period check (
    effective_until is null or effective_from is null or effective_until > effective_from
  ),
  add constraint office_contact_channels_publication_safety check (
    not enabled or (
      not is_demo
      and normalized_value is not null
      and purpose is not null
      and verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  );

create unique index representative_offices_mission_code_idx
  on public.representative_offices (mission_code) where mission_code is not null;
create index representative_offices_public_idx
  on public.representative_offices (country_code, enabled, publishability_status);
create index office_jurisdictions_normalized_identity_idx
  on public.office_jurisdictions (
    office_id, country_code, state_normalized,
    coalesce(district_normalized, ''), jurisdiction_type
  ) where enabled
    and state_normalized is not null and jurisdiction_type is not null;
create or replace function private.prevent_office_jurisdiction_overlap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  identity_lock_key text;
begin
  if not new.enabled then
    return new;
  end if;

  identity_lock_key := concat_ws('|',
    new.office_id::text,
    new.country_code,
    new.state_normalized,
    coalesce(new.district_normalized, ''),
    new.jurisdiction_type::text
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(identity_lock_key, 0)
  );

  if exists (
    select 1
    from public.office_jurisdictions existing
    where existing.id <> new.id
      and existing.enabled
      and existing.office_id = new.office_id
      and existing.country_code = new.country_code
      and existing.state_normalized = new.state_normalized
      and coalesce(existing.district_normalized, '') = coalesce(new.district_normalized, '')
      and existing.jurisdiction_type = new.jurisdiction_type
      and tstzrange(
        coalesce(existing.effective_from, '-infinity'::timestamptz),
        existing.effective_until,
        '[)'
      ) && tstzrange(
        coalesce(new.effective_from, '-infinity'::timestamptz),
        new.effective_until,
        '[)'
      )
  ) then
    raise exception using
      errcode = '23P01',
      message = 'office jurisdiction effective period overlaps an existing enabled jurisdiction';
  end if;

  return new;
end;
$$;
revoke all on function private.prevent_office_jurisdiction_overlap() from public;
create trigger office_jurisdictions_prevent_overlap
before insert or update of office_id, country_code, state_normalized,
  district_normalized, jurisdiction_type, enabled, effective_from, effective_until
on public.office_jurisdictions
for each row execute function private.prevent_office_jurisdiction_overlap();
create index office_jurisdictions_route_idx
  on public.office_jurisdictions (
    country_code, state_normalized, district_normalized, enabled, routing_priority
  );
create unique index service_categories_service_code_idx
  on public.service_categories (service_code) where service_code is not null;
create index service_categories_public_order_idx
  on public.service_categories (is_active, display_order, name);
create unique index office_contact_channels_current_identity_idx
  on public.office_contact_channels (
    office_id, service_category_id, channel_type, normalized_value
  ) where enabled and effective_until is null and normalized_value is not null;
create index office_contact_channels_route_idx
  on public.office_contact_channels (
    office_id, service_category_id, purpose, enabled, fallback_priority, display_order
  );
create index office_contact_channels_e164_idx
  on public.office_contact_channels (e164_phone) where e164_phone is not null;

create table public.location_aliases (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on delete restrict,
  alias_normalized text not null check (alias_normalized ~ '^[a-z0-9]+(?:[ -][a-z0-9]+)*$'),
  canonical_state_normalized text not null check (canonical_state_normalized ~ '^[a-z0-9]+(?:[ -][a-z0-9]+)*$'),
  canonical_district_normalized text check (
    canonical_district_normalized is null
    or canonical_district_normalized ~ '^[a-z0-9]+(?:[ -][a-z0-9]+)*$'
  ),
  enabled boolean not null default false,
  verification_status public.verification_status not null default 'unverified',
  publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  source_id uuid not null references public.official_sources(id) on delete restrict,
  last_verified_at timestamptz,
  review_due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_aliases_publication_safety check (
    not enabled or (
      verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  ),
  unique (country_code, alias_normalized)
);

create table public.mission_services (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.representative_offices(id) on delete restrict,
  service_category_id uuid not null references public.service_categories(id) on delete restrict,
  enabled boolean not null default false,
  appointment_required boolean,
  walk_in_allowed boolean,
  notes text,
  verification_status public.verification_status not null default 'unverified',
  publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  source_id uuid not null references public.official_sources(id) on delete restrict,
  effective_from timestamptz,
  effective_until timestamptz,
  last_verified_at timestamptz,
  review_due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_services_effective_period check (
    effective_until is null or effective_from is null or effective_until > effective_from
  ),
  constraint mission_services_publication_safety check (
    not enabled or (
      verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  )
);
create unique index mission_services_current_identity_idx
  on public.mission_services (office_id, service_category_id)
  where enabled and effective_until is null;
create index mission_services_route_idx
  on public.mission_services (office_id, service_category_id, enabled, publishability_status);

create table public.mission_service_fees (
  id uuid primary key default gen_random_uuid(),
  mission_service_id uuid not null references public.mission_services(id) on delete restrict,
  fee_label text not null check (char_length(trim(fee_label)) between 2 and 160),
  amount numeric(12,2),
  currency char(3),
  is_free boolean not null default false,
  enabled boolean not null default false,
  verification_status public.verification_status not null default 'unverified',
  publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  source_id uuid not null references public.official_sources(id) on delete restrict,
  effective_from timestamptz not null,
  effective_until timestamptz,
  last_verified_at timestamptz,
  review_due_at timestamptz,
  superseded_by uuid references public.mission_service_fees(id) on delete restrict,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_service_fees_value check (
    (is_free and coalesce(amount, 0) = 0)
    or (not is_free and amount is not null and amount > 0 and currency ~ '^[A-Z]{3}$')
  ),
  constraint mission_service_fees_effective_period check (
    effective_until is null or effective_until > effective_from
  ),
  constraint mission_service_fees_not_self_superseded check (superseded_by is distinct from id),
  constraint mission_service_fees_publication_safety check (
    not enabled or (
      verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in (
        'VERIFIED_CURRENT', 'VERIFIED_OFFICIAL', 'OFFICIAL_BUT_DATE_UNCERTAIN'
      )
    )
  )
);
create unique index mission_service_fees_current_label_idx
  on public.mission_service_fees (mission_service_id, lower(btrim(fee_label)))
  where enabled and effective_until is null and superseded_by is null;
create index mission_service_fees_current_idx
  on public.mission_service_fees (mission_service_id, enabled, effective_from desc);

create table public.mission_service_requirements (
  id uuid primary key default gen_random_uuid(),
  mission_service_id uuid not null references public.mission_services(id) on delete restrict,
  requirement_order smallint not null check (requirement_order between 1 and 1000),
  requirement_text text not null check (char_length(trim(requirement_text)) between 2 and 3000),
  enabled boolean not null default false,
  verification_status public.verification_status not null default 'unverified',
  publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  source_id uuid not null references public.official_sources(id) on delete restrict,
  effective_from timestamptz,
  effective_until timestamptz,
  last_verified_at timestamptz,
  review_due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_service_requirements_effective_period check (
    effective_until is null or effective_from is null or effective_until > effective_from
  ),
  constraint mission_service_requirements_publication_safety check (
    not enabled or (
      verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  )
);
create unique index mission_service_requirements_current_order_idx
  on public.mission_service_requirements (mission_service_id, requirement_order)
  where enabled and effective_until is null;

create table public.mission_appointments (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.representative_offices(id) on delete restrict,
  service_category_id uuid references public.service_categories(id) on delete restrict,
  appointment_type public.appointment_type not null,
  label text not null check (char_length(trim(label)) between 2 and 160),
  url text check (url is null or url ~ '^https://'),
  contact_channel_id uuid references public.office_contact_channels(id) on delete set null,
  instructions text check (instructions is null or char_length(instructions) <= 5000),
  enabled boolean not null default false,
  verification_status public.verification_status not null default 'unverified',
  publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  source_id uuid not null references public.official_sources(id) on delete restrict,
  effective_from timestamptz,
  effective_until timestamptz,
  last_verified_at timestamptz,
  review_due_at timestamptz,
  health_status public.channel_health_status not null default 'UNKNOWN',
  last_health_check_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_appointments_destination check (url is not null or contact_channel_id is not null),
  constraint mission_appointments_effective_period check (
    effective_until is null or effective_from is null or effective_until > effective_from
  ),
  constraint mission_appointments_publication_safety check (
    not enabled or (
      verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  )
);
create unique index mission_appointments_current_identity_idx
  on public.mission_appointments (
    office_id, coalesce(service_category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    appointment_type, coalesce(url, ''),
    coalesce(contact_channel_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) where enabled and effective_until is null;
create index mission_appointments_route_idx
  on public.mission_appointments (office_id, service_category_id, enabled);

create table public.mission_service_hours (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.representative_offices(id) on delete restrict,
  service_category_id uuid references public.service_categories(id) on delete restrict,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  timezone text not null default 'Asia/Kuala_Lumpur',
  enabled boolean not null default false,
  verification_status public.verification_status not null default 'unverified',
  publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  source_id uuid not null references public.official_sources(id) on delete restrict,
  effective_from date,
  effective_until date,
  last_verified_at timestamptz,
  review_due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_service_hours_order check (closes_at > opens_at),
  constraint mission_service_hours_effective_period check (
    effective_until is null or effective_from is null or effective_until >= effective_from
  ),
  constraint mission_service_hours_publication_safety check (
    not enabled or (
      verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  )
);
create unique index mission_service_hours_current_slot_idx
  on public.mission_service_hours (
    office_id, coalesce(service_category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    day_of_week, opens_at, closes_at
  ) where enabled and effective_until is null;

create table public.mission_service_hour_exceptions (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.representative_offices(id) on delete restrict,
  service_category_id uuid references public.service_categories(id) on delete restrict,
  exception_date date not null,
  is_closed boolean not null default false,
  opens_at time,
  closes_at time,
  label text check (label is null or char_length(trim(label)) between 2 and 160),
  enabled boolean not null default false,
  verification_status public.verification_status not null default 'unverified',
  publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  source_id uuid not null references public.official_sources(id) on delete restrict,
  last_verified_at timestamptz,
  review_due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mission_service_hour_exceptions_time check (
    (is_closed and opens_at is null and closes_at is null)
    or (not is_closed and opens_at is not null and closes_at is not null and closes_at > opens_at)
  ),
  constraint mission_service_hour_exceptions_publication_safety check (
    not enabled or (
      verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  )
);
create unique index mission_service_hour_exceptions_identity_idx
  on public.mission_service_hour_exceptions (
    office_id,
    coalesce(service_category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    exception_date
  );

create table public.official_service_events (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.representative_offices(id) on delete restrict,
  event_type public.official_service_event_type not null,
  title text not null check (char_length(trim(title)) between 3 and 220),
  description text check (description is null or char_length(description) <= 5000),
  venue_name text,
  address text,
  country_code text not null references public.countries(code) on delete restrict,
  state_name text not null,
  state_normalized text not null check (state_normalized ~ '^[a-z0-9]+(?:[ -][a-z0-9]+)*$'),
  district_name text,
  district_normalized text check (
    district_normalized is null or district_normalized ~ '^[a-z0-9]+(?:[ -][a-z0-9]+)*$'
  ),
  starts_at timestamptz not null,
  ends_at timestamptz,
  registration_url text check (registration_url is null or registration_url ~ '^https://'),
  contact_channel_id uuid references public.office_contact_channels(id) on delete set null,
  enabled boolean not null default false,
  verification_status public.verification_status not null default 'unverified',
  publishability_status public.service_publishability_status not null default 'UNVERIFIED',
  source_id uuid not null references public.official_sources(id) on delete restrict,
  effective_until timestamptz,
  last_verified_at timestamptz,
  review_due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_service_events_time_order check (ends_at is null or ends_at > starts_at),
  constraint official_service_events_publication_safety check (
    not enabled or (
      verification_status = 'verified'
      and last_verified_at is not null
      and publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    )
  )
);
create index official_service_events_location_date_idx
  on public.official_service_events (
    country_code, state_normalized, district_normalized, starts_at
  ) where enabled;

create table public.official_service_event_services (
  event_id uuid not null references public.official_service_events(id) on delete restrict,
  service_category_id uuid not null references public.service_categories(id) on delete restrict,
  primary key (event_id, service_category_id)
);
create index official_service_event_services_service_idx
  on public.official_service_event_services (service_category_id, event_id);

create unique index official_source_items_id_source_idx
  on public.official_source_items (id, source_id);

create table public.official_service_evidence (
  id uuid primary key default gen_random_uuid(),
  official_source_id uuid not null references public.official_sources(id) on delete restrict,
  official_source_item_id uuid,
  representative_office_id uuid references public.representative_offices(id) on delete restrict,
  office_jurisdiction_id uuid references public.office_jurisdictions(id) on delete restrict,
  location_alias_id uuid references public.location_aliases(id) on delete restrict,
  mission_service_id uuid references public.mission_services(id) on delete restrict,
  contact_channel_id uuid references public.office_contact_channels(id) on delete restrict,
  fee_id uuid references public.mission_service_fees(id) on delete restrict,
  requirement_id uuid references public.mission_service_requirements(id) on delete restrict,
  appointment_id uuid references public.mission_appointments(id) on delete restrict,
  service_hours_id uuid references public.mission_service_hours(id) on delete restrict,
  service_hour_exception_id uuid references public.mission_service_hour_exceptions(id) on delete restrict,
  official_service_event_id uuid references public.official_service_events(id) on delete restrict,
  evidence_url text not null check (evidence_url ~ '^https://'),
  evidence_note text check (evidence_note is null or char_length(evidence_note) <= 2000),
  observed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint official_service_evidence_item_source_fk
    foreign key (official_source_item_id, official_source_id)
    references public.official_source_items(id, source_id) on delete restrict,
  constraint official_service_evidence_one_target check (num_nonnulls(
    representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
    contact_channel_id, fee_id, requirement_id, appointment_id,
    service_hours_id, service_hour_exception_id, official_service_event_id
  ) = 1)
);
create index official_service_evidence_source_idx
  on public.official_service_evidence (official_source_id, official_source_item_id);
create index official_service_evidence_office_idx on public.official_service_evidence (representative_office_id) where representative_office_id is not null;
create index official_service_evidence_jurisdiction_idx on public.official_service_evidence (office_jurisdiction_id) where office_jurisdiction_id is not null;
create index official_service_evidence_location_alias_idx on public.official_service_evidence (location_alias_id) where location_alias_id is not null;
create index official_service_evidence_mission_service_idx on public.official_service_evidence (mission_service_id) where mission_service_id is not null;
create index official_service_evidence_contact_idx on public.official_service_evidence (contact_channel_id) where contact_channel_id is not null;
create index official_service_evidence_fee_idx on public.official_service_evidence (fee_id) where fee_id is not null;
create index official_service_evidence_requirement_idx on public.official_service_evidence (requirement_id) where requirement_id is not null;
create index official_service_evidence_appointment_idx on public.official_service_evidence (appointment_id) where appointment_id is not null;
create index official_service_evidence_hours_idx on public.official_service_evidence (service_hours_id) where service_hours_id is not null;
create index official_service_evidence_hour_exception_idx on public.official_service_evidence (service_hour_exception_id) where service_hour_exception_id is not null;
create index official_service_evidence_event_idx on public.official_service_evidence (official_service_event_id) where official_service_event_id is not null;
create unique index official_service_evidence_office_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), representative_office_id)
  where representative_office_id is not null;
create unique index official_service_evidence_jurisdiction_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), office_jurisdiction_id)
  where office_jurisdiction_id is not null;
create unique index official_service_evidence_location_alias_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), location_alias_id)
  where location_alias_id is not null;
create unique index official_service_evidence_mission_service_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), mission_service_id)
  where mission_service_id is not null;
create unique index official_service_evidence_contact_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), contact_channel_id)
  where contact_channel_id is not null;
create unique index official_service_evidence_fee_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), fee_id)
  where fee_id is not null;
create unique index official_service_evidence_requirement_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), requirement_id)
  where requirement_id is not null;
create unique index official_service_evidence_appointment_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), appointment_id)
  where appointment_id is not null;
create unique index official_service_evidence_hours_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), service_hours_id)
  where service_hours_id is not null;
create unique index official_service_evidence_hour_exception_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), service_hour_exception_id)
  where service_hour_exception_id is not null;
create unique index official_service_evidence_event_unique_idx
  on public.official_service_evidence (official_source_id, coalesce(official_source_item_id::text, evidence_url), official_service_event_id)
  where official_service_event_id is not null;

create table public.service_verification_events (
  id uuid primary key default gen_random_uuid(),
  representative_office_id uuid references public.representative_offices(id) on delete restrict,
  office_jurisdiction_id uuid references public.office_jurisdictions(id) on delete restrict,
  location_alias_id uuid references public.location_aliases(id) on delete restrict,
  mission_service_id uuid references public.mission_services(id) on delete restrict,
  contact_channel_id uuid references public.office_contact_channels(id) on delete restrict,
  fee_id uuid references public.mission_service_fees(id) on delete restrict,
  requirement_id uuid references public.mission_service_requirements(id) on delete restrict,
  appointment_id uuid references public.mission_appointments(id) on delete restrict,
  service_hours_id uuid references public.mission_service_hours(id) on delete restrict,
  service_hour_exception_id uuid references public.mission_service_hour_exceptions(id) on delete restrict,
  official_service_event_id uuid references public.official_service_events(id) on delete restrict,
  event_type public.service_verification_event_type not null,
  previous_status public.service_publishability_status,
  new_status public.service_publishability_status not null,
  evidence_id uuid references public.official_service_evidence(id) on delete restrict,
  reason text not null check (char_length(trim(reason)) between 3 and 2000),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint service_verification_events_one_target check (num_nonnulls(
    representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
    contact_channel_id, fee_id, requirement_id, appointment_id,
    service_hours_id, service_hour_exception_id, official_service_event_id
  ) = 1)
);
create index service_verification_events_created_idx
  on public.service_verification_events (created_at desc);
create index service_verification_events_office_idx on public.service_verification_events (representative_office_id, created_at desc) where representative_office_id is not null;
create index service_verification_events_jurisdiction_idx on public.service_verification_events (office_jurisdiction_id, created_at desc) where office_jurisdiction_id is not null;
create index service_verification_events_location_alias_idx on public.service_verification_events (location_alias_id, created_at desc) where location_alias_id is not null;
create index service_verification_events_mission_service_idx on public.service_verification_events (mission_service_id, created_at desc) where mission_service_id is not null;
create index service_verification_events_contact_idx on public.service_verification_events (contact_channel_id, created_at desc) where contact_channel_id is not null;
create index service_verification_events_fee_idx on public.service_verification_events (fee_id, created_at desc) where fee_id is not null;
create index service_verification_events_requirement_idx on public.service_verification_events (requirement_id, created_at desc) where requirement_id is not null;
create index service_verification_events_appointment_idx on public.service_verification_events (appointment_id, created_at desc) where appointment_id is not null;
create index service_verification_events_hours_idx on public.service_verification_events (service_hours_id, created_at desc) where service_hours_id is not null;
create index service_verification_events_hour_exception_idx on public.service_verification_events (service_hour_exception_id, created_at desc) where service_hour_exception_id is not null;
create index service_verification_events_event_idx on public.service_verification_events (official_service_event_id, created_at desc) where official_service_event_id is not null;

create table public.service_data_conflicts (
  id uuid primary key default gen_random_uuid(),
  representative_office_id uuid references public.representative_offices(id) on delete restrict,
  office_jurisdiction_id uuid references public.office_jurisdictions(id) on delete restrict,
  location_alias_id uuid references public.location_aliases(id) on delete restrict,
  mission_service_id uuid references public.mission_services(id) on delete restrict,
  contact_channel_id uuid references public.office_contact_channels(id) on delete restrict,
  fee_id uuid references public.mission_service_fees(id) on delete restrict,
  requirement_id uuid references public.mission_service_requirements(id) on delete restrict,
  appointment_id uuid references public.mission_appointments(id) on delete restrict,
  service_hours_id uuid references public.mission_service_hours(id) on delete restrict,
  service_hour_exception_id uuid references public.mission_service_hour_exceptions(id) on delete restrict,
  official_service_event_id uuid references public.official_service_events(id) on delete restrict,
  conflict_type text not null check (char_length(trim(conflict_type)) between 2 and 120),
  status public.service_conflict_status not null default 'OPEN',
  candidate_evidence_a_id uuid not null references public.official_service_evidence(id) on delete restrict,
  candidate_evidence_b_id uuid not null references public.official_service_evidence(id) on delete restrict,
  summary text not null check (char_length(trim(summary)) between 3 and 3000),
  resolution text,
  detected_at timestamptz not null default now(),
  detected_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_data_conflicts_distinct_evidence check (
    candidate_evidence_a_id <> candidate_evidence_b_id
  ),
  constraint service_data_conflicts_one_target check (num_nonnulls(
    representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
    contact_channel_id, fee_id, requirement_id, appointment_id,
    service_hours_id, service_hour_exception_id, official_service_event_id
  ) = 1),
  constraint service_data_conflicts_review_audit check (
    status = 'OPEN' or (reviewed_by is not null and reviewed_at is not null and resolution is not null)
  )
);
create index service_data_conflicts_open_idx
  on public.service_data_conflicts (status, detected_at desc) where status = 'OPEN';
create index service_data_conflicts_office_idx on public.service_data_conflicts (representative_office_id, status) where representative_office_id is not null;
create index service_data_conflicts_jurisdiction_idx on public.service_data_conflicts (office_jurisdiction_id, status) where office_jurisdiction_id is not null;
create index service_data_conflicts_location_alias_idx on public.service_data_conflicts (location_alias_id, status) where location_alias_id is not null;
create index service_data_conflicts_mission_service_idx on public.service_data_conflicts (mission_service_id, status) where mission_service_id is not null;
create index service_data_conflicts_contact_idx on public.service_data_conflicts (contact_channel_id, status) where contact_channel_id is not null;
create index service_data_conflicts_fee_idx on public.service_data_conflicts (fee_id, status) where fee_id is not null;
create index service_data_conflicts_requirement_idx on public.service_data_conflicts (requirement_id, status) where requirement_id is not null;
create index service_data_conflicts_appointment_idx on public.service_data_conflicts (appointment_id, status) where appointment_id is not null;
create index service_data_conflicts_hours_idx on public.service_data_conflicts (service_hours_id, status) where service_hours_id is not null;
create index service_data_conflicts_hour_exception_idx on public.service_data_conflicts (service_hour_exception_id, status) where service_hour_exception_id is not null;
create index service_data_conflicts_event_idx on public.service_data_conflicts (official_service_event_id, status) where official_service_event_id is not null;

create table public.user_service_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete restrict,
  representative_office_id uuid references public.representative_offices(id) on delete restrict,
  office_jurisdiction_id uuid references public.office_jurisdictions(id) on delete restrict,
  location_alias_id uuid references public.location_aliases(id) on delete restrict,
  mission_service_id uuid references public.mission_services(id) on delete restrict,
  contact_channel_id uuid references public.office_contact_channels(id) on delete restrict,
  fee_id uuid references public.mission_service_fees(id) on delete restrict,
  requirement_id uuid references public.mission_service_requirements(id) on delete restrict,
  appointment_id uuid references public.mission_appointments(id) on delete restrict,
  service_hours_id uuid references public.mission_service_hours(id) on delete restrict,
  service_hour_exception_id uuid references public.mission_service_hour_exceptions(id) on delete restrict,
  official_service_event_id uuid references public.official_service_events(id) on delete restrict,
  report_category public.user_service_report_category not null,
  description text not null check (char_length(trim(description)) between 10 and 2000),
  status public.user_service_report_status not null default 'NEW',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_service_reports_one_target check (num_nonnulls(
    representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
    contact_channel_id, fee_id, requirement_id, appointment_id,
    service_hours_id, service_hour_exception_id, official_service_event_id
  ) = 1),
  constraint user_service_reports_review_audit check (
    status in ('NEW', 'REVIEWING')
    or (reviewed_by is not null and reviewed_at is not null and resolution is not null)
  )
);
create index user_service_reports_owner_idx
  on public.user_service_reports (reporter_id, created_at desc);
create index user_service_reports_review_idx
  on public.user_service_reports (status, created_at);

create or replace function private.can_manage_mission_service(target_mission_service_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.mission_services service
    join public.representative_offices office on office.id = service.office_id
    where service.id = target_mission_service_id
      and private.can_manage_country(office.country_code)
  );
$$;
revoke all on function private.can_manage_mission_service(uuid) from public;
grant execute on function private.can_manage_mission_service(uuid) to authenticated;

create or replace function private.can_manage_service_target(
  target_representative_office_id uuid,
  target_office_jurisdiction_id uuid,
  target_location_alias_id uuid,
  target_mission_service_id uuid,
  target_contact_channel_id uuid,
  target_fee_id uuid,
  target_requirement_id uuid,
  target_appointment_id uuid,
  target_service_hours_id uuid,
  target_service_hour_exception_id uuid,
  target_official_service_event_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (target_representative_office_id is not null and private.can_manage_office(target_representative_office_id))
    or (target_office_jurisdiction_id is not null and exists (
      select 1 from public.office_jurisdictions jurisdiction
      where jurisdiction.id = target_office_jurisdiction_id
        and private.can_manage_country(jurisdiction.country_code)
    ))
    or (target_location_alias_id is not null and exists (
      select 1 from public.location_aliases alias
      where alias.id = target_location_alias_id
        and private.can_manage_country(alias.country_code)
    ))
    or (target_mission_service_id is not null and private.can_manage_mission_service(target_mission_service_id))
    or (target_contact_channel_id is not null and exists (
      select 1 from public.office_contact_channels channel
      where channel.id = target_contact_channel_id and private.can_manage_office(channel.office_id)
    ))
    or (target_fee_id is not null and exists (
      select 1 from public.mission_service_fees fee
      where fee.id = target_fee_id and private.can_manage_mission_service(fee.mission_service_id)
    ))
    or (target_requirement_id is not null and exists (
      select 1 from public.mission_service_requirements requirement
      where requirement.id = target_requirement_id
        and private.can_manage_mission_service(requirement.mission_service_id)
    ))
    or (target_appointment_id is not null and exists (
      select 1 from public.mission_appointments appointment
      where appointment.id = target_appointment_id and private.can_manage_office(appointment.office_id)
    ))
    or (target_service_hours_id is not null and exists (
      select 1 from public.mission_service_hours hours
      where hours.id = target_service_hours_id and private.can_manage_office(hours.office_id)
    ))
    or (target_service_hour_exception_id is not null and exists (
      select 1 from public.mission_service_hour_exceptions exception
      where exception.id = target_service_hour_exception_id and private.can_manage_office(exception.office_id)
    ))
    or (target_official_service_event_id is not null and exists (
      select 1 from public.official_service_events event
      where event.id = target_official_service_event_id
        and private.can_manage_country(event.country_code)
    ));
$$;
revoke all on function private.can_manage_service_target(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) from public;
grant execute on function private.can_manage_service_target(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) to authenticated;

create or replace function private.service_evidence_matches_target(
  target_evidence_id uuid,
  target_representative_office_id uuid,
  target_office_jurisdiction_id uuid,
  target_location_alias_id uuid,
  target_mission_service_id uuid,
  target_contact_channel_id uuid,
  target_fee_id uuid,
  target_requirement_id uuid,
  target_appointment_id uuid,
  target_service_hours_id uuid,
  target_service_hour_exception_id uuid,
  target_official_service_event_id uuid
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.official_service_evidence evidence
    where evidence.id = target_evidence_id
      and evidence.representative_office_id is not distinct from target_representative_office_id
      and evidence.office_jurisdiction_id is not distinct from target_office_jurisdiction_id
      and evidence.location_alias_id is not distinct from target_location_alias_id
      and evidence.mission_service_id is not distinct from target_mission_service_id
      and evidence.contact_channel_id is not distinct from target_contact_channel_id
      and evidence.fee_id is not distinct from target_fee_id
      and evidence.requirement_id is not distinct from target_requirement_id
      and evidence.appointment_id is not distinct from target_appointment_id
      and evidence.service_hours_id is not distinct from target_service_hours_id
      and evidence.service_hour_exception_id is not distinct from target_service_hour_exception_id
      and evidence.official_service_event_id is not distinct from target_official_service_event_id
  );
$$;
revoke all on function private.service_evidence_matches_target(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) from public;
grant execute on function private.service_evidence_matches_target(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid
) to authenticated;

alter table public.service_verification_events
  add constraint service_verification_events_verified_evidence_required check (
    event_type not in ('VERIFIED', 'REVERIFIED') or evidence_id is not null
  ),
  add constraint service_verification_events_evidence_matches_target check (
    evidence_id is null or private.service_evidence_matches_target(
      evidence_id, representative_office_id, office_jurisdiction_id,
      location_alias_id, mission_service_id, contact_channel_id, fee_id,
      requirement_id, appointment_id, service_hours_id,
      service_hour_exception_id, official_service_event_id
    )
  );

alter table public.service_data_conflicts
  add constraint service_data_conflicts_evidence_a_matches_target check (
    private.service_evidence_matches_target(
      candidate_evidence_a_id, representative_office_id, office_jurisdiction_id,
      location_alias_id, mission_service_id, contact_channel_id, fee_id,
      requirement_id, appointment_id, service_hours_id,
      service_hour_exception_id, official_service_event_id
    )
  ),
  add constraint service_data_conflicts_evidence_b_matches_target check (
    private.service_evidence_matches_target(
      candidate_evidence_b_id, representative_office_id, office_jurisdiction_id,
      location_alias_id, mission_service_id, contact_channel_id, fee_id,
      requirement_id, appointment_id, service_hours_id,
      service_hour_exception_id, official_service_event_id
    )
  );

create or replace function private.has_approved_service_evidence(
  target_kind text,
  target_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.official_service_evidence evidence
    join public.official_sources source on source.id = evidence.official_source_id
    left join public.official_source_items item on item.id = evidence.official_source_item_id
    where source.enabled
      and source.registry_status = 'VERIFIED'
      and source.verification_level in ('A', 'B')
      and (evidence.official_source_item_id is null or item.verified_source)
      and case target_kind
        when 'representative_office' then evidence.representative_office_id = target_id
        when 'office_jurisdiction' then evidence.office_jurisdiction_id = target_id
        when 'location_alias' then evidence.location_alias_id = target_id
        when 'mission_service' then evidence.mission_service_id = target_id
        when 'contact_channel' then evidence.contact_channel_id = target_id
        when 'fee' then evidence.fee_id = target_id
        when 'requirement' then evidence.requirement_id = target_id
        when 'appointment' then evidence.appointment_id = target_id
        when 'service_hours' then evidence.service_hours_id = target_id
        when 'service_hour_exception' then evidence.service_hour_exception_id = target_id
        when 'official_service_event' then evidence.official_service_event_id = target_id
        else false
      end
  );
$$;
revoke all on function private.has_approved_service_evidence(text, uuid) from public;
grant execute on function private.has_approved_service_evidence(text, uuid) to anon, authenticated;

create or replace function private.has_open_service_conflict(
  target_kind text,
  target_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.service_data_conflicts conflict
    where conflict.status = 'OPEN'
      and case target_kind
        when 'representative_office' then conflict.representative_office_id = target_id
        when 'office_jurisdiction' then conflict.office_jurisdiction_id = target_id
        when 'location_alias' then conflict.location_alias_id = target_id
        when 'mission_service' then conflict.mission_service_id = target_id
        when 'contact_channel' then conflict.contact_channel_id = target_id
        when 'fee' then conflict.fee_id = target_id
        when 'requirement' then conflict.requirement_id = target_id
        when 'appointment' then conflict.appointment_id = target_id
        when 'service_hours' then conflict.service_hours_id = target_id
        when 'service_hour_exception' then conflict.service_hour_exception_id = target_id
        when 'official_service_event' then conflict.official_service_event_id = target_id
        else false
      end
  );
$$;
revoke all on function private.has_open_service_conflict(text, uuid) from public;
grant execute on function private.has_open_service_conflict(text, uuid) to anon, authenticated;

create or replace function private.has_newer_current_fee(target_fee_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.mission_service_fees target
    join public.mission_service_fees newer
      on newer.mission_service_id = target.mission_service_id
     and lower(btrim(newer.fee_label)) = lower(btrim(target.fee_label))
     and newer.id <> target.id
     and newer.enabled
     and newer.superseded_by is null
     and newer.verification_status = 'verified'
     and newer.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
     and newer.effective_from > target.effective_from
     and (newer.effective_until is null or newer.effective_until > now())
    where target.id = target_fee_id
  );
$$;
revoke all on function private.has_newer_current_fee(uuid) from public;
grant execute on function private.has_newer_current_fee(uuid) to anon, authenticated;
grant usage on schema private to anon;

create trigger location_aliases_set_updated_at before update on public.location_aliases for each row execute function private.set_updated_at();
create trigger mission_services_set_updated_at before update on public.mission_services for each row execute function private.set_updated_at();
create trigger mission_service_fees_set_updated_at before update on public.mission_service_fees for each row execute function private.set_updated_at();
create trigger mission_service_requirements_set_updated_at before update on public.mission_service_requirements for each row execute function private.set_updated_at();
create trigger mission_appointments_set_updated_at before update on public.mission_appointments for each row execute function private.set_updated_at();
create trigger mission_service_hours_set_updated_at before update on public.mission_service_hours for each row execute function private.set_updated_at();
create trigger mission_service_hour_exceptions_set_updated_at before update on public.mission_service_hour_exceptions for each row execute function private.set_updated_at();
create trigger official_service_events_set_updated_at before update on public.official_service_events for each row execute function private.set_updated_at();
create trigger service_data_conflicts_set_updated_at before update on public.service_data_conflicts for each row execute function private.set_updated_at();
create trigger user_service_reports_set_updated_at before update on public.user_service_reports for each row execute function private.set_updated_at();

alter table public.location_aliases enable row level security;
alter table public.mission_services enable row level security;
alter table public.mission_service_fees enable row level security;
alter table public.mission_service_requirements enable row level security;
alter table public.mission_appointments enable row level security;
alter table public.mission_service_hours enable row level security;
alter table public.mission_service_hour_exceptions enable row level security;
alter table public.official_service_events enable row level security;
alter table public.official_service_event_services enable row level security;
alter table public.official_service_evidence enable row level security;
alter table public.service_verification_events enable row level security;
alter table public.service_data_conflicts enable row level security;
alter table public.user_service_reports enable row level security;

create policy "Layanan restricts public office reads" on public.representative_offices
as restrictive
for select to anon, authenticated using (
  private.can_manage_country(country_code)
);

create policy "Layanan restricts public jurisdiction reads" on public.office_jurisdictions
as restrictive
for select to anon, authenticated using (
  private.can_manage_country(country_code)
);

create policy "Layanan restricts direct service category reads" on public.service_categories
as restrictive
for select to anon, authenticated using (
  private.is_platform_admin()
);

create policy "Layanan restricts public contact channel reads" on public.office_contact_channels
as restrictive
for select to anon, authenticated using (
  private.can_manage_office(office_id)
);

create policy "Admins manage location aliases" on public.location_aliases
for all to authenticated using (private.can_manage_country(country_code))
with check (private.can_manage_country(country_code));

create policy "Admins manage mission services" on public.mission_services
for all to authenticated using (private.can_manage_office(office_id))
with check (private.can_manage_office(office_id));

create policy "Admins manage mission service fees" on public.mission_service_fees
for all to authenticated using (private.can_manage_mission_service(mission_service_id))
with check (private.can_manage_mission_service(mission_service_id));

create policy "Admins manage mission service requirements" on public.mission_service_requirements
for all to authenticated using (private.can_manage_mission_service(mission_service_id))
with check (private.can_manage_mission_service(mission_service_id));

create policy "Admins manage mission appointments" on public.mission_appointments
for all to authenticated using (private.can_manage_office(office_id))
with check (private.can_manage_office(office_id));

create policy "Admins manage mission service hours" on public.mission_service_hours
for all to authenticated using (private.can_manage_office(office_id))
with check (private.can_manage_office(office_id));

create policy "Admins manage mission service hour exceptions" on public.mission_service_hour_exceptions
for all to authenticated using (private.can_manage_office(office_id))
with check (private.can_manage_office(office_id));

create policy "Admins manage official service events" on public.official_service_events
for all to authenticated using (private.can_manage_country(country_code))
with check (private.can_manage_country(country_code));

create policy "Admins manage official event services" on public.official_service_event_services
for all to authenticated using (exists (
  select 1 from public.official_service_events event
  where event.id = event_id and private.can_manage_country(event.country_code)
)) with check (exists (
  select 1 from public.official_service_events event
  where event.id = event_id and private.can_manage_country(event.country_code)
));

create policy "Admins manage official service evidence" on public.official_service_evidence
for all to authenticated using (
  private.can_manage_source(official_source_id)
  and private.can_manage_service_target(
    representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
    contact_channel_id, fee_id, requirement_id, appointment_id,
    service_hours_id, service_hour_exception_id, official_service_event_id
  )
) with check (
  private.can_manage_source(official_source_id)
  and private.can_manage_service_target(
    representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
    contact_channel_id, fee_id, requirement_id, appointment_id,
    service_hours_id, service_hour_exception_id, official_service_event_id
  )
);
create policy "Admins read service verification history" on public.service_verification_events
for select to authenticated using (private.can_manage_service_target(
  representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
  contact_channel_id, fee_id, requirement_id, appointment_id,
  service_hours_id, service_hour_exception_id, official_service_event_id
));
create policy "Admins append service verification history" on public.service_verification_events
for insert to authenticated with check (
  actor_id = auth.uid()
  and private.can_manage_service_target(
    representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
    contact_channel_id, fee_id, requirement_id, appointment_id,
    service_hours_id, service_hour_exception_id, official_service_event_id
  )
);
create policy "Admins manage service data conflicts" on public.service_data_conflicts
for all to authenticated using (private.can_manage_service_target(
  representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
  contact_channel_id, fee_id, requirement_id, appointment_id,
  service_hours_id, service_hour_exception_id, official_service_event_id
)) with check (private.can_manage_service_target(
  representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
  contact_channel_id, fee_id, requirement_id, appointment_id,
  service_hours_id, service_hour_exception_id, official_service_event_id
));

create policy "Users read own service reports" on public.user_service_reports
for select to authenticated using (reporter_id = auth.uid());
create policy "Users submit own new service reports" on public.user_service_reports
for insert to authenticated with check (
  reporter_id = auth.uid() and status = 'NEW'
  and reviewed_by is null and reviewed_at is null and resolution is null
);
create policy "Country admins review service reports" on public.user_service_reports
for all to authenticated using (private.can_manage_service_target(
  representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
  contact_channel_id, fee_id, requirement_id, appointment_id,
  service_hours_id, service_hour_exception_id, official_service_event_id
)) with check (private.can_manage_service_target(
  representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
  contact_channel_id, fee_id, requirement_id, appointment_id,
 service_hours_id, service_hour_exception_id, official_service_event_id
));

create or replace function private.is_layanan_public_office(target_office_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.representative_offices office
    where office.id = target_office_id
      and office.is_active and not office.is_demo and office.enabled
      and office.verification_status = 'verified'
      and office.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
      and (office.effective_from is null or office.effective_from <= now())
      and (office.effective_until is null or office.effective_until > now())
      and private.has_approved_service_evidence('representative_office', office.id)
      and not private.has_open_service_conflict('representative_office', office.id)
  );
$$;
revoke all on function private.is_layanan_public_office(uuid) from public;

create or replace function private.is_layanan_public_mission_service(
  target_service_id uuid,
  target_office_id uuid default null,
  target_service_category_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.mission_services service
    join public.service_categories category on category.id = service.service_category_id
    where service.id = target_service_id
      and (target_office_id is null or service.office_id = target_office_id)
      and (target_service_category_id is null or service.service_category_id = target_service_category_id)
      and service.enabled and category.is_active and not category.is_demo
      and service.verification_status = 'verified'
      and service.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
      and (service.effective_from is null or service.effective_from <= now())
      and (service.effective_until is null or service.effective_until > now())
      and private.has_approved_service_evidence('mission_service', service.id)
      and not private.has_open_service_conflict('mission_service', service.id)
      and private.is_layanan_public_office(service.office_id)
  );
$$;
revoke all on function private.is_layanan_public_mission_service(uuid, uuid, uuid) from public;

create or replace function private.read_layanan_public_offices()
returns table (
  id uuid, mission_code text, country_code text, name text,
  office_type public.office_type, city text, address text,
  latitude numeric, longitude numeric, last_verified_at timestamptz,
  source_name text, evidence_url text
)
language sql stable security definer set search_path = ''
as $$
  select office.id, office.mission_code, office.country_code, office.name,
    office.office_type, office.city, office.address, office.latitude,
    office.longitude, office.last_verified_at,
    provenance.source_name, provenance.evidence_url
  from public.representative_offices office
  join lateral (
    select source.name as source_name, evidence.evidence_url
    from public.official_service_evidence evidence
    join public.official_sources source on source.id = evidence.official_source_id
    left join public.official_source_items item on item.id = evidence.official_source_item_id
    where evidence.representative_office_id = office.id
      and source.enabled and source.registry_status = 'VERIFIED'
      and source.verification_level in ('A', 'B')
      and (evidence.official_source_item_id is null or item.verified_source)
    order by evidence.created_at desc, evidence.id
    limit 1
  ) provenance on true
  where private.is_layanan_public_office(office.id);
$$;

create or replace function private.read_layanan_public_jurisdictions()
returns table (
  id uuid, office_id uuid, country_code text, state_name text,
  state_normalized text, district_name text, district_normalized text,
  jurisdiction_type public.jurisdiction_type, routing_priority smallint
)
language sql stable security definer set search_path = ''
as $$
  select jurisdiction.id, jurisdiction.office_id, jurisdiction.country_code,
    jurisdiction.state_name, jurisdiction.state_normalized,
    jurisdiction.district_name, jurisdiction.district_normalized,
    jurisdiction.jurisdiction_type, jurisdiction.routing_priority
  from public.office_jurisdictions jurisdiction
  where not jurisdiction.is_demo and jurisdiction.enabled
    and jurisdiction.verification_status = 'verified'
    and jurisdiction.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    and (jurisdiction.effective_from is null or jurisdiction.effective_from <= now())
    and (jurisdiction.effective_until is null or jurisdiction.effective_until > now())
    and private.is_layanan_public_office(jurisdiction.office_id)
    and private.has_approved_service_evidence('office_jurisdiction', jurisdiction.id)
    and not private.has_open_service_conflict('office_jurisdiction', jurisdiction.id);
$$;

create or replace function private.read_layanan_public_mission_services()
returns table (
  id uuid, office_id uuid, service_category_id uuid, service_code text,
  slug text, name text, intent_group text, appointment_required boolean,
  walk_in_allowed boolean
)
language sql stable security definer set search_path = ''
as $$
  select service.id, service.office_id, service.service_category_id,
    category.service_code, category.slug, category.name, category.intent_group,
    service.appointment_required, service.walk_in_allowed
  from public.mission_services service
  join public.service_categories category on category.id = service.service_category_id
  where private.is_layanan_public_mission_service(service.id);
$$;

create or replace function private.read_layanan_public_contact_channels()
returns table (
  id uuid, office_id uuid, country_code text, service_category_id uuid,
  channel_type public.contact_channel_type, label text, raw_value text,
  normalized_value text, e164_phone text, url text,
  purpose public.channel_purpose, display_order smallint,
  fallback_priority smallint, last_verified_at timestamptz,
  source_name text, evidence_url text
)
language sql stable security definer set search_path = ''
as $$
  select channel.id, channel.office_id, office.country_code, channel.service_category_id,
    channel.channel_type, channel.label, channel.raw_value,
    channel.normalized_value, channel.e164_phone, channel.url,
    channel.purpose, channel.display_order, channel.fallback_priority,
    channel.last_verified_at, provenance.source_name, provenance.evidence_url
  from public.office_contact_channels channel
  join public.representative_offices office on office.id = channel.office_id
  join lateral (
    select source.name as source_name, evidence.evidence_url
    from public.official_service_evidence evidence
    join public.official_sources source on source.id = evidence.official_source_id
    left join public.official_source_items item on item.id = evidence.official_source_item_id
    where evidence.contact_channel_id = channel.id
      and source.enabled and source.registry_status = 'VERIFIED'
      and source.verification_level in ('A', 'B')
      and (evidence.official_source_item_id is null or item.verified_source)
    order by evidence.created_at desc, evidence.id
    limit 1
  ) provenance on true
  where channel.is_active and not channel.is_demo and channel.enabled
    and channel.verification_status = 'verified'
    and channel.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    and (channel.effective_from is null or channel.effective_from <= now())
    and (channel.effective_until is null or channel.effective_until > now())
    and private.is_layanan_public_office(channel.office_id)
    and (
      channel.purpose <> 'SERVICE_SPECIFIC'
      or exists (
        select 1 from public.mission_services service
        where service.office_id = channel.office_id
          and service.service_category_id = channel.service_category_id
          and private.is_layanan_public_mission_service(service.id)
      )
    )
    and private.has_approved_service_evidence('contact_channel', channel.id)
    and not private.has_open_service_conflict('contact_channel', channel.id);
$$;

create or replace function private.read_layanan_public_fees()
returns table (
  id uuid, mission_service_id uuid, fee_label text, amount numeric,
  currency character(3), is_free boolean,
  publishability_status public.service_publishability_status,
  effective_from timestamptz, effective_until timestamptz,
  requires_date_uncertain_disclaimer boolean
)
language sql stable security definer set search_path = ''
as $$
  select fee.id, fee.mission_service_id, fee.fee_label, fee.amount,
    fee.currency, fee.is_free, fee.publishability_status,
    fee.effective_from, fee.effective_until,
    fee.publishability_status = 'OFFICIAL_BUT_DATE_UNCERTAIN'
  from public.mission_service_fees fee
  where fee.enabled and fee.verification_status = 'verified'
    and fee.publishability_status in (
      'VERIFIED_CURRENT', 'VERIFIED_OFFICIAL', 'OFFICIAL_BUT_DATE_UNCERTAIN'
    )
    and fee.effective_from <= now()
    and (fee.effective_until is null or fee.effective_until > now())
    and fee.superseded_by is null
    and not private.has_newer_current_fee(fee.id)
    and private.is_layanan_public_mission_service(fee.mission_service_id)
    and private.has_approved_service_evidence('fee', fee.id)
    and not private.has_open_service_conflict('fee', fee.id);
$$;

create or replace function private.read_layanan_public_requirements()
returns table (
  id uuid, mission_service_id uuid, requirement_order smallint,
  requirement_text text, effective_from timestamptz, effective_until timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select requirement.id, requirement.mission_service_id,
    requirement.requirement_order, requirement.requirement_text,
    requirement.effective_from, requirement.effective_until
  from public.mission_service_requirements requirement
  where requirement.enabled and requirement.verification_status = 'verified'
    and requirement.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    and (requirement.effective_from is null or requirement.effective_from <= now())
    and (requirement.effective_until is null or requirement.effective_until > now())
    and private.is_layanan_public_mission_service(requirement.mission_service_id)
    and private.has_approved_service_evidence('requirement', requirement.id)
    and not private.has_open_service_conflict('requirement', requirement.id);
$$;

create or replace function private.read_layanan_public_appointments()
returns table (
  id uuid, office_id uuid, service_category_id uuid,
  appointment_type public.appointment_type, label text, url text,
  contact_channel_id uuid, instructions text
)
language sql stable security definer set search_path = ''
as $$
  select appointment.id, appointment.office_id,
    appointment.service_category_id, appointment.appointment_type,
    appointment.label, appointment.url, appointment.contact_channel_id,
    appointment.instructions
  from public.mission_appointments appointment
  where appointment.enabled and appointment.verification_status = 'verified'
    and appointment.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    and (appointment.effective_from is null or appointment.effective_from <= now())
    and (appointment.effective_until is null or appointment.effective_until > now())
    and private.is_layanan_public_office(appointment.office_id)
    and (
      appointment.service_category_id is null
      or exists (
        select 1 from public.mission_services service
        where service.office_id = appointment.office_id
          and service.service_category_id = appointment.service_category_id
          and private.is_layanan_public_mission_service(service.id)
      )
    )
    and private.has_approved_service_evidence('appointment', appointment.id)
    and not private.has_open_service_conflict('appointment', appointment.id);
$$;

create or replace function private.read_layanan_public_hours()
returns table (
  id uuid, office_id uuid, service_category_id uuid,
  day_of_week smallint, opens_at time, closes_at time, timezone text,
  effective_from date, effective_until date
)
language sql stable security definer set search_path = ''
as $$
  select hours.id, hours.office_id, hours.service_category_id,
    hours.day_of_week, hours.opens_at, hours.closes_at, hours.timezone,
    hours.effective_from, hours.effective_until
  from public.mission_service_hours hours
  where hours.enabled and hours.verification_status = 'verified'
    and hours.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    and (hours.effective_from is null or hours.effective_from <= current_date)
    and (hours.effective_until is null or hours.effective_until >= current_date)
    and private.is_layanan_public_office(hours.office_id)
    and (
      hours.service_category_id is null
      or exists (
        select 1 from public.mission_services service
        where service.office_id = hours.office_id
          and service.service_category_id = hours.service_category_id
          and private.is_layanan_public_mission_service(service.id)
      )
    )
    and private.has_approved_service_evidence('service_hours', hours.id)
    and not private.has_open_service_conflict('service_hours', hours.id);
$$;

create or replace function private.read_layanan_public_hour_exceptions()
returns table (
  id uuid, office_id uuid, service_category_id uuid,
  exception_date date, is_closed boolean, opens_at time,
  closes_at time, label text
)
language sql stable security definer set search_path = ''
as $$
  select exception.id, exception.office_id, exception.service_category_id,
    exception.exception_date, exception.is_closed, exception.opens_at,
    exception.closes_at, exception.label
  from public.mission_service_hour_exceptions exception
  where exception.enabled and exception.verification_status = 'verified'
    and exception.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    and exception.exception_date >= current_date
    and private.is_layanan_public_office(exception.office_id)
    and (
      exception.service_category_id is null
      or exists (
        select 1 from public.mission_services service
        where service.office_id = exception.office_id
          and service.service_category_id = exception.service_category_id
          and private.is_layanan_public_mission_service(service.id)
      )
    )
    and private.has_approved_service_evidence('service_hour_exception', exception.id)
    and not private.has_open_service_conflict('service_hour_exception', exception.id);
$$;

create or replace function private.read_layanan_public_events()
returns table (
  id uuid, office_id uuid, event_type public.official_service_event_type,
  title text, description text, venue_name text, address text,
  country_code text, state_name text, state_normalized text,
  district_name text, district_normalized text, starts_at timestamptz,
  ends_at timestamptz, registration_url text, contact_channel_id uuid
)
language sql stable security definer set search_path = ''
as $$
  select event.id, event.office_id, event.event_type, event.title,
    event.description, event.venue_name, event.address, event.country_code,
    event.state_name, event.state_normalized, event.district_name,
    event.district_normalized, event.starts_at, event.ends_at,
    event.registration_url, event.contact_channel_id
  from public.official_service_events event
  where event.enabled and event.verification_status = 'verified'
    and event.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    and (event.effective_until is null or event.effective_until > now())
    and private.is_layanan_public_office(event.office_id)
    and private.has_approved_service_evidence('official_service_event', event.id)
    and not private.has_open_service_conflict('official_service_event', event.id);
$$;

create or replace function private.read_layanan_public_event_services()
returns table (event_id uuid, service_category_id uuid)
language sql stable security definer set search_path = ''
as $$
  select mapping.event_id, mapping.service_category_id
  from public.official_service_event_services mapping
  join public.official_service_events event on event.id = mapping.event_id
  join public.mission_services service
    on service.office_id = event.office_id
   and service.service_category_id = mapping.service_category_id
  where event.enabled and event.verification_status = 'verified'
    and event.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    and (event.effective_until is null or event.effective_until > now())
    and private.is_layanan_public_office(event.office_id)
    and private.is_layanan_public_mission_service(service.id)
    and private.has_approved_service_evidence('official_service_event', event.id)
    and not private.has_open_service_conflict('official_service_event', event.id);
$$;

revoke all on function private.read_layanan_public_offices() from public;
revoke all on function private.read_layanan_public_jurisdictions() from public;
revoke all on function private.read_layanan_public_mission_services() from public;
revoke all on function private.read_layanan_public_contact_channels() from public;
revoke all on function private.read_layanan_public_fees() from public;
revoke all on function private.read_layanan_public_requirements() from public;
revoke all on function private.read_layanan_public_appointments() from public;
revoke all on function private.read_layanan_public_hours() from public;
revoke all on function private.read_layanan_public_hour_exceptions() from public;
revoke all on function private.read_layanan_public_events() from public;
revoke all on function private.read_layanan_public_event_services() from public;
grant execute on function private.read_layanan_public_offices() to anon, authenticated;
grant execute on function private.read_layanan_public_jurisdictions() to anon, authenticated;
grant execute on function private.read_layanan_public_mission_services() to anon, authenticated;
grant execute on function private.read_layanan_public_contact_channels() to anon, authenticated;
grant execute on function private.read_layanan_public_fees() to anon, authenticated;
grant execute on function private.read_layanan_public_requirements() to anon, authenticated;
grant execute on function private.read_layanan_public_appointments() to anon, authenticated;
grant execute on function private.read_layanan_public_hours() to anon, authenticated;
grant execute on function private.read_layanan_public_hour_exceptions() to anon, authenticated;
grant execute on function private.read_layanan_public_events() to anon, authenticated;
grant execute on function private.read_layanan_public_event_services() to anon, authenticated;

create view public.layanan_public_offices
with (security_invoker = true)
as
select * from private.read_layanan_public_offices();

create view public.layanan_public_jurisdictions
with (security_invoker = true)
as
select * from private.read_layanan_public_jurisdictions();

create view public.layanan_public_mission_services
with (security_invoker = true)
as
select * from private.read_layanan_public_mission_services();

create view public.layanan_public_contact_channels
with (security_invoker = true)
as
select * from private.read_layanan_public_contact_channels();

create view public.layanan_public_fees
with (security_invoker = true)
as
select * from private.read_layanan_public_fees();

create view public.layanan_public_requirements
with (security_invoker = true)
as
select * from private.read_layanan_public_requirements();

create view public.layanan_public_appointments
with (security_invoker = true)
as
select * from private.read_layanan_public_appointments();

create view public.layanan_public_hours
with (security_invoker = true)
as
select * from private.read_layanan_public_hours();

create view public.layanan_public_hour_exceptions
with (security_invoker = true)
as
select * from private.read_layanan_public_hour_exceptions();

create view public.layanan_public_events
with (security_invoker = true)
as
select * from private.read_layanan_public_events();

create view public.layanan_public_event_services
with (security_invoker = true)
as
select * from private.read_layanan_public_event_services();

create or replace function public.resolve_wni_service_route(
  requested_country_code text,
  requested_state text,
  requested_district text,
  requested_service_code text
)
returns table (
  routing_status text,
  jurisdiction_id uuid,
  office_id uuid,
  mission_code text,
  mission_service_id uuid,
  routing_explanation text
)
language sql
stable
security definer
set search_path = ''
as $$
  with normalized_input as (
    select
      upper(trim(requested_country_code)) as country_code,
      regexp_replace(lower(trim(requested_state)), '\s+', ' ', 'g') as state_key,
      nullif(regexp_replace(lower(trim(coalesce(requested_district, ''))), '\s+', ' ', 'g'), '') as district_key,
      upper(trim(requested_service_code)) as service_code
  ), resolved_input as (
    select
      input.country_code,
      coalesce(alias.canonical_state_normalized, input.state_key) as state_key,
      coalesce(alias.canonical_district_normalized, input.district_key) as district_key,
      input.service_code
    from normalized_input input
    left join public.location_aliases alias
      on alias.country_code = input.country_code
     and alias.alias_normalized = coalesce(input.district_key, input.state_key)
     and alias.enabled
     and alias.verification_status = 'verified'
     and alias.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
     and private.has_approved_service_evidence('location_alias', alias.id)
     and not private.has_open_service_conflict('location_alias', alias.id)
  ), candidates as (
    select jurisdiction.*
    from public.layanan_public_jurisdictions jurisdiction
    cross join resolved_input input
    where jurisdiction.country_code = input.country_code
      and jurisdiction.state_normalized = input.state_key
      and (
        (input.district_key is not null and jurisdiction.district_normalized = input.district_key)
        or (input.district_key is null and jurisdiction.district_normalized is null)
      )
  ), candidate_count as (
    select count(*)::integer as total from candidates
  ), selected as (
    select candidate.* from candidates candidate
    order by candidate.routing_priority, candidate.id
    limit 1
  ), matched_service as (
    select service.*
    from public.layanan_public_mission_services service
    join selected jurisdiction on jurisdiction.office_id = service.office_id
    cross join resolved_input input
    where service.service_code = input.service_code
    limit 1
  )
  select
    case
      when count.total = 0 then
        case when input.state_key = 'sabah'
          then 'AMBIGUOUS_JURISDICTION' else 'NO_JURISDICTION' end
      when count.total > 1 then 'AMBIGUOUS_JURISDICTION'
      when service.id is null then 'SERVICE_UNAVAILABLE'
      else 'ROUTED'
    end,
    case when count.total = 1 then jurisdiction.id else null end,
    case when count.total = 1 then jurisdiction.office_id else null end,
    case when count.total = 1 then office.mission_code else null end,
    case when count.total = 1 then service.id else null end,
    case
      when input.state_key = 'sabah' and input.district_key is null
        then 'Anda berada di daerah mana di Sabah?'
      when input.state_key = 'sabah' and count.total = 0
        then 'Daerah Sabah tidak dapat dicocokkan dengan yakin; jangan menebak.'
      when count.total = 0 then 'Tidak ada yurisdiksi terverifikasi yang cocok.'
      when count.total > 1 then 'Lokasi cocok dengan lebih dari satu yurisdiksi; jangan menebak.'
      when service.id is null then 'Kantor ditemukan, tetapi layanan terverifikasi belum tersedia.'
      else 'Rute dipilih berdasarkan yurisdiksi resmi, bukan jarak geografis.'
    end
  from resolved_input input
  cross join candidate_count count
  left join selected jurisdiction on true
  left join public.layanan_public_offices office on office.id = jurisdiction.office_id
  left join matched_service service on true;
$$;
revoke all on function public.resolve_wni_service_route(text, text, text, text) from public;
grant execute on function public.resolve_wni_service_route(text, text, text, text) to anon, authenticated;

revoke all on public.location_aliases, public.mission_services,
  public.mission_service_fees, public.mission_service_requirements,
  public.mission_appointments, public.mission_service_hours,
  public.mission_service_hour_exceptions, public.official_service_events,
  public.official_service_event_services, public.official_service_evidence,
  public.service_verification_events, public.service_data_conflicts,
  public.user_service_reports from anon, authenticated;

grant insert, update on public.location_aliases, public.mission_services,
  public.mission_service_fees, public.mission_service_requirements,
  public.mission_appointments, public.mission_service_hours,
  public.mission_service_hour_exceptions, public.official_service_events,
  public.service_data_conflicts to authenticated;
grant insert on public.official_service_event_services,
  public.official_service_evidence to authenticated;
grant select on public.official_service_evidence,
  public.service_verification_events, public.service_data_conflicts to authenticated;
grant insert on public.service_verification_events to authenticated;
grant select, insert, update on public.user_service_reports to authenticated;

revoke select on public.representative_offices, public.office_jurisdictions,
  public.service_categories, public.office_contact_channels from anon, authenticated;
grant select (
  id, country_code, name, office_type, source_id, verification_status,
  last_verified_at, is_active, is_demo
) on public.representative_offices to authenticated;
grant select (
  id, office_id, country_code, state_name, source_id,
  verification_status, last_verified_at, is_demo
) on public.office_jurisdictions to authenticated;
grant select (
  id, slug, name, description, is_active, is_demo
) on public.service_categories to authenticated;
grant select (
  id, office_id, service_category_id, channel_type, label, channel_value,
  source_id, verification_status, last_verified_at, is_active, is_demo
) on public.office_contact_channels to authenticated;

grant select (
  id, country_code, alias_normalized, canonical_state_normalized,
  canonical_district_normalized, enabled
) on public.location_aliases to authenticated;
grant select (
  id, office_id, service_category_id, enabled, appointment_required,
  walk_in_allowed, effective_from, effective_until
) on public.mission_services to authenticated;
grant select (
  id, mission_service_id, fee_label, amount, currency, is_free,
  enabled, effective_from, effective_until, superseded_by
) on public.mission_service_fees to authenticated;
grant select (
  id, mission_service_id, requirement_order, requirement_text,
  enabled, effective_from, effective_until
) on public.mission_service_requirements to authenticated;
grant select (
  id, office_id, service_category_id, appointment_type, label, url,
  contact_channel_id, instructions, enabled, effective_from, effective_until
) on public.mission_appointments to authenticated;
grant select (
  id, office_id, service_category_id, day_of_week, opens_at, closes_at,
  timezone, enabled, effective_from, effective_until
) on public.mission_service_hours to authenticated;
grant select (
  id, office_id, service_category_id, exception_date, is_closed,
  opens_at, closes_at, label, enabled
) on public.mission_service_hour_exceptions to authenticated;
grant select (
  id, office_id, event_type, title, description, venue_name, address,
  country_code, state_name, state_normalized, district_name,
  district_normalized, starts_at, ends_at, registration_url,
  contact_channel_id, enabled
) on public.official_service_events to authenticated;
grant select (event_id, service_category_id)
  on public.official_service_event_services to authenticated;
grant select on public.layanan_public_offices,
  public.layanan_public_jurisdictions, public.layanan_public_mission_services,
  public.layanan_public_contact_channels, public.layanan_public_fees,
  public.layanan_public_requirements, public.layanan_public_appointments,
  public.layanan_public_hours, public.layanan_public_hour_exceptions,
  public.layanan_public_events, public.layanan_public_event_services
  to anon, authenticated;

commit;
