with expected(id, institution_code, platform, source_url) as (
  values
    ('72000000-0000-0000-0000-000000000001'::uuid, 'JIM-MYS'::text, 'website'::public.official_source_platform, 'https://www.imi.gov.my/'::text),
    ('72000000-0000-0000-0000-000000000002'::uuid, 'JIM-MYS'::text, 'facebook'::public.official_source_platform, 'https://www.facebook.com/imigresen/'::text),
    ('72000000-0000-0000-0000-000000000003'::uuid, 'JIM-MYS'::text, 'instagram'::public.official_source_platform, 'https://www.instagram.com/imigresen/'::text)
),
diagnostic as (
  select
    expected.platform::text as expected_channel,
    expected.id as expected_id,
    expected.source_url as expected_url,
    source.id as existing_id,
    source.institution_code as existing_institution_code,
    source.platform::text as existing_channel,
    source.source_url as existing_url,
    case
      when source.id = expected.id
        and source.institution_code = expected.institution_code
        and source.platform = expected.platform
        and source.source_url = expected.source_url
        then 'EXACT_EXPECTED_RECORD'
      when source.id = expected.id then 'DETERMINISTIC_UUID_COLLISION'
      when source.source_url = expected.source_url then 'EXACT_URL_COLLISION'
      when private.news_url_canonical_v1(source.source_url)
        = private.news_url_canonical_v1(expected.source_url)
        then 'CANONICAL_URL_COLLISION'
      when regexp_replace(replace(lower(source.source_url), '://www.', '://'), '/+$', '')
        = regexp_replace(replace(lower(expected.source_url), '://www.', '://'), '/+$', '')
        then 'NORMALIZED_URL_COLLISION'
      when source.institution_code = expected.institution_code
        and source.platform = expected.platform
        then 'INSTITUTION_CHANNEL_COLLISION'
      else 'POSSIBLE_JIM_ALIAS'
    end as diagnostic_status
  from expected
  join public.official_sources source
    on source.id = expected.id
    or source.source_url = expected.source_url
    or private.news_url_canonical_v1(source.source_url)
      = private.news_url_canonical_v1(expected.source_url)
    or regexp_replace(replace(lower(source.source_url), '://www.', '://'), '/+$', '')
      = regexp_replace(replace(lower(expected.source_url), '://www.', '://'), '/+$', '')
    or (source.institution_code = expected.institution_code and source.platform = expected.platform)
    or lower(source.name) like '%jabatan imigresen malaysia%'
    or lower(coalesce(source.handle, '')) in ('imigresen', '@imigresen')
)
select
  expected.platform::text as expected_channel,
  expected.id as expected_id,
  expected.source_url as expected_url,
  coalesce(diagnostic.diagnostic_status, 'NO_COLLISION_FOUND') as diagnostic_status,
  diagnostic.existing_id,
  diagnostic.existing_institution_code,
  diagnostic.existing_channel,
  diagnostic.existing_url
from expected
left join diagnostic
  on diagnostic.expected_channel = expected.platform::text
 and diagnostic.expected_id = expected.id
 and diagnostic.expected_url = expected.source_url
order by expected.platform, diagnostic.diagnostic_status, diagnostic.existing_id;
