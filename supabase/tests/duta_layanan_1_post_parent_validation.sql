-- SELECT-only exact validation after the frozen LAYANAN-1 parent population.
with
expected_office(id,mission_code,country_code,source_id) as (
  values
    ('75000000-0000-0000-0000-000000000001'::uuid,'KBRI-KUL','MY','71000000-0000-0000-0000-000000000001'::uuid),
    ('75000000-0000-0000-0000-000000000002','KJRI-JHB','MY','71000000-0000-0000-0000-000000000006'),
    ('75000000-0000-0000-0000-000000000003','KJRI-PEN','MY','71000000-0000-0000-0000-000000000009'),
    ('75000000-0000-0000-0000-000000000004','KJRI-KCH','MY','71000000-0000-0000-0000-000000000016'),
    ('75000000-0000-0000-0000-000000000005','KJRI-BKI','MY','71000000-0000-0000-0000-000000000014'),
    ('75000000-0000-0000-0000-000000000006','KRI-TWU','MY','71000000-0000-0000-0000-000000000019')
),
expected_jurisdiction(id,office_id,state_normalized,district_normalized,jurisdiction_type) as (
  select ('75100000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
    case when n<=6 then '75000000-0000-0000-0000-000000000001'::uuid when n<=10 then '75000000-0000-0000-0000-000000000002'::uuid when n<=13 then '75000000-0000-0000-0000-000000000003'::uuid when n=14 then '75000000-0000-0000-0000-000000000004'::uuid when n=15 or n>=21 then '75000000-0000-0000-0000-000000000005'::uuid else '75000000-0000-0000-0000-000000000006'::uuid end,
    (array['kuala lumpur','putrajaya','selangor','perak','kelantan','terengganu','johor','melaka','negeri sembilan','pahang','pulau pinang','kedah','perlis','sarawak','wp labuan','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah'])[n],
    (array[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'tawau','kunak','semporna','lahad datu','kalabakan','beluran','beaufort','keningau','kinabatangan','kota belud','kota kinabalu','kota marudu','kuala penyu','kudat','nabawan','papar','penampang','pitas','putatan','ranau','sandakan','sipitang','tambunan','telupid','tenom','tongod','tuaran']::text[])[n],
    case when n in (1,2,15) then 'FEDERAL_TERRITORY' when n between 16 and 42 then 'DISTRICT' else 'STATE_WIDE' end
  from generate_series(1,42) n
),
office_mismatch as (
  select expected.id
  from expected_office expected
  left join public.representative_offices actual on actual.id=expected.id
  where actual.id is null or actual.mission_code is distinct from expected.mission_code
    or actual.country_code is distinct from expected.country_code or actual.source_id is distinct from expected.source_id
    or actual.is_demo or actual.enabled
),
jurisdiction_mismatch as (
  select expected.id
  from expected_jurisdiction expected
  left join public.office_jurisdictions actual on actual.id=expected.id
  where actual.id is null or actual.office_id is distinct from expected.office_id or actual.country_code is distinct from 'MY'
    or actual.state_normalized is distinct from expected.state_normalized
    or actual.district_normalized is distinct from expected.district_normalized
    or actual.jurisdiction_type::text is distinct from expected.jurisdiction_type
    or actual.is_demo or actual.enabled
),
unexpected_office as (
  select id from public.representative_offices
  where id::text like '75000000-0000-0000-0000-00000000000%' and id not in (select id from expected_office)
),
unexpected_jurisdiction as (
  select id from public.office_jurisdictions
  where id::text like '75100000-0000-0000-0000-0000000000%' and id not in (select id from expected_jurisdiction)
),
checks(check_name,actual_count,expected_count) as (
  values
    ('exact_offices',6-(select count(*) from office_mismatch),6),
    ('exact_jurisdictions',42-(select count(*) from jurisdiction_mismatch),42),
    ('demo_leakage',(select count(*) from public.representative_offices where id in (select id from expected_office) and is_demo)+(select count(*) from public.office_jurisdictions where id in (select id from expected_jurisdiction) and is_demo),0),
    ('unexpected_mission',(select count(*) from unexpected_office),0),
    ('unexpected_jurisdiction',(select count(*) from unexpected_jurisdiction),0)
)
select check_name,actual_count,expected_count,
  case when actual_count=expected_count then 'PASS' else 'FAIL' end result
from checks
order by check_name;
