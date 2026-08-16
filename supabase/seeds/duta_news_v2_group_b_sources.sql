begin;

do $$
declare
  conflicting_ids text;
  conflicting_urls text;
  conflicting_channels text;
begin
  with expected(id, platform, source_url) as (
    values
      ('72000000-0000-0000-0000-000000000001'::uuid, 'website'::public.official_source_platform, 'https://www.imi.gov.my/'),
      ('72000000-0000-0000-0000-000000000002'::uuid, 'facebook'::public.official_source_platform, 'https://www.facebook.com/imigresen/'),
      ('72000000-0000-0000-0000-000000000003'::uuid, 'instagram'::public.official_source_platform, 'https://www.instagram.com/imigresen/')
  )
  select string_agg(source.id::text, ', ' order by source.id)
  into conflicting_ids
  from expected
  join public.official_sources source on source.id = expected.id
  where source.institution_code is distinct from 'JIM-MYS'
     or source.platform is distinct from expected.platform
     or source.source_url is distinct from expected.source_url;

  with expected(id, source_url) as (
    values
      ('72000000-0000-0000-0000-000000000001'::uuid, 'https://www.imi.gov.my/'),
      ('72000000-0000-0000-0000-000000000002'::uuid, 'https://www.facebook.com/imigresen/'),
      ('72000000-0000-0000-0000-000000000003'::uuid, 'https://www.instagram.com/imigresen/')
  )
  select string_agg(source.id::text, ', ' order by source.id)
  into conflicting_urls
  from expected
  join public.official_sources source
    on private.news_url_canonical_v1(source.source_url) = private.news_url_canonical_v1(expected.source_url)
    or regexp_replace(replace(lower(source.source_url), '://www.', '://'), '/+$', '')
      = regexp_replace(replace(lower(expected.source_url), '://www.', '://'), '/+$', '')
  where source.id <> expected.id;

  with expected(id, platform, source_url) as (
    values
      ('72000000-0000-0000-0000-000000000001'::uuid, 'website'::public.official_source_platform, 'https://www.imi.gov.my/'),
      ('72000000-0000-0000-0000-000000000002'::uuid, 'facebook'::public.official_source_platform, 'https://www.facebook.com/imigresen/'),
      ('72000000-0000-0000-0000-000000000003'::uuid, 'instagram'::public.official_source_platform, 'https://www.instagram.com/imigresen/')
  )
  select string_agg(source.id::text, ', ' order by source.id)
  into conflicting_channels
  from expected
  join public.official_sources source
    on source.institution_code = 'JIM-MYS'
   and source.platform = expected.platform
  where source.id <> expected.id
     or source.source_url is distinct from expected.source_url;

  if conflicting_ids is not null then
    raise exception 'Group B seed stopped: deterministic UUID collision: %', conflicting_ids;
  end if;
  if conflicting_urls is not null then
    raise exception 'Group B seed stopped: canonical URL collision: %', conflicting_urls;
  end if;
  if conflicting_channels is not null then
    raise exception 'Group B seed stopped: institution/channel collision: %', conflicting_channels;
  end if;
end;
$$;

insert into public.official_sources (
  id, scope, country_code, name, source_url, verification_status,
  last_verified_at, integration_type, integration_enabled, is_active, is_demo,
  institution_code, unit_name, city, platform, handle, official_website,
  verification_level, registry_status, priority, category_scope, enabled,
  fetch_method, notes, news_enabled, news_source_type, news_source_group,
  news_primary_region, news_ingestion_authorized
)
values
  (
    '72000000-0000-0000-0000-000000000001', 'news', 'MY',
    'Jabatan Imigresen Malaysia', 'https://www.imi.gov.my/', 'verified',
    '2026-08-11 00:00:00+08'::timestamptz, 'manual_url', false, true, false,
    'JIM-MYS', null, null, 'website', null, 'https://www.imi.gov.my/',
    'A', 'VERIFIED', 'P0', '["GENERAL_OFFICIAL","IMMIGRATION","LOCAL_ALERT"]', true,
    null, 'DUTA reviewed 2026-08-11. First-party evidence: https://www.imi.gov.my/',
    true, 'MALAYSIAN_GOVERNMENT', 'MALAYSIAN_GOVERNMENT', 'MALAYSIA', false
  ),
  (
    '72000000-0000-0000-0000-000000000002', 'news', 'MY',
    'Jabatan Imigresen Malaysia', 'https://www.facebook.com/imigresen/', 'verified',
    '2026-08-11 00:00:00+08'::timestamptz, 'manual_url', false, true, false,
    'JIM-MYS', null, null, 'facebook', 'imigresen', 'https://www.imi.gov.my/',
    'A', 'VERIFIED', 'P0', '["GENERAL_OFFICIAL","IMMIGRATION","LOCAL_ALERT"]', true,
    null, 'DUTA reviewed 2026-08-11. First-party evidence: https://www.imi.gov.my/index.php/en/pengumuman/penafian-akaun-facebook-palsu-imigresen-en/',
    true, 'MALAYSIAN_GOVERNMENT', 'MALAYSIAN_GOVERNMENT', 'MALAYSIA', false
  ),
  (
    '72000000-0000-0000-0000-000000000003', 'news', 'MY',
    'Jabatan Imigresen Malaysia', 'https://www.instagram.com/imigresen/', 'verified',
    '2026-08-11 00:00:00+08'::timestamptz, 'manual_url', false, true, false,
    'JIM-MYS', null, null, 'instagram', '@imigresen', 'https://www.imi.gov.my/',
    'A', 'VERIFIED', 'P1', '["GENERAL_OFFICIAL","IMMIGRATION","LOCAL_ALERT"]', true,
    null, 'DUTA reviewed 2026-08-11. First-party evidence: https://sto.imi.gov.my/atase/jakarta/manual/BROUCHER%20IMIGRESEN.pdf',
    true, 'MALAYSIAN_GOVERNMENT', 'MALAYSIAN_GOVERNMENT', 'MALAYSIA', false
  )
on conflict (id) do update set
  news_enabled = excluded.news_enabled,
  news_source_type = excluded.news_source_type,
  news_source_group = excluded.news_source_group,
  news_primary_region = excluded.news_primary_region,
  news_ingestion_authorized = false
where public.official_sources.institution_code = excluded.institution_code
  and public.official_sources.platform = excluded.platform
  and public.official_sources.source_url = excluded.source_url;

do $$
declare
  activated_count integer;
begin
  select count(*)
  into activated_count
  from public.official_sources
  where id in (
    '72000000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000002',
    '72000000-0000-0000-0000-000000000003'
  )
    and institution_code = 'JIM-MYS'
    and verification_status = 'verified'
    and last_verified_at = '2026-08-11 00:00:00+08'::timestamptz
    and enabled
    and news_enabled
    and news_source_type = 'MALAYSIAN_GOVERNMENT'
    and news_source_group = 'MALAYSIAN_GOVERNMENT'
    and news_primary_region = 'MALAYSIA'
    and not news_ingestion_authorized
    and not integration_enabled
    and not is_demo;

  if activated_count <> 3 then
    raise exception 'Group B seed stopped: expected 3 exact JIM sources, found %', activated_count;
  end if;
end;
$$;

commit;
