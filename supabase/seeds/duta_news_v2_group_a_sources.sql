begin;

do $$
declare
  matched_count integer;
begin
  with expected(id, institution_code, platform, source_url) as (
    values
      ('71000000-0000-0000-0000-000000000001'::uuid, 'KBRI-KUL', 'website'::public.official_source_platform, 'https://kemlu.go.id/kualalumpur'),
      ('71000000-0000-0000-0000-000000000002'::uuid, 'KBRI-KUL', 'instagram'::public.official_source_platform, 'https://www.instagram.com/indonesiainkualalumpur/'),
      ('71000000-0000-0000-0000-000000000003'::uuid, 'KBRI-KUL', 'facebook'::public.official_source_platform, 'https://www.facebook.com/IndonesianEmbassyKualaLumpur/'),
      ('71000000-0000-0000-0000-000000000004'::uuid, 'KBRI-KUL', 'x'::public.official_source_platform, 'https://x.com/kbrikualalumpur'),
      ('71000000-0000-0000-0000-000000000005'::uuid, 'KBRI-KUL', 'youtube'::public.official_source_platform, 'https://www.youtube.com/@kbrikualalumpur'),
      ('71000000-0000-0000-0000-000000000006'::uuid, 'KJRI-JHB', 'website'::public.official_source_platform, 'https://kemlu.go.id/johorbahru'),
      ('71000000-0000-0000-0000-000000000007'::uuid, 'KJRI-JHB', 'instagram'::public.official_source_platform, 'https://www.instagram.com/indonesiainjb/'),
      ('71000000-0000-0000-0000-000000000008'::uuid, 'KJRI-JHB', 'facebook'::public.official_source_platform, 'https://www.facebook.com/IndonesianInJohorBahru/'),
      ('71000000-0000-0000-0000-000000000009'::uuid, 'KJRI-PEN', 'website'::public.official_source_platform, 'https://kemlu.go.id/penang'),
      ('71000000-0000-0000-0000-000000000010'::uuid, 'KJRI-PEN', 'instagram'::public.official_source_platform, 'https://www.instagram.com/indonesiainpenang/'),
      ('71000000-0000-0000-0000-000000000011'::uuid, 'KJRI-PEN', 'facebook'::public.official_source_platform, 'https://www.facebook.com/indonesiainpenang/'),
      ('71000000-0000-0000-0000-000000000012'::uuid, 'KJRI-PEN', 'x'::public.official_source_platform, 'https://x.com/IndonesiaPenang'),
      ('71000000-0000-0000-0000-000000000013'::uuid, 'KJRI-PEN', 'youtube'::public.official_source_platform, 'https://www.youtube.com/channel/UCQ6aLdnF6UFNDjP-1_QqHpw'),
      ('71000000-0000-0000-0000-000000000014'::uuid, 'KJRI-BKI', 'website'::public.official_source_platform, 'https://kemlu.go.id/kotakinabalu'),
      ('71000000-0000-0000-0000-000000000015'::uuid, 'KJRI-BKI', 'instagram'::public.official_source_platform, 'https://www.instagram.com/indonesiainkotakinabalu/'),
      ('71000000-0000-0000-0000-000000000016'::uuid, 'KJRI-KCH', 'website'::public.official_source_platform, 'https://kemlu.go.id/kuching'),
      ('71000000-0000-0000-0000-000000000017'::uuid, 'KJRI-KCH', 'instagram'::public.official_source_platform, 'https://www.instagram.com/indonesiainkuching/'),
      ('71000000-0000-0000-0000-000000000018'::uuid, 'KJRI-KCH', 'facebook'::public.official_source_platform, 'https://www.facebook.com/kjrikuching/'),
      ('71000000-0000-0000-0000-000000000019'::uuid, 'KRI-TWU', 'website'::public.official_source_platform, 'https://kemlu.go.id/tawau'),
      ('71000000-0000-0000-0000-000000000020'::uuid, 'KRI-TWU', 'instagram'::public.official_source_platform, 'https://www.instagram.com/indonesiaintawau/'),
      ('71000000-0000-0000-0000-000000000021'::uuid, 'KRI-TWU', 'facebook'::public.official_source_platform, 'https://www.facebook.com/konsulatritawau/'),
      ('71000000-0000-0000-0000-000000000022'::uuid, 'KRI-TWU', 'x'::public.official_source_platform, 'https://x.com/indonesiaintwu')
  )
  select count(*)
  into matched_count
  from expected
  join public.official_sources source
    on source.id = expected.id
   and source.institution_code = expected.institution_code
   and source.platform = expected.platform
   and source.source_url = expected.source_url
  where source.enabled
    and source.registry_status = 'VERIFIED'
    and source.verification_level = 'A'
    and source.verification_status = 'verified'
    and source.last_verified_at is not null
    and not source.is_demo;

  if matched_count <> 22 then
    raise exception 'Group A seed stopped: expected 22 exact verified Registry sources, found %', matched_count;
  end if;
end;
$$;

update public.official_sources
set
  news_source_type = 'INDONESIAN_GOVERNMENT',
  news_source_group = 'INDONESIAN_MISSIONS',
  news_primary_region = 'MALAYSIA',
  news_enabled = true,
  news_ingestion_authorized = false
where id in (
  '71000000-0000-0000-0000-000000000001',
  '71000000-0000-0000-0000-000000000002',
  '71000000-0000-0000-0000-000000000003',
  '71000000-0000-0000-0000-000000000004',
  '71000000-0000-0000-0000-000000000005',
  '71000000-0000-0000-0000-000000000006',
  '71000000-0000-0000-0000-000000000007',
  '71000000-0000-0000-0000-000000000008',
  '71000000-0000-0000-0000-000000000009',
  '71000000-0000-0000-0000-000000000010',
  '71000000-0000-0000-0000-000000000011',
  '71000000-0000-0000-0000-000000000012',
  '71000000-0000-0000-0000-000000000013',
  '71000000-0000-0000-0000-000000000014',
  '71000000-0000-0000-0000-000000000015',
  '71000000-0000-0000-0000-000000000016',
  '71000000-0000-0000-0000-000000000017',
  '71000000-0000-0000-0000-000000000018',
  '71000000-0000-0000-0000-000000000019',
  '71000000-0000-0000-0000-000000000020',
  '71000000-0000-0000-0000-000000000021',
  '71000000-0000-0000-0000-000000000022'
);

do $$
declare
  enabled_count integer;
begin
  select count(*)
  into enabled_count
  from public.official_sources
  where id between '71000000-0000-0000-0000-000000000001'::uuid
    and '71000000-0000-0000-0000-000000000022'::uuid
    and news_source_type = 'INDONESIAN_GOVERNMENT'
    and news_source_group = 'INDONESIAN_MISSIONS'
    and news_primary_region = 'MALAYSIA'
    and news_enabled
    and not news_ingestion_authorized;

  if enabled_count <> 22 then
    raise exception 'Group A seed stopped: expected 22 classified sources, found %', enabled_count;
  end if;
end;
$$;

commit;
