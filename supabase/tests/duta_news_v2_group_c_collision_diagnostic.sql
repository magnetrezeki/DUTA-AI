with expected(id, institution_code, publisher_name, source_url, aliases) as (
  values
    ('73000000-0000-0000-0000-000000000001'::uuid, 'MEDIA-WASPADA'::text, 'Waspada.id'::text, 'https://www.waspada.id/'::text, array['waspada.id','harian waspada']::text[]),
    ('73000000-0000-0000-0000-000000000002'::uuid, 'MEDIA-TRIBUN-MEDAN', 'Tribun Medan', 'https://medan.tribunnews.com/', array['tribun medan']),
    ('73000000-0000-0000-0000-000000000003'::uuid, 'MEDIA-HARIAN-HALUAN', 'Harian Haluan', 'https://www.harianhaluan.com/', array['harian haluan']),
    ('73000000-0000-0000-0000-000000000004'::uuid, 'MEDIA-PADANG-EKSPRES', 'Padang Ekspres', 'https://padek.jawapos.com/', array['padang ekspres','padek']),
    ('73000000-0000-0000-0000-000000000005'::uuid, 'MEDIA-SUMEKS', 'Sumatera Ekspres / Sumeks', 'https://sumeks.disway.id/', array['sumatera ekspres','sumeks','sumeks.co']),
    ('73000000-0000-0000-0000-000000000006'::uuid, 'MEDIA-SRIPOKU', 'Sriwijaya Post / Sripoku', 'https://palembang.tribunnews.com/', array['sriwijaya post','sripoku','sripoku.com']),
    ('73000000-0000-0000-0000-000000000007'::uuid, 'MEDIA-RIAU-POS', 'Riau Pos', 'https://riaupos.jawapos.com/', array['riau pos']),
    ('73000000-0000-0000-0000-000000000008'::uuid, 'MEDIA-BATAM-POS', 'Batam Pos', 'https://batampos.co.id/', array['batam pos']),
    ('73000000-0000-0000-0000-000000000009'::uuid, 'MEDIA-JAWA-POS', 'Jawa Pos', 'https://www.jawapos.com/', array['jawa pos','jawapos.com']),
    ('73000000-0000-0000-0000-000000000010'::uuid, 'MEDIA-SURYA', 'Surya / Tribunnews Jatim', 'https://surabaya.tribunnews.com/', array['surya','surya malang','tribunnews jatim']),
    ('73000000-0000-0000-0000-000000000011'::uuid, 'MEDIA-SUARA-MERDEKA', 'Suara Merdeka', 'https://www.suaramerdeka.com/', array['suara merdeka','suaramerdeka.com']),
    ('73000000-0000-0000-0000-000000000012'::uuid, 'MEDIA-SOLOPOS', 'Solopos', 'https://solopos.com/', array['solopos','solopos.com']),
    ('73000000-0000-0000-0000-000000000013'::uuid, 'MEDIA-PIKIRAN-RAKYAT', 'Pikiran Rakyat', 'https://www.pikiran-rakyat.com/', array['pikiran rakyat','pikiran-rakyat.com']),
    ('73000000-0000-0000-0000-000000000014'::uuid, 'MEDIA-KOMPAS', 'Kompas.com', 'https://www.kompas.com/', array['kompas.com','kompas online']),
    ('73000000-0000-0000-0000-000000000015'::uuid, 'MEDIA-POS-KUPANG', 'Pos Kupang', 'https://kupang.tribunnews.com/', array['pos kupang']),
    ('73000000-0000-0000-0000-000000000016'::uuid, 'MEDIA-VICTORY-NEWS', 'Victory News', 'https://www.victorynews.id/', array['victory news','victorynews.id']),
    ('73000000-0000-0000-0000-000000000017'::uuid, 'MEDIA-LOMBOK-POST', 'Lombok Post', 'https://lombokpost.jawapos.com/', array['lombok post']),
    ('73000000-0000-0000-0000-000000000018'::uuid, 'MEDIA-SUARA-NTB', 'Suara NTB', 'https://suarantb.com/', array['suara ntb','suarantb.com']),
    ('73000000-0000-0000-0000-000000000019'::uuid, 'MEDIA-BANJARMASIN-POST', 'Banjarmasin Post', 'https://banjarmasin.tribunnews.com/', array['banjarmasin post']),
    ('73000000-0000-0000-0000-000000000020'::uuid, 'MEDIA-KALTIM-POST', 'Kaltim Post', 'https://kaltimpost.jawapos.com/', array['kaltim post']),
    ('73000000-0000-0000-0000-000000000021'::uuid, 'MEDIA-PONTIANAK-POST', 'Pontianak Post', 'https://pontianakpost.jawapos.com/', array['pontianak post']),
    ('73000000-0000-0000-0000-000000000022'::uuid, 'MEDIA-FAJAR', 'Fajar.co.id', 'https://fajar.co.id/', array['fajar','fajar.co.id','harian fajar']),
    ('73000000-0000-0000-0000-000000000023'::uuid, 'MEDIA-TRIBUN-TIMUR', 'Tribun Timur', 'https://makassar.tribunnews.com/', array['tribun timur']),
    ('73000000-0000-0000-0000-000000000024'::uuid, 'MEDIA-MANADO-POST', 'Manado Post', 'https://manadopost.jawapos.com/', array['manado post','manadopost']),
    ('73000000-0000-0000-0000-000000000025'::uuid, 'MEDIA-CENDERAWASIH-POS', 'Cenderawasih Pos', 'https://cenderawasihpos.jawapos.com/', array['cenderawasih pos','cepos']),
    ('73000000-0000-0000-0000-000000000026'::uuid, 'MEDIA-JUBI', 'Jubi.id', 'https://jubi.id/', array['jubi','jubi.id','tabloid jubi'])
),
diagnostic as (
  select
    expected.id as expected_id,
    expected.institution_code as expected_institution_code,
    expected.publisher_name as expected_publisher,
    expected.source_url as expected_url,
    source.id as existing_id,
    source.institution_code as existing_institution_code,
    source.name as existing_name,
    source.source_url as existing_url,
    case
      when source.id = expected.id
        and source.institution_code = expected.institution_code
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
      when source.institution_code = expected.institution_code then 'INSTITUTION_CODE_COLLISION'
      when lower(source.name) = any(expected.aliases) then 'PUBLISHER_ALIAS_COLLISION'
      else 'POSSIBLE_PUBLISHER_ALIAS'
    end as diagnostic_status
  from expected
  join public.official_sources source
    on source.id = expected.id
    or source.source_url = expected.source_url
    or private.news_url_canonical_v1(source.source_url)
      = private.news_url_canonical_v1(expected.source_url)
    or regexp_replace(replace(lower(source.source_url), '://www.', '://'), '/+$', '')
      = regexp_replace(replace(lower(expected.source_url), '://www.', '://'), '/+$', '')
    or source.institution_code = expected.institution_code
    or lower(source.name) = any(expected.aliases)
)
select
  expected.id as expected_id,
  expected.institution_code as expected_institution_code,
  expected.publisher_name as expected_publisher,
  expected.source_url as expected_url,
  coalesce(diagnostic.diagnostic_status, 'NO_COLLISION_FOUND') as diagnostic_status,
  diagnostic.existing_id,
  diagnostic.existing_institution_code,
  diagnostic.existing_name,
  diagnostic.existing_url
from expected
left join diagnostic
  on diagnostic.expected_id = expected.id
 and diagnostic.expected_institution_code = expected.institution_code
 and diagnostic.expected_publisher = expected.publisher_name
 and diagnostic.expected_url = expected.source_url
order by expected.id, diagnostic.diagnostic_status, diagnostic.existing_id;
