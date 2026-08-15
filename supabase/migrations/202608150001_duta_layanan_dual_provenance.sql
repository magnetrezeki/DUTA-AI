begin;

create type public.layanan_provenance_class as enum (
  'OFFICIAL_SOURCE_VERIFIED',
  'DUTA_REVIEWED_VERIFIED'
);

alter table public.service_verification_events
  add column provenance_class public.layanan_provenance_class,
  add column manifest_reference text,
  add column review_decision text,
  add column reviewer_role text;

update public.service_verification_events
set provenance_class = 'OFFICIAL_SOURCE_VERIFIED',
    review_decision = 'APPROVED',
    reviewer_role = 'LEGACY_AUTHORIZED_REVIEWER'
where event_type in ('VERIFIED', 'REVERIFIED') and evidence_id is not null;

alter table public.service_verification_events
  drop constraint service_verification_events_verified_evidence_required,
  add constraint service_verification_events_provenance_complete check (
    event_type not in ('VERIFIED', 'REVERIFIED') or (
      provenance_class is not null
      and review_decision = 'APPROVED'
      and reviewer_role is not null
      and (
        (provenance_class = 'OFFICIAL_SOURCE_VERIFIED' and evidence_id is not null)
        or (
          provenance_class = 'DUTA_REVIEWED_VERIFIED'
          and evidence_id is null
          and manifest_reference is not null
          and char_length(trim(manifest_reference)) between 3 and 500
          and num_nonnulls(office_jurisdiction_id, mission_service_id) = 1
        )
      )
    )
  ),
  add constraint service_verification_events_review_decision check (
    review_decision is null or review_decision in ('APPROVED', 'REJECTED')
  ),
  add constraint service_verification_events_reviewer_role check (
    reviewer_role is null or reviewer_role in ('moderator', 'super_admin', 'PRODUCT_OWNER', 'LEGACY_AUTHORIZED_REVIEWER')
  );

create index service_verification_events_duta_review_idx
  on public.service_verification_events (provenance_class, created_at desc)
  where provenance_class = 'DUTA_REVIEWED_VERIFIED';

create or replace function private.is_layanan_review_authority()
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
      and viewer.role in ('moderator', 'super_admin')
  );
$$;
revoke all on function private.is_layanan_review_authority() from public;
grant execute on function private.is_layanan_review_authority() to authenticated;

drop policy "Admins append service verification history" on public.service_verification_events;
create policy "Authorized reviewers append service verification history"
on public.service_verification_events
for insert to authenticated
with check (
  actor_id = auth.uid()
  and private.can_manage_service_target(
    representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
    contact_channel_id, fee_id, requirement_id, appointment_id,
    service_hours_id, service_hour_exception_id, official_service_event_id
  )
  and (
    provenance_class is distinct from 'DUTA_REVIEWED_VERIFIED'
    or private.is_layanan_review_authority()
  )
);

create or replace function private.has_approved_duta_review(target_kind text, target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.service_verification_events review
    join public.representative_offices office on office.id = case
      when target_kind = 'office_jurisdiction' then (
        select jurisdiction.office_id from public.office_jurisdictions jurisdiction
        where jurisdiction.id = target_id
      )
      when target_kind = 'mission_service' then (
        select service.office_id from public.mission_services service
        where service.id = target_id
      )
      else null
    end
    join public.official_sources source on source.id = office.source_id
    where review.event_type in ('VERIFIED', 'REVERIFIED')
      and review.provenance_class = 'DUTA_REVIEWED_VERIFIED'
      and review.review_decision = 'APPROVED'
      and review.manifest_reference is not null
      and review.new_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
      and source.enabled
      and source.registry_status = 'VERIFIED'
      and source.verification_level in ('A', 'B')
      and case target_kind
        when 'office_jurisdiction' then review.office_jurisdiction_id = target_id
        when 'mission_service' then review.mission_service_id = target_id
        else false
      end
      and review.id = (
        select latest.id
        from public.service_verification_events latest
        where case target_kind
          when 'office_jurisdiction' then latest.office_jurisdiction_id = target_id
          when 'mission_service' then latest.mission_service_id = target_id
          else false
        end
        order by latest.created_at desc, latest.id desc
        limit 1
      )
  );
$$;
revoke all on function private.has_approved_duta_review(text, uuid) from public;

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
      and (
        private.has_approved_service_evidence('mission_service', service.id)
        or private.has_approved_duta_review('mission_service', service.id)
      )
      and not private.has_open_service_conflict('mission_service', service.id)
      and private.is_layanan_public_office(service.office_id)
  );
$$;
revoke all on function private.is_layanan_public_mission_service(uuid, uuid, uuid) from public;

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
  where jurisdiction.enabled and not jurisdiction.is_demo
    and jurisdiction.verification_status = 'verified'
    and jurisdiction.publishability_status in ('VERIFIED_CURRENT', 'VERIFIED_OFFICIAL')
    and (jurisdiction.effective_from is null or jurisdiction.effective_from <= now())
    and (jurisdiction.effective_until is null or jurisdiction.effective_until > now())
    and private.is_layanan_public_office(jurisdiction.office_id)
    and (
      private.has_approved_service_evidence('office_jurisdiction', jurisdiction.id)
      or private.has_approved_duta_review('office_jurisdiction', jurisdiction.id)
    )
    and not private.has_open_service_conflict('office_jurisdiction', jurisdiction.id);
$$;

create or replace function private.read_layanan_public_provenance()
returns table (
  target_type text, target_id uuid,
  provenance_class public.layanan_provenance_class,
  provenance_label text, source_name text, source_url text,
  last_verified_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select 'mission_service', service.id,
    case when private.has_approved_service_evidence('mission_service', service.id)
      then 'OFFICIAL_SOURCE_VERIFIED'::public.layanan_provenance_class
      else 'DUTA_REVIEWED_VERIFIED'::public.layanan_provenance_class end,
    case when private.has_approved_service_evidence('mission_service', service.id)
      then 'Sumber resmi terverifikasi'
      else 'Diverifikasi DUTA berdasarkan sumber resmi yang telah ditinjau' end,
    source.name,
    coalesce(evidence.evidence_url, source.source_url),
    service.last_verified_at
  from public.layanan_public_mission_services visible
  join public.mission_services service on service.id = visible.id
  join public.official_sources source on source.id = service.source_id
  left join lateral (
    select item.evidence_url from public.official_service_evidence item
    where item.mission_service_id = service.id order by item.created_at desc, item.id limit 1
  ) evidence on true
  union all
  select 'office_jurisdiction', jurisdiction.id,
    case when private.has_approved_service_evidence('office_jurisdiction', jurisdiction.id)
      then 'OFFICIAL_SOURCE_VERIFIED'::public.layanan_provenance_class
      else 'DUTA_REVIEWED_VERIFIED'::public.layanan_provenance_class end,
    case when private.has_approved_service_evidence('office_jurisdiction', jurisdiction.id)
      then 'Sumber resmi terverifikasi'
      else 'Diverifikasi DUTA berdasarkan sumber resmi yang telah ditinjau' end,
    source.name,
    coalesce(evidence.evidence_url, source.source_url),
    jurisdiction.last_verified_at
  from public.layanan_public_jurisdictions visible
  join public.office_jurisdictions jurisdiction on jurisdiction.id = visible.id
  join public.official_sources source on source.id = jurisdiction.source_id
  left join lateral (
    select item.evidence_url from public.official_service_evidence item
    where item.office_jurisdiction_id = jurisdiction.id order by item.created_at desc, item.id limit 1
  ) evidence on true;
$$;
revoke all on function private.read_layanan_public_provenance() from public;
grant execute on function private.read_layanan_public_provenance() to anon, authenticated;

create view public.layanan_public_provenance
with (security_invoker = true)
as select * from private.read_layanan_public_provenance();
revoke insert, update, delete, truncate, references, trigger
  on public.layanan_public_provenance from anon, authenticated;
grant select on public.layanan_public_provenance to anon, authenticated;

commit;
