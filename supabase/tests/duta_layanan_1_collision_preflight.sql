-- Read-only collision preflight for the LAYANAN-1 canonical Malaysia baseline.
with expected_offices(id, mission_code, source_id) as (
  values
    ('75000000-0000-0000-0000-000000000001'::uuid, 'KBRI-KUL', '71000000-0000-0000-0000-000000000001'::uuid),
    ('75000000-0000-0000-0000-000000000002'::uuid, 'KJRI-JHB', '71000000-0000-0000-0000-000000000006'::uuid),
    ('75000000-0000-0000-0000-000000000003'::uuid, 'KJRI-PEN', '71000000-0000-0000-0000-000000000009'::uuid),
    ('75000000-0000-0000-0000-000000000004'::uuid, 'KJRI-KCH', '71000000-0000-0000-0000-000000000016'::uuid),
    ('75000000-0000-0000-0000-000000000005'::uuid, 'KJRI-BKI', '71000000-0000-0000-0000-000000000014'::uuid),
    ('75000000-0000-0000-0000-000000000006'::uuid, 'KRI-TWU', '71000000-0000-0000-0000-000000000019'::uuid)
),
id_collisions as (
  select 'office_id'::text as collision_type, expected.id::text as identity, existing.id::text as existing_id
  from expected_offices expected join public.representative_offices existing on existing.id = expected.id
  where existing.mission_code is distinct from expected.mission_code or existing.source_id is distinct from expected.source_id
  union all
  select 'reserved_jurisdiction_id', existing.id::text, existing.id::text
  from public.office_jurisdictions existing
  where existing.id::text like '75100000-0000-0000-0000-0000000000%'
  union all
  select 'reserved_alias_id', existing.id::text, existing.id::text
  from public.location_aliases existing
  where existing.id::text like '75200000-0000-0000-0000-00000000000%'
),
natural_collisions as (
  select 'mission_code'::text, expected.mission_code, existing.id::text
  from expected_offices expected join public.representative_offices existing on existing.mission_code = expected.mission_code
  where existing.id <> expected.id
),
source_failures as (
  select 'source_gate'::text, expected.mission_code, coalesce(source.id::text, 'MISSING')
  from expected_offices expected left join public.official_sources source on source.id = expected.source_id
  where source.id is null or source.institution_code is distinct from expected.mission_code
    or not source.enabled or source.registry_status <> 'VERIFIED' or source.verification_level not in ('A', 'B')
),
open_conflicts as (
  select 'open_conflict'::text, office.mission_code, conflict.id::text
  from public.service_data_conflicts conflict
  join public.representative_offices office on office.id = conflict.representative_office_id
  where conflict.status = 'OPEN' and office.mission_code in (select mission_code from expected_offices)
)
select * from id_collisions
union all select * from natural_collisions
union all select * from source_failures
union all select * from open_conflicts
order by collision_type, identity, existing_id;

