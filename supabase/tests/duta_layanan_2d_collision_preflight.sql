-- SELECT-only preflight for the LAYANAN-2D deterministic package.
with expected_services(id, mission_code, service_code) as (
  values
    ('75400000-0000-0000-0000-000000000001'::uuid,'KBRI-KUL','IMMIGRATION'),('75400000-0000-0000-0000-000000000002','KBRI-KUL','CONSULAR'),('75400000-0000-0000-0000-000000000003','KBRI-KUL','LEGALIZATION'),('75400000-0000-0000-0000-000000000004','KBRI-KUL','EMPLOYMENT'),('75400000-0000-0000-0000-000000000005','KBRI-KUL','CITIZENSHIP'),('75400000-0000-0000-0000-000000000006','KBRI-KUL','MARITIME'),
    ('75400000-0000-0000-0000-000000000007','KJRI-JHB','CONSULAR'),('75400000-0000-0000-0000-000000000008','KJRI-JHB','EMPLOYMENT'),('75400000-0000-0000-0000-000000000009','KJRI-JHB','CITIZENSHIP'),('75400000-0000-0000-0000-000000000010','KJRI-JHB','MARITIME'),('75400000-0000-0000-0000-000000000011','KJRI-JHB','IMMIGRATION'),('75400000-0000-0000-0000-000000000012','KJRI-JHB','PROTECTION'),
    ('75400000-0000-0000-0000-000000000013','KJRI-PEN','CONSULAR'),('75400000-0000-0000-0000-000000000014','KJRI-PEN','PROTECTION'),
    ('75400000-0000-0000-0000-000000000015','KJRI-KCH','PROTECTION'),('75400000-0000-0000-0000-000000000016','KJRI-KCH','EMPLOYMENT'),('75400000-0000-0000-0000-000000000017','KJRI-KCH','IMMIGRATION'),
    ('75400000-0000-0000-0000-000000000018','KJRI-BKI','IMMIGRATION'),('75400000-0000-0000-0000-000000000019','KJRI-BKI','CONSULAR'),('75400000-0000-0000-0000-000000000020','KJRI-BKI','LEGALIZATION'),('75400000-0000-0000-0000-000000000021','KJRI-BKI','MARITIME'),('75400000-0000-0000-0000-000000000022','KJRI-BKI','CITIZENSHIP'),
    ('75400000-0000-0000-0000-000000000023','KRI-TWU','IMMIGRATION'),('75400000-0000-0000-0000-000000000024','KRI-TWU','CONSULAR'),('75400000-0000-0000-0000-000000000025','KRI-TWU','LEGALIZATION'),('75400000-0000-0000-0000-000000000026','KRI-TWU','EMPLOYMENT'),('75400000-0000-0000-0000-000000000027','KRI-TWU','CITIZENSHIP'),('75400000-0000-0000-0000-000000000028','KRI-TWU','MARITIME')
), resolved as (
  select expected.*, office.id office_id, category.id category_id,
    by_id.id existing_by_id, by_identity.id existing_by_identity
  from expected_services expected
  left join public.representative_offices office on office.mission_code=expected.mission_code
  left join public.service_categories category on category.service_code=expected.service_code
  left join public.mission_services by_id on by_id.id=expected.id
  left join public.mission_services by_identity on by_identity.office_id=office.id and by_identity.service_category_id=category.id
)
select 'mission_service' entity, id expected_id, mission_code||':'||service_code expected_identity,
  case when office_id is null then 'MISSING_OFFICE' when category_id is null then 'MISSING_CATEGORY'
       when existing_by_id is not null and existing_by_identity is distinct from existing_by_id then 'ID_COLLISION'
       when existing_by_identity is not null and existing_by_identity is distinct from id then 'IDENTITY_COLLISION'
       when existing_by_id is not null then 'EXACT_EXISTING' else 'AVAILABLE' end diagnostic_status
from resolved
union all
select 'office', office.id, office.mission_code,
  case when office.is_demo then 'DEMO_COLLISION' when office.country_code<>'MY' then 'COUNTRY_COLLISION' else 'EXACT_EXISTING' end
from public.representative_offices office where office.id::text like '75000000-0000-0000-0000-00000000000%'
union all
select 'jurisdiction', jurisdiction.id, office.mission_code||':'||jurisdiction.state_normalized||':'||coalesce(jurisdiction.district_normalized,''),
  case when jurisdiction.is_demo then 'DEMO_COLLISION' else 'EXACT_EXISTING' end
from public.office_jurisdictions jurisdiction join public.representative_offices office on office.id=jurisdiction.office_id
where jurisdiction.id::text like '75100000-0000-0000-0000-0000000000%'
union all
select 'open_conflict', conflict.id, coalesce(conflict.mission_service_id::text, conflict.representative_office_id::text, conflict.office_jurisdiction_id::text), 'OPEN_CONFLICT'
from public.service_data_conflicts conflict where conflict.status='OPEN'
  and (conflict.mission_service_id::text like '75400000-%' or conflict.representative_office_id::text like '75000000-%' or conflict.office_jurisdiction_id::text like '75100000-%')
order by entity, expected_identity;
