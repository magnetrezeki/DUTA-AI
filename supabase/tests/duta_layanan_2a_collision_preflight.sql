-- LAYANAN-2A KRI Tawau manifest collision preflight. SELECT-only.

with expected(entity_type, id, natural_key) as (
  values
    ('office', '75000000-0000-0000-0000-000000000006'::uuid, 'KRI-TWU'),
    ('jurisdiction', '75100000-0000-0000-0000-000000000016'::uuid, 'MY|sabah|tawau|DISTRICT'),
    ('jurisdiction', '75100000-0000-0000-0000-000000000020'::uuid, 'MY|sabah|kalabakan|DISTRICT'),
    ('jurisdiction', '75100000-0000-0000-0000-000000000017'::uuid, 'MY|sabah|kunak|DISTRICT'),
    ('jurisdiction', '75100000-0000-0000-0000-000000000019'::uuid, 'MY|sabah|lahad datu|DISTRICT'),
    ('jurisdiction', '75100000-0000-0000-0000-000000000018'::uuid, 'MY|sabah|semporna|DISTRICT'),
    ('contact', '75500000-0000-0000-0000-000000000001'::uuid, 'website|https://kemlu.go.id/tawau'),
    ('contact', '75500000-0000-0000-0000-000000000002'::uuid, 'email|tawau.kri@kemlu.go.id'),
    ('contact', '75500000-0000-0000-0000-000000000003'::uuid, 'phone|+6089772052'),
    ('contact', '75500000-0000-0000-0000-000000000004'::uuid, 'phone|+6089752969')
),
actual as (
  select 'office'::text as entity_type, office.id,
    office.mission_code as natural_key
  from public.representative_offices office
  where office.id = '75000000-0000-0000-0000-000000000006'
     or office.mission_code = 'KRI-TWU'
  union all
  select 'jurisdiction', jurisdiction.id,
    concat_ws('|', jurisdiction.country_code, jurisdiction.state_normalized,
      jurisdiction.district_normalized, jurisdiction.jurisdiction_type::text)
  from public.office_jurisdictions jurisdiction
  where jurisdiction.id in (
    '75100000-0000-0000-0000-000000000016', '75100000-0000-0000-0000-000000000020',
    '75100000-0000-0000-0000-000000000017', '75100000-0000-0000-0000-000000000019',
    '75100000-0000-0000-0000-000000000018'
  ) or (
    jurisdiction.office_id = '75000000-0000-0000-0000-000000000006'
    and jurisdiction.state_normalized = 'sabah'
    and jurisdiction.district_normalized in ('tawau', 'kalabakan', 'kunak', 'lahad datu', 'semporna')
  )
  union all
  select 'contact', contact.id,
    concat_ws('|', contact.channel_type::text, contact.normalized_value)
  from public.office_contact_channels contact
  where contact.id in (
    '75500000-0000-0000-0000-000000000001', '75500000-0000-0000-0000-000000000002',
    '75500000-0000-0000-0000-000000000003', '75500000-0000-0000-0000-000000000004'
  ) or (
    contact.office_id = '75000000-0000-0000-0000-000000000006'
    and contact.normalized_value in (
      'https://kemlu.go.id/tawau', 'tawau.kri@kemlu.go.id', '+6089772052', '+6089752969'
    )
  )
)
select expected.entity_type, expected.id as expected_id, expected.natural_key as expected_natural_key,
  actual.id as existing_id, actual.natural_key as existing_natural_key,
  case
    when actual.id is null then 'AVAILABLE'
    when actual.id = expected.id and actual.natural_key = expected.natural_key then 'EXACT_MATCH'
    else 'COLLISION'
  end as diagnostic_status
from expected
left join actual
  on actual.entity_type = expected.entity_type
 and (actual.id = expected.id or actual.natural_key = expected.natural_key)
order by expected.entity_type, expected.id;

select evidence.id, evidence.official_source_id, evidence.official_source_item_id,
  evidence.evidence_url, evidence.representative_office_id,
  evidence.office_jurisdiction_id, evidence.contact_channel_id
from public.official_service_evidence evidence
where evidence.id::text like '75600000-0000-0000-0000-0000000000%'
   or (
     evidence.official_source_id = '71000000-0000-0000-0000-000000000019'
     and evidence.evidence_url = 'https://kemlu.go.id/tawau'
     and (
       evidence.representative_office_id = '75000000-0000-0000-0000-000000000006'
       or evidence.office_jurisdiction_id in (
         '75100000-0000-0000-0000-000000000016', '75100000-0000-0000-0000-000000000020',
         '75100000-0000-0000-0000-000000000017', '75100000-0000-0000-0000-000000000019',
         '75100000-0000-0000-0000-000000000018'
       )
       or evidence.contact_channel_id in (
         '75500000-0000-0000-0000-000000000001', '75500000-0000-0000-0000-000000000002',
         '75500000-0000-0000-0000-000000000003', '75500000-0000-0000-0000-000000000004'
       )
     )
   )
order by evidence.id;

select conflict.id, conflict.status, conflict.conflict_type, conflict.summary
from public.service_data_conflicts conflict
where conflict.status = 'OPEN'
  and (
    conflict.representative_office_id = '75000000-0000-0000-0000-000000000006'
    or conflict.office_jurisdiction_id in (
      '75100000-0000-0000-0000-000000000016', '75100000-0000-0000-0000-000000000020',
      '75100000-0000-0000-0000-000000000017', '75100000-0000-0000-0000-000000000019',
      '75100000-0000-0000-0000-000000000018'
    )
    or conflict.contact_channel_id in (
      '75500000-0000-0000-0000-000000000001', '75500000-0000-0000-0000-000000000002',
      '75500000-0000-0000-0000-000000000003', '75500000-0000-0000-0000-000000000004'
    )
  )
order by conflict.detected_at desc, conflict.id;
