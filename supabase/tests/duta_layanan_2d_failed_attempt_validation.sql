-- SELECT-only confirmation that the failed first child guard persisted no child fixtures.
with checks(relation_name,remaining_rows) as (
  values
    ('service_categories',(select count(*) from public.service_categories where id::text like '75300000-%')),
    ('mission_services',(select count(*) from public.mission_services where id::text like '75400000-%')),
    ('official_service_evidence',(select count(*) from public.official_service_evidence where id::text like '75600000-%' or id::text like '75610000-%' or id::text like '75620000-%')),
    ('service_verification_events',(select count(*) from public.service_verification_events where id::text like '75710000-%' or id::text like '75720000-%'))
)
select relation_name,remaining_rows,
  case when remaining_rows=0 then 'PASS' else 'FAIL' end result
from checks
order by relation_name;
