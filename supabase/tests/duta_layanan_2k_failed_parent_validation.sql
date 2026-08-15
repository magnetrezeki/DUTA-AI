-- SELECT-only check for rows potentially left by the failed parent transaction.
with package_rows(relation_name,remaining_rows) as (
  values
    ('representative_offices',(select count(*) from public.representative_offices where id::text like '75000000-%')),
    ('office_jurisdictions',(select count(*) from public.office_jurisdictions where id::text like '75100000-%')),
    ('location_aliases',(select count(*) from public.location_aliases where id::text like '75200000-%'))
)
select relation_name,remaining_rows,
  case when remaining_rows=0 then 'PASS' else 'FAIL' end result
from package_rows
order by relation_name;
