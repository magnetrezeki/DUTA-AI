-- DUTA Layanan WNI LAYANAN-2 operational readiness preflight.
-- Read-only: this script reports collisions and missing evidence without changing data.

with mission_manifest(mission_code, source_id) as (
  values
    ('KBRI-KUL', '71000000-0000-0000-0000-000000000001'::uuid),
    ('KJRI-JHB', '71000000-0000-0000-0000-000000000006'::uuid),
    ('KJRI-PEN', '71000000-0000-0000-0000-000000000009'::uuid),
    ('KJRI-KCH', '71000000-0000-0000-0000-000000000016'::uuid),
    ('KJRI-BKI', '71000000-0000-0000-0000-000000000014'::uuid),
    ('KRI-TWU',  '71000000-0000-0000-0000-000000000019'::uuid)
),
office_counts as (
  select manifest.mission_code, manifest.source_id,
    count(office.id) as office_count,
    count(office.id) filter (where office.country_code = 'MY') as my_office_count,
    count(office.id) filter (
      where office.country_code = 'MY'
        and office.source_id = manifest.source_id
        and not office.is_demo
    ) as matching_office_count
  from mission_manifest manifest
  left join public.representative_offices office
    on office.mission_code = manifest.mission_code
  group by manifest.mission_code, manifest.source_id
),
source_counts as (
  select manifest.mission_code, manifest.source_id,
    count(source.id) as source_count,
    count(source.id) filter (
      where source.country_code = 'MY'
        and source.enabled
        and source.registry_status = 'VERIFIED'
        and source.verification_level in ('A', 'B')
        and source.verification_status = 'verified'
        and source.last_verified_at is not null
    ) as qualifying_source_count
  from mission_manifest manifest
  left join public.official_sources source on source.id = manifest.source_id
  group by manifest.mission_code, manifest.source_id
),
operational_counts as (
  select manifest.mission_code,
    count(distinct jurisdiction.id) as jurisdiction_count,
    count(distinct service.id) as mission_service_count,
    count(distinct contact.id) as contact_count,
    count(distinct evidence.id) as evidence_count,
    count(distinct conflict.id) filter (where conflict.status = 'OPEN') as open_conflict_count
  from mission_manifest manifest
  left join public.representative_offices office
    on office.mission_code = manifest.mission_code
  left join public.office_jurisdictions jurisdiction on jurisdiction.office_id = office.id
  left join public.mission_services service on service.office_id = office.id
  left join public.office_contact_channels contact on contact.office_id = office.id
  left join public.official_service_evidence evidence
    on evidence.representative_office_id = office.id
    or evidence.office_jurisdiction_id = jurisdiction.id
    or evidence.mission_service_id = service.id
    or evidence.contact_channel_id = contact.id
  left join public.service_data_conflicts conflict
    on conflict.representative_office_id = office.id
    or conflict.office_jurisdiction_id = jurisdiction.id
    or conflict.mission_service_id = service.id
    or conflict.contact_channel_id = contact.id
  group by manifest.mission_code
)
select
  source_counts.mission_code,
  source_counts.source_id,
  source_counts.source_count,
  source_counts.qualifying_source_count,
  office_counts.office_count,
  office_counts.my_office_count,
  office_counts.matching_office_count,
  operational_counts.jurisdiction_count,
  operational_counts.mission_service_count,
  operational_counts.contact_count,
  operational_counts.evidence_count,
  operational_counts.open_conflict_count,
  case
    when source_counts.source_count <> 1 then 'SOURCE_COLLISION_OR_MISSING'
    when source_counts.qualifying_source_count <> 1 then 'SOURCE_NOT_PUBLICATION_QUALIFIED'
    when office_counts.office_count > 1 then 'MISSION_CODE_COLLISION'
    when office_counts.office_count = 1 and office_counts.matching_office_count <> 1
      then 'OFFICE_IDENTITY_CONFLICT'
    when office_counts.office_count = 0 then 'OFFICE_MISSING'
    when operational_counts.jurisdiction_count = 0 then 'JURISDICTION_MISSING'
    when operational_counts.mission_service_count = 0 then 'MISSION_SERVICE_MISSING'
    when operational_counts.contact_count = 0 then 'CONTACT_MISSING'
    when operational_counts.evidence_count = 0 then 'TARGET_EVIDENCE_MISSING'
    when operational_counts.open_conflict_count > 0 then 'OPEN_CONFLICT'
    else 'READY_FOR_FIELD_LEVEL_REVIEW'
  end as readiness_status
from source_counts
join office_counts using (mission_code, source_id)
join operational_counts using (mission_code)
order by source_counts.mission_code;

select service_code, slug, name, intent_group, is_active, is_demo, count(*) over (
  partition by service_code
) as service_code_count
from public.service_categories
where not is_demo
order by service_code nulls last, slug;

select office.mission_code, service.id, category.service_code, service.enabled,
  service.verification_status, service.publishability_status, service.effective_from,
  service.effective_until, service.last_verified_at, service.source_id
from public.mission_services service
join public.representative_offices office on office.id = service.office_id
join public.service_categories category on category.id = service.service_category_id
where office.mission_code in ('KBRI-KUL', 'KJRI-JHB', 'KJRI-PEN', 'KJRI-KCH', 'KJRI-BKI', 'KRI-TWU')
order by office.mission_code, category.service_code, service.id;

select office.mission_code, contact.id, category.service_code, contact.channel_type,
  contact.label, contact.channel_value, contact.normalized_value, contact.e164_phone,
  contact.url, contact.purpose, contact.enabled, contact.verification_status,
  contact.publishability_status, contact.effective_from, contact.effective_until,
  contact.last_verified_at, contact.source_id
from public.office_contact_channels contact
join public.representative_offices office on office.id = contact.office_id
left join public.service_categories category on category.id = contact.service_category_id
where office.mission_code in ('KBRI-KUL', 'KJRI-JHB', 'KJRI-PEN', 'KJRI-KCH', 'KJRI-BKI', 'KRI-TWU')
order by office.mission_code, contact.purpose, contact.display_order, contact.id;

select office.mission_code, evidence.id, evidence.official_source_id,
  evidence.official_source_item_id, evidence.evidence_url, evidence.observed_at,
  evidence.representative_office_id, evidence.office_jurisdiction_id,
  evidence.mission_service_id, evidence.contact_channel_id, evidence.fee_id,
  evidence.requirement_id, evidence.appointment_id, evidence.service_hours_id
from public.official_service_evidence evidence
left join public.representative_offices direct_office
  on direct_office.id = evidence.representative_office_id
left join public.office_jurisdictions jurisdiction
  on jurisdiction.id = evidence.office_jurisdiction_id
left join public.mission_services service on service.id = evidence.mission_service_id
left join public.office_contact_channels contact on contact.id = evidence.contact_channel_id
join public.representative_offices office on office.id = coalesce(
  direct_office.id, jurisdiction.office_id, service.office_id, contact.office_id
)
where office.mission_code in ('KBRI-KUL', 'KJRI-JHB', 'KJRI-PEN', 'KJRI-KCH', 'KJRI-BKI', 'KRI-TWU')
order by office.mission_code, evidence.id;

select conflict.id, conflict.status, conflict.conflict_type, conflict.summary,
  conflict.representative_office_id, conflict.office_jurisdiction_id,
  conflict.mission_service_id, conflict.contact_channel_id, conflict.fee_id,
  conflict.requirement_id, conflict.appointment_id, conflict.service_hours_id
from public.service_data_conflicts conflict
where conflict.status = 'OPEN'
  and (
    conflict.representative_office_id in (
      select id from public.representative_offices
      where mission_code in ('KBRI-KUL', 'KJRI-JHB', 'KJRI-PEN', 'KJRI-KCH', 'KJRI-BKI', 'KRI-TWU')
    )
    or conflict.office_jurisdiction_id in (
      select jurisdiction.id from public.office_jurisdictions jurisdiction
      join public.representative_offices office on office.id = jurisdiction.office_id
      where office.mission_code in ('KBRI-KUL', 'KJRI-JHB', 'KJRI-PEN', 'KJRI-KCH', 'KJRI-BKI', 'KRI-TWU')
    )
    or conflict.mission_service_id in (
      select service.id from public.mission_services service
      join public.representative_offices office on office.id = service.office_id
      where office.mission_code in ('KBRI-KUL', 'KJRI-JHB', 'KJRI-PEN', 'KJRI-KCH', 'KJRI-BKI', 'KRI-TWU')
    )
    or conflict.contact_channel_id in (
      select contact.id from public.office_contact_channels contact
      join public.representative_offices office on office.id = contact.office_id
      where office.mission_code in ('KBRI-KUL', 'KJRI-JHB', 'KJRI-PEN', 'KJRI-KCH', 'KJRI-BKI', 'KRI-TWU')
    )
  )
order by conflict.detected_at desc, conflict.id;
