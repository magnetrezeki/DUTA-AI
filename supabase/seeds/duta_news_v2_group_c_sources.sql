begin;

do $$
declare
  conflicting_ids text;
  conflicting_urls text;
  conflicting_codes text;
begin
  with expected(id, institution_code, publisher_name, source_url) as (
    values
      ('73000000-0000-0000-0000-000000000001'::uuid, 'MEDIA-WASPADA', 'Waspada.id', 'https://www.waspada.id/'),
      ('73000000-0000-0000-0000-000000000002'::uuid, 'MEDIA-TRIBUN-MEDAN', 'Tribun Medan', 'https://medan.tribunnews.com/'),
      ('73000000-0000-0000-0000-000000000003'::uuid, 'MEDIA-HARIAN-HALUAN', 'Harian Haluan', 'https://www.harianhaluan.com/'),
      ('73000000-0000-0000-0000-000000000004'::uuid, 'MEDIA-PADANG-EKSPRES', 'Padang Ekspres', 'https://padek.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000005'::uuid, 'MEDIA-SUMEKS', 'Sumatera Ekspres / Sumeks', 'https://sumeks.disway.id/'),
      ('73000000-0000-0000-0000-000000000006'::uuid, 'MEDIA-SRIPOKU', 'Sriwijaya Post / Sripoku', 'https://palembang.tribunnews.com/'),
      ('73000000-0000-0000-0000-000000000007'::uuid, 'MEDIA-RIAU-POS', 'Riau Pos', 'https://riaupos.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000008'::uuid, 'MEDIA-BATAM-POS', 'Batam Pos', 'https://batampos.co.id/'),
      ('73000000-0000-0000-0000-000000000009'::uuid, 'MEDIA-JAWA-POS', 'Jawa Pos', 'https://www.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000010'::uuid, 'MEDIA-SURYA', 'Surya / Tribunnews Jatim', 'https://surabaya.tribunnews.com/'),
      ('73000000-0000-0000-0000-000000000011'::uuid, 'MEDIA-SUARA-MERDEKA', 'Suara Merdeka', 'https://www.suaramerdeka.com/'),
      ('73000000-0000-0000-0000-000000000012'::uuid, 'MEDIA-SOLOPOS', 'Solopos', 'https://solopos.com/'),
      ('73000000-0000-0000-0000-000000000013'::uuid, 'MEDIA-PIKIRAN-RAKYAT', 'Pikiran Rakyat', 'https://www.pikiran-rakyat.com/'),
      ('73000000-0000-0000-0000-000000000014'::uuid, 'MEDIA-KOMPAS', 'Kompas.com', 'https://www.kompas.com/'),
      ('73000000-0000-0000-0000-000000000015'::uuid, 'MEDIA-POS-KUPANG', 'Pos Kupang', 'https://kupang.tribunnews.com/'),
      ('73000000-0000-0000-0000-000000000016'::uuid, 'MEDIA-VICTORY-NEWS', 'Victory News', 'https://www.victorynews.id/'),
      ('73000000-0000-0000-0000-000000000017'::uuid, 'MEDIA-LOMBOK-POST', 'Lombok Post', 'https://lombokpost.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000018'::uuid, 'MEDIA-SUARA-NTB', 'Suara NTB', 'https://suarantb.com/'),
      ('73000000-0000-0000-0000-000000000019'::uuid, 'MEDIA-BANJARMASIN-POST', 'Banjarmasin Post', 'https://banjarmasin.tribunnews.com/'),
      ('73000000-0000-0000-0000-000000000020'::uuid, 'MEDIA-KALTIM-POST', 'Kaltim Post', 'https://kaltimpost.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000021'::uuid, 'MEDIA-PONTIANAK-POST', 'Pontianak Post', 'https://pontianakpost.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000022'::uuid, 'MEDIA-FAJAR', 'Fajar.co.id', 'https://fajar.co.id/'),
      ('73000000-0000-0000-0000-000000000023'::uuid, 'MEDIA-TRIBUN-TIMUR', 'Tribun Timur', 'https://makassar.tribunnews.com/'),
      ('73000000-0000-0000-0000-000000000024'::uuid, 'MEDIA-MANADO-POST', 'Manado Post', 'https://manadopost.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000025'::uuid, 'MEDIA-CENDERAWASIH-POS', 'Cenderawasih Pos', 'https://cenderawasihpos.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000026'::uuid, 'MEDIA-JUBI', 'Jubi.id', 'https://jubi.id/')
  )
  select string_agg(source.id::text, ', ' order by source.id)
  into conflicting_ids
  from expected
  join public.official_sources source on source.id = expected.id
  where source.institution_code is distinct from expected.institution_code
     or source.name is distinct from expected.publisher_name
     or source.source_url is distinct from expected.source_url;

  with expected(id, source_url) as (
    values
      ('73000000-0000-0000-0000-000000000001'::uuid, 'https://www.waspada.id/'), ('73000000-0000-0000-0000-000000000002'::uuid, 'https://medan.tribunnews.com/'),
      ('73000000-0000-0000-0000-000000000003'::uuid, 'https://www.harianhaluan.com/'), ('73000000-0000-0000-0000-000000000004'::uuid, 'https://padek.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000005'::uuid, 'https://sumeks.disway.id/'), ('73000000-0000-0000-0000-000000000006'::uuid, 'https://palembang.tribunnews.com/'),
      ('73000000-0000-0000-0000-000000000007'::uuid, 'https://riaupos.jawapos.com/'), ('73000000-0000-0000-0000-000000000008'::uuid, 'https://batampos.co.id/'),
      ('73000000-0000-0000-0000-000000000009'::uuid, 'https://www.jawapos.com/'), ('73000000-0000-0000-0000-000000000010'::uuid, 'https://surabaya.tribunnews.com/'),
      ('73000000-0000-0000-0000-000000000011'::uuid, 'https://www.suaramerdeka.com/'), ('73000000-0000-0000-0000-000000000012'::uuid, 'https://solopos.com/'),
      ('73000000-0000-0000-0000-000000000013'::uuid, 'https://www.pikiran-rakyat.com/'), ('73000000-0000-0000-0000-000000000014'::uuid, 'https://www.kompas.com/'),
      ('73000000-0000-0000-0000-000000000015'::uuid, 'https://kupang.tribunnews.com/'), ('73000000-0000-0000-0000-000000000016'::uuid, 'https://www.victorynews.id/'),
      ('73000000-0000-0000-0000-000000000017'::uuid, 'https://lombokpost.jawapos.com/'), ('73000000-0000-0000-0000-000000000018'::uuid, 'https://suarantb.com/'),
      ('73000000-0000-0000-0000-000000000019'::uuid, 'https://banjarmasin.tribunnews.com/'), ('73000000-0000-0000-0000-000000000020'::uuid, 'https://kaltimpost.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000021'::uuid, 'https://pontianakpost.jawapos.com/'), ('73000000-0000-0000-0000-000000000022'::uuid, 'https://fajar.co.id/'),
      ('73000000-0000-0000-0000-000000000023'::uuid, 'https://makassar.tribunnews.com/'), ('73000000-0000-0000-0000-000000000024'::uuid, 'https://manadopost.jawapos.com/'),
      ('73000000-0000-0000-0000-000000000025'::uuid, 'https://cenderawasihpos.jawapos.com/'), ('73000000-0000-0000-0000-000000000026'::uuid, 'https://jubi.id/')
  )
  select string_agg(source.id::text, ', ' order by source.id)
  into conflicting_urls
  from expected
  join public.official_sources source
    on private.news_url_canonical_v1(source.source_url) = private.news_url_canonical_v1(expected.source_url)
    or regexp_replace(replace(lower(source.source_url), '://www.', '://'), '/+$', '') = regexp_replace(replace(lower(expected.source_url), '://www.', '://'), '/+$', '')
  where source.id <> expected.id;

  with expected(id, institution_code) as (
    select ('73000000-0000-0000-0000-' || lpad(number::text, 12, '0'))::uuid,
           (array['MEDIA-WASPADA','MEDIA-TRIBUN-MEDAN','MEDIA-HARIAN-HALUAN','MEDIA-PADANG-EKSPRES','MEDIA-SUMEKS','MEDIA-SRIPOKU','MEDIA-RIAU-POS','MEDIA-BATAM-POS','MEDIA-JAWA-POS','MEDIA-SURYA','MEDIA-SUARA-MERDEKA','MEDIA-SOLOPOS','MEDIA-PIKIRAN-RAKYAT','MEDIA-KOMPAS','MEDIA-POS-KUPANG','MEDIA-VICTORY-NEWS','MEDIA-LOMBOK-POST','MEDIA-SUARA-NTB','MEDIA-BANJARMASIN-POST','MEDIA-KALTIM-POST','MEDIA-PONTIANAK-POST','MEDIA-FAJAR','MEDIA-TRIBUN-TIMUR','MEDIA-MANADO-POST','MEDIA-CENDERAWASIH-POS','MEDIA-JUBI'])[number]
    from generate_series(1, 26) number
  )
  select string_agg(source.id::text, ', ' order by source.id)
  into conflicting_codes
  from expected
  join public.official_sources source on source.institution_code = expected.institution_code
  where source.id <> expected.id;

  if conflicting_ids is not null then raise exception 'Group C seed stopped: deterministic UUID collision: %', conflicting_ids; end if;
  if conflicting_urls is not null then raise exception 'Group C seed stopped: canonical URL collision: %', conflicting_urls; end if;
  if conflicting_codes is not null then raise exception 'Group C seed stopped: institution code collision: %', conflicting_codes; end if;
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
select id, 'news', 'ID', publisher_name, source_url, 'verified',
  '2026-08-11 00:00:00+08'::timestamptz, 'manual_url', false, true, false,
  institution_code, null, null, 'website', null, source_url,
  'B', 'VERIFIED', 'P1', '["GENERAL_OFFICIAL"]'::jsonb, true,
  null, 'DUTA reviewed 2026-08-11. Primary province: ' || province || '. Source approval does not authorize ingestion or image reuse.',
  true, 'MEDIA', 'INDONESIAN_MEDIA', region, false
from (values
  ('73000000-0000-0000-0000-000000000001'::uuid, 'MEDIA-WASPADA', 'Waspada.id', 'https://www.waspada.id/', 'SUMATERA UTARA', 'SUMATERA'::public.news_region),
  ('73000000-0000-0000-0000-000000000002'::uuid, 'MEDIA-TRIBUN-MEDAN', 'Tribun Medan', 'https://medan.tribunnews.com/', 'SUMATERA UTARA', 'SUMATERA'),
  ('73000000-0000-0000-0000-000000000003'::uuid, 'MEDIA-HARIAN-HALUAN', 'Harian Haluan', 'https://www.harianhaluan.com/', 'SUMATERA BARAT', 'SUMATERA'),
  ('73000000-0000-0000-0000-000000000004'::uuid, 'MEDIA-PADANG-EKSPRES', 'Padang Ekspres', 'https://padek.jawapos.com/', 'SUMATERA BARAT', 'SUMATERA'),
  ('73000000-0000-0000-0000-000000000005'::uuid, 'MEDIA-SUMEKS', 'Sumatera Ekspres / Sumeks', 'https://sumeks.disway.id/', 'SUMATERA SELATAN', 'SUMATERA'),
  ('73000000-0000-0000-0000-000000000006'::uuid, 'MEDIA-SRIPOKU', 'Sriwijaya Post / Sripoku', 'https://palembang.tribunnews.com/', 'SUMATERA SELATAN', 'SUMATERA'),
  ('73000000-0000-0000-0000-000000000007'::uuid, 'MEDIA-RIAU-POS', 'Riau Pos', 'https://riaupos.jawapos.com/', 'RIAU', 'SUMATERA'),
  ('73000000-0000-0000-0000-000000000008'::uuid, 'MEDIA-BATAM-POS', 'Batam Pos', 'https://batampos.co.id/', 'KEPULAUAN RIAU', 'SUMATERA'),
  ('73000000-0000-0000-0000-000000000009'::uuid, 'MEDIA-JAWA-POS', 'Jawa Pos', 'https://www.jawapos.com/', 'JAWA TIMUR', 'JAWA'),
  ('73000000-0000-0000-0000-000000000010'::uuid, 'MEDIA-SURYA', 'Surya / Tribunnews Jatim', 'https://surabaya.tribunnews.com/', 'JAWA TIMUR', 'JAWA'),
  ('73000000-0000-0000-0000-000000000011'::uuid, 'MEDIA-SUARA-MERDEKA', 'Suara Merdeka', 'https://www.suaramerdeka.com/', 'JAWA TENGAH', 'JAWA'),
  ('73000000-0000-0000-0000-000000000012'::uuid, 'MEDIA-SOLOPOS', 'Solopos', 'https://solopos.com/', 'JAWA TENGAH', 'JAWA'),
  ('73000000-0000-0000-0000-000000000013'::uuid, 'MEDIA-PIKIRAN-RAKYAT', 'Pikiran Rakyat', 'https://www.pikiran-rakyat.com/', 'JAWA BARAT', 'JAWA'),
  ('73000000-0000-0000-0000-000000000014'::uuid, 'MEDIA-KOMPAS', 'Kompas.com', 'https://www.kompas.com/', 'NASIONAL', 'NASIONAL'),
  ('73000000-0000-0000-0000-000000000015'::uuid, 'MEDIA-POS-KUPANG', 'Pos Kupang', 'https://kupang.tribunnews.com/', 'NUSA TENGGARA TIMUR', 'NTT'),
  ('73000000-0000-0000-0000-000000000016'::uuid, 'MEDIA-VICTORY-NEWS', 'Victory News', 'https://www.victorynews.id/', 'NUSA TENGGARA TIMUR', 'NTT'),
  ('73000000-0000-0000-0000-000000000017'::uuid, 'MEDIA-LOMBOK-POST', 'Lombok Post', 'https://lombokpost.jawapos.com/', 'NUSA TENGGARA BARAT', 'NTB'),
  ('73000000-0000-0000-0000-000000000018'::uuid, 'MEDIA-SUARA-NTB', 'Suara NTB', 'https://suarantb.com/', 'NUSA TENGGARA BARAT', 'NTB'),
  ('73000000-0000-0000-0000-000000000019'::uuid, 'MEDIA-BANJARMASIN-POST', 'Banjarmasin Post', 'https://banjarmasin.tribunnews.com/', 'KALIMANTAN SELATAN', 'KALIMANTAN'),
  ('73000000-0000-0000-0000-000000000020'::uuid, 'MEDIA-KALTIM-POST', 'Kaltim Post', 'https://kaltimpost.jawapos.com/', 'KALIMANTAN TIMUR', 'KALIMANTAN'),
  ('73000000-0000-0000-0000-000000000021'::uuid, 'MEDIA-PONTIANAK-POST', 'Pontianak Post', 'https://pontianakpost.jawapos.com/', 'KALIMANTAN BARAT', 'KALIMANTAN'),
  ('73000000-0000-0000-0000-000000000022'::uuid, 'MEDIA-FAJAR', 'Fajar.co.id', 'https://fajar.co.id/', 'SULAWESI SELATAN', 'SULAWESI'),
  ('73000000-0000-0000-0000-000000000023'::uuid, 'MEDIA-TRIBUN-TIMUR', 'Tribun Timur', 'https://makassar.tribunnews.com/', 'SULAWESI SELATAN', 'SULAWESI'),
  ('73000000-0000-0000-0000-000000000024'::uuid, 'MEDIA-MANADO-POST', 'Manado Post', 'https://manadopost.jawapos.com/', 'SULAWESI UTARA', 'SULAWESI'),
  ('73000000-0000-0000-0000-000000000025'::uuid, 'MEDIA-CENDERAWASIH-POS', 'Cenderawasih Pos', 'https://cenderawasihpos.jawapos.com/', 'PAPUA', 'PAPUA'),
  ('73000000-0000-0000-0000-000000000026'::uuid, 'MEDIA-JUBI', 'Jubi.id', 'https://jubi.id/', 'PAPUA', 'PAPUA')
) as expected(id, institution_code, publisher_name, source_url, province, region)
on conflict (id) do update set
  news_enabled = excluded.news_enabled,
  news_source_type = excluded.news_source_type,
  news_source_group = excluded.news_source_group,
  news_primary_region = excluded.news_primary_region,
  news_ingestion_authorized = false
where public.official_sources.institution_code = excluded.institution_code
  and public.official_sources.name = excluded.name
  and public.official_sources.source_url = excluded.source_url;

do $$
declare
  activated_count integer;
begin
  select count(*) into activated_count
  from public.official_sources
  where id between '73000000-0000-0000-0000-000000000001'::uuid and '73000000-0000-0000-0000-000000000026'::uuid
    and country_code = 'ID'
    and verification_status = 'verified'
    and last_verified_at = '2026-08-11 00:00:00+08'::timestamptz
    and enabled and news_enabled
    and news_source_type = 'MEDIA'
    and news_source_group = 'INDONESIAN_MEDIA'
    and news_primary_region in ('NASIONAL','SUMATERA','JAWA','NTT','NTB','KALIMANTAN','SULAWESI','PAPUA')
    and not news_ingestion_authorized
    and not integration_enabled
    and not is_demo;

  if activated_count <> 26 then
    raise exception 'Group C seed stopped: expected 26 exact regional-media sources, found %', activated_count;
  end if;
end;
$$;

commit;
