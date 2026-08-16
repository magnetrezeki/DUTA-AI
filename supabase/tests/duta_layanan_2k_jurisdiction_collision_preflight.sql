-- SELECT-only preflight for the district-aware LAYANAN jurisdiction identity.
with
proposed_key_duplicates as (
  select office_id,country_code,state_normalized,district_normalized,
    jurisdiction_type::text jurisdiction_type,array_agg(id order by id) ids,
    count(*) row_count
  from public.office_jurisdictions
  group by office_id,country_code,state_normalized,district_normalized,jurisdiction_type
  having count(*) > 1
),
package_rows as (
  select jurisdiction.id,jurisdiction.office_id,jurisdiction.country_code,
    jurisdiction.state_normalized,jurisdiction.district_normalized,
    jurisdiction.jurisdiction_type::text jurisdiction_type,jurisdiction.is_demo
  from public.office_jurisdictions jurisdiction
  where jurisdiction.id::text like '75100000-%'
),
unexpected_package_rows as (
  select package.id
  from package_rows package
  where right(package.id::text,12)::bigint not between 1 and 42
     or package.country_code is distinct from 'MY'
     or package.is_demo
),
legacy_demo_rows as (
  select id from public.office_jurisdictions where is_demo
),
same_district_different_ids as (
  select office_id,country_code,state_normalized,district_normalized,
    jurisdiction_type,array_agg(id order by id) ids,count(*) row_count
  from public.office_jurisdictions
  where district_normalized is not null
  group by office_id,country_code,state_normalized,district_normalized,jurisdiction_type
  having count(*) > 1
),
same_statewide_different_ids as (
  select office_id,country_code,state_normalized,jurisdiction_type,
    array_agg(id order by id) ids,count(*) row_count
  from public.office_jurisdictions
  where district_normalized is null
  group by office_id,country_code,state_normalized,jurisdiction_type
  having count(*) > 1
)
select 'FAIL' severity,'proposed_key_duplicate' issue,concat_ws('|',office_id,country_code,state_normalized,coalesce(district_normalized,'<NULL>'),jurisdiction_type) identity,ids::text details
from proposed_key_duplicates
union all
select 'FAIL','unexpected_package_row',id::text,id::text from unexpected_package_rows
union all
select 'INFO','legacy_demo_row',id::text,id::text from legacy_demo_rows
union all
select 'FAIL','same_normalized_district',concat_ws('|',office_id,country_code,state_normalized,district_normalized,jurisdiction_type),ids::text from same_district_different_ids
union all
select 'FAIL','same_statewide_identity',concat_ws('|',office_id,country_code,state_normalized,'<NULL>',jurisdiction_type),ids::text from same_statewide_different_ids
order by severity,issue,identity;
