begin;

-- Behavioral rollback: retain provenance columns/events for audit, but restore
-- the original evidence-only publication contract and disable new DUTA reviews.
drop policy if exists "Authorized reviewers append service verification history"
  on public.service_verification_events;

create policy "Admins append service verification history"
on public.service_verification_events
for insert to authenticated
with check (
  actor_id = auth.uid()
  and provenance_class is distinct from 'DUTA_REVIEWED_VERIFIED'
  and private.can_manage_service_target(
    representative_office_id, office_jurisdiction_id, location_alias_id, mission_service_id,
    contact_channel_id, fee_id, requirement_id, appointment_id,
    service_hours_id, service_hour_exception_id, official_service_event_id
  )
);

create or replace function private.is_layanan_public_mission_service(
  target_service_id uuid,
  target_office_id uuid default null,
  target_service_category_id uuid default null
)
returns boolean
language sql stable security invoker set search_path = ''
as $$
  select exists (
    select 1 from public.mission_services service
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
    and private.has_approved_service_evidence('office_jurisdiction', jurisdiction.id)
    and not private.has_open_service_conflict('office_jurisdiction', jurisdiction.id);
$$;

drop view if exists public.layanan_public_provenance;
revoke all on function private.read_layanan_public_provenance() from public;
drop function if exists private.read_layanan_public_provenance();

commit;
