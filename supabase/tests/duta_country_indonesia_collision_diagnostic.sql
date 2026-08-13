with relevant_countries as (
  select
    code,
    name,
    is_active,
    source_url,
    verification_status::text as verification_status,
    verified_at,
    case
      when code = 'MY' and name = 'Malaysia' then 'MALAYSIA_REFERENCE'
      when code = 'ID' and name = 'Indonesia' then 'EXACT_INDONESIA_ROW'
      when code = 'ID' then 'ID_CODE_COLLISION'
      when code = 'IDN' then 'IDN_COMPETING_CODE'
      when lower(trim(name)) = 'indonesia' then 'INDONESIA_NAME_COLLISION'
      else 'UNEXPECTED'
    end as diagnostic_status
  from public.countries
  where code in ('MY', 'ID', 'IDN')
     or lower(trim(name)) = 'indonesia'
)
select
  code,
  name,
  is_active,
  source_url,
  verification_status,
  verified_at,
  diagnostic_status
from relevant_countries
order by
  case diagnostic_status
    when 'MALAYSIA_REFERENCE' then 1
    when 'EXACT_INDONESIA_ROW' then 2
    else 3
  end,
  code,
  name;
