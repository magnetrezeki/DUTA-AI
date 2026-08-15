-- LAYANAN-2G SELECT-only exact-identity preflight.
-- verification_event_id_collisions are reported per deterministic event row.
-- open_package_conflicts covers every expected office, jurisdiction, and service.
-- Run before the dual-provenance migration and population package.
with
expected_office(id, mission_code, country_code, source_id) as (
  values
    ('75000000-0000-0000-0000-000000000001'::uuid,'KBRI-KUL','MY','71000000-0000-0000-0000-000000000001'::uuid),
    ('75000000-0000-0000-0000-000000000002','KJRI-JHB','MY','71000000-0000-0000-0000-000000000006'),
    ('75000000-0000-0000-0000-000000000003','KJRI-PEN','MY','71000000-0000-0000-0000-000000000009'),
    ('75000000-0000-0000-0000-000000000004','KJRI-KCH','MY','71000000-0000-0000-0000-000000000016'),
    ('75000000-0000-0000-0000-000000000005','KJRI-BKI','MY','71000000-0000-0000-0000-000000000014'),
    ('75000000-0000-0000-0000-000000000006','KRI-TWU','MY','71000000-0000-0000-0000-000000000019')
),
expected_jurisdiction(id, office_id, state_normalized, district_normalized, jurisdiction_type) as (
  select ('75100000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid,
    case when n<=6 then '75000000-0000-0000-0000-000000000001'::uuid when n<=10 then '75000000-0000-0000-0000-000000000002'::uuid when n<=13 then '75000000-0000-0000-0000-000000000003'::uuid when n=14 then '75000000-0000-0000-0000-000000000004'::uuid when n=15 or n>=21 then '75000000-0000-0000-0000-000000000005'::uuid else '75000000-0000-0000-0000-000000000006'::uuid end,
    (array['kuala lumpur','putrajaya','selangor','perak','kelantan','terengganu','johor','melaka','negeri sembilan','pahang','pulau pinang','kedah','perlis','sarawak','wp labuan','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah'])[n],
    (array[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'tawau','kunak','semporna','lahad datu','kalabakan','beluran','beaufort','keningau','kinabatangan','kota belud','kota kinabalu','kota marudu','kuala penyu','kudat','nabawan','papar','penampang','pitas','putatan','ranau','sandakan','sipitang','tambunan','telupid','tenom','tongod','tuaran']::text[])[n],
    case when n in (1,2,15) then 'FEDERAL_TERRITORY' when n between 16 and 42 then 'DISTRICT' else 'STATE_WIDE' end
  from generate_series(1,42) n
),
expected_category(id, service_code, slug, intent_group, name) as (
 values
 ('75300000-0000-0000-0000-000000000001'::uuid,'IMMIGRATION','imigrasi','DOCUMENTS','Imigrasi'),
 ('75300000-0000-0000-0000-000000000002','CONSULAR','konsuler','CONSULAR','Konsuler'),
 ('75300000-0000-0000-0000-000000000003','LEGALIZATION','legalisasi','DOCUMENTS','Legalisasi'),
 ('75300000-0000-0000-0000-000000000004','EMPLOYMENT','ketenagakerjaan','PROTECTION','Ketenagakerjaan'),
 ('75300000-0000-0000-0000-000000000005','CITIZENSHIP','kewarganegaraan','CONSULAR','Kewarganegaraan'),
 ('75300000-0000-0000-0000-000000000006','MARITIME','perhubungan','DOCUMENTS','Perhubungan/Maritim'),
 ('75300000-0000-0000-0000-000000000007','PROTECTION','perlindungan','PROTECTION','Perlindungan WNI')
),
expected_service(id, mission_code, service_code, provenance_class) as (
 values
 ('75400000-0000-0000-0000-000000000001'::uuid,'KBRI-KUL','IMMIGRATION','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000002','KBRI-KUL','CONSULAR','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000003','KBRI-KUL','LEGALIZATION','DUTA_REVIEWED_VERIFIED'),('75400000-0000-0000-0000-000000000004','KBRI-KUL','EMPLOYMENT','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000005','KBRI-KUL','CITIZENSHIP','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000006','KBRI-KUL','MARITIME','OFFICIAL_SOURCE_VERIFIED'),
 ('75400000-0000-0000-0000-000000000007','KJRI-JHB','CONSULAR','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000008','KJRI-JHB','EMPLOYMENT','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000009','KJRI-JHB','CITIZENSHIP','DUTA_REVIEWED_VERIFIED'),('75400000-0000-0000-0000-000000000010','KJRI-JHB','MARITIME','DUTA_REVIEWED_VERIFIED'),('75400000-0000-0000-0000-000000000011','KJRI-JHB','IMMIGRATION','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000012','KJRI-JHB','PROTECTION','OFFICIAL_SOURCE_VERIFIED'),
 ('75400000-0000-0000-0000-000000000013','KJRI-PEN','CONSULAR','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000014','KJRI-PEN','PROTECTION','DUTA_REVIEWED_VERIFIED'),
 ('75400000-0000-0000-0000-000000000015','KJRI-KCH','PROTECTION','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000016','KJRI-KCH','EMPLOYMENT','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000017','KJRI-KCH','IMMIGRATION','OFFICIAL_SOURCE_VERIFIED'),
 ('75400000-0000-0000-0000-000000000018','KJRI-BKI','IMMIGRATION','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000019','KJRI-BKI','CONSULAR','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000020','KJRI-BKI','LEGALIZATION','DUTA_REVIEWED_VERIFIED'),('75400000-0000-0000-0000-000000000021','KJRI-BKI','MARITIME','DUTA_REVIEWED_VERIFIED'),('75400000-0000-0000-0000-000000000022','KJRI-BKI','CITIZENSHIP','DUTA_REVIEWED_VERIFIED'),
 ('75400000-0000-0000-0000-000000000023','KRI-TWU','IMMIGRATION','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000024','KRI-TWU','CONSULAR','OFFICIAL_SOURCE_VERIFIED'),('75400000-0000-0000-0000-000000000025','KRI-TWU','LEGALIZATION','DUTA_REVIEWED_VERIFIED'),('75400000-0000-0000-0000-000000000026','KRI-TWU','EMPLOYMENT','DUTA_REVIEWED_VERIFIED'),('75400000-0000-0000-0000-000000000027','KRI-TWU','CITIZENSHIP','DUTA_REVIEWED_VERIFIED'),('75400000-0000-0000-0000-000000000028','KRI-TWU','MARITIME','DUTA_REVIEWED_VERIFIED')
),
expected_evidence(id,source_id,target_type,target_id,evidence_url) as (
 select ('75620000-0000-0000-0000-'||right(o.id::text,12))::uuid,o.source_id,'representative_office',o.id,
   (array['https://www.kemlu.go.id/kualalumpur/id','https://www.kemlu.go.id/johorbahru','https://kemlu.go.id/penang/berita/maklumat-pelayanan?type=publication','https://kemlu.go.id/kuching/kontak','https://kemlu.go.id/kotakinabalu','https://kemlu.go.id/perwakilan/67c6a1e7ce56d3d6fa748ab6d9af3fd7?type=perwakilan-detail'])[right(o.id::text,12)::integer]
 from expected_office o
 union all
 select e.id,'71000000-0000-0000-0000-000000000019'::uuid,'office_jurisdiction',e.target_id,'https://kemlu.go.id/tawau/tawau/berita/konsulat-ri-tawau-perkuat-perlindungan-wni-melalui-pelaksanaan-sidang-itsbat-nikah-bagi-225-pasangan-di-wilayah-kerja?type=publication'
 from (values
  ('75600000-0000-0000-0000-000000000002'::uuid,'75100000-0000-0000-0000-000000000016'::uuid),('75600000-0000-0000-0000-000000000003','75100000-0000-0000-0000-000000000020'),('75600000-0000-0000-0000-000000000004','75100000-0000-0000-0000-000000000017'),('75600000-0000-0000-0000-000000000005','75100000-0000-0000-0000-000000000019'),('75600000-0000-0000-0000-000000000006','75100000-0000-0000-0000-000000000018')
 ) e(id,target_id)
 union all
 select ('75610000-0000-0000-0000-'||lpad(row_number() over(order by s.id)::text,12,'0'))::uuid,o.source_id,'mission_service',s.id,
  case
   when s.id between '75400000-0000-0000-0000-000000000001' and '75400000-0000-0000-0000-000000000006' then 'https://www.kemlu.go.id/kualalumpur/id'
   when s.id between '75400000-0000-0000-0000-000000000007' and '75400000-0000-0000-0000-000000000012' then 'https://kemlu.go.id/johorbahru/pelayanan-perwakilan/virtual-hotline-ksatria-'
   when s.id='75400000-0000-0000-0000-000000000013' then 'https://kemlu.go.id/penang/berita/maklumat-pelayanan?type=publication'
   when s.id in ('75400000-0000-0000-0000-000000000015','75400000-0000-0000-0000-000000000016') then 'https://kemlu.go.id/kuching/berita/nomor-hotline-layanan-publik-kjri-kuching?type=publication'
   when s.id='75400000-0000-0000-0000-000000000017' then 'https://www.kemlu.go.id/kuching'
   when s.id in ('75400000-0000-0000-0000-000000000018','75400000-0000-0000-0000-000000000019') then 'https://kemlu.go.id/kotakinabalu'
   when s.id='75400000-0000-0000-0000-000000000023' then 'https://kemlu.go.id/tawau/tawau/berita/pelayanan-paspor-kri-tawau-tahun-2026?type=publication'
   else 'https://www.peduliwni.kemlu.go.id/informasi_pelayanan/app/detail_kbri/.html?perwakilan_id=NjkzMw%3D%3D' end
 from expected_service s join expected_office o on o.mission_code=s.mission_code where s.provenance_class='OFFICIAL_SOURCE_VERIFIED'
),
office_result as (
 select 'office' kind,e.id,e.mission_code identity,
  case when not source.enabled or source.registry_status<>'VERIFIED' or source.verification_level not in ('A','B') then 'FAIL' when o.id is null and natural_match.id is null then 'AVAILABLE' when o.id=e.id and o.mission_code=e.mission_code and o.country_code=e.country_code and o.source_id=e.source_id and not o.is_demo and natural_match.id=e.id then 'EXACT_EXISTING' else 'FAIL' end result
 from expected_office e join public.official_sources source on source.id=e.source_id left join public.representative_offices o on o.id=e.id left join public.representative_offices natural_match on natural_match.mission_code=e.mission_code and natural_match.country_code=e.country_code
),
jurisdiction_result as (
 select 'jurisdiction' kind,e.id,concat(e.state_normalized,'/',coalesce(e.district_normalized,'*')) identity,
  case when j.id is null and natural_match.id is null then 'AVAILABLE' when j.id=e.id and j.office_id=e.office_id and j.country_code='MY' and j.state_normalized=e.state_normalized and j.district_normalized is not distinct from e.district_normalized and j.jurisdiction_type::text=e.jurisdiction_type and not j.is_demo and natural_match.id=e.id then 'EXACT_EXISTING' else 'FAIL' end result
 from expected_jurisdiction e left join public.office_jurisdictions j on j.id=e.id left join public.office_jurisdictions natural_match on natural_match.office_id=e.office_id and natural_match.country_code='MY' and natural_match.state_normalized=e.state_normalized and natural_match.district_normalized is not distinct from e.district_normalized and natural_match.jurisdiction_type::text=e.jurisdiction_type
),
category_result as (
 select 'category' kind,e.id,e.service_code identity,
  case when c.id is null and natural_match.id is null then 'AVAILABLE' when c.id=e.id and c.service_code=e.service_code and c.slug=e.slug and c.intent_group=e.intent_group and c.name=e.name and not c.is_demo and natural_match.id=e.id then 'EXACT_EXISTING' else 'FAIL' end result
 from expected_category e left join public.service_categories c on c.id=e.id left join public.service_categories natural_match on natural_match.service_code=e.service_code or natural_match.slug=e.slug
),
service_result as (
 select 'mission_service' kind,e.id,concat(e.mission_code,'/',e.service_code,'/',e.provenance_class) identity,
  case when s.id is null and natural_match.id is null then 'AVAILABLE' when s.id=e.id and o.mission_code=e.mission_code and c.service_code=e.service_code and natural_match.id=e.id then 'EXACT_EXISTING' else 'FAIL' end result
 from expected_service e join expected_office eo on eo.mission_code=e.mission_code join expected_category ec on ec.service_code=e.service_code
 left join public.mission_services s on s.id=e.id left join public.representative_offices o on o.id=s.office_id left join public.service_categories c on c.id=s.service_category_id
 left join public.mission_services natural_match on natural_match.office_id=eo.id and natural_match.service_category_id=ec.id
),
evidence_result as (
 select 'evidence' kind,e.id,concat(e.target_type,'/',e.target_id,'/',e.evidence_url) identity,
  case when a.id is null then 'AVAILABLE' when a.official_source_id=e.source_id and a.evidence_url=e.evidence_url and
   case e.target_type when 'representative_office' then a.representative_office_id=e.target_id and a.office_jurisdiction_id is null and a.mission_service_id is null when 'office_jurisdiction' then a.office_jurisdiction_id=e.target_id and a.representative_office_id is null and a.mission_service_id is null else a.mission_service_id=e.target_id and a.representative_office_id is null and a.office_jurisdiction_id is null end then 'EXACT_EXISTING' else 'FAIL' end result
 from expected_evidence e left join public.official_service_evidence a on a.id=e.id
),
event_result as (
 select 'verification_event' kind,('75710000-0000-0000-0000-'||right(e.id::text,12))::uuid id,concat(e.id,'/',e.provenance_class,'/APPROVED/PRODUCT_OWNER') identity,
  case when v.id is null then 'AVAILABLE' when (to_jsonb(v)->>'mission_service_id')::uuid=e.id and to_jsonb(v)->>'event_type'='VERIFIED' and to_jsonb(v)->>'new_status'=case when e.provenance_class='OFFICIAL_SOURCE_VERIFIED' then 'VERIFIED_OFFICIAL' else 'VERIFIED_CURRENT' end and to_jsonb(v)->>'provenance_class'=e.provenance_class and to_jsonb(v)->>'review_decision'='APPROVED' and to_jsonb(v)->>'reviewer_role'='PRODUCT_OWNER' and ((e.provenance_class='DUTA_REVIEWED_VERIFIED' and to_jsonb(v)->>'manifest_reference'='docs/data/duta-layanan-2d-product-owner-decision.json' and to_jsonb(v)->>'evidence_id' is null) or (e.provenance_class='OFFICIAL_SOURCE_VERIFIED' and to_jsonb(v)->>'evidence_id' is not null)) then 'EXACT_EXISTING' else 'FAIL' end result
 from expected_service e left join public.service_verification_events v on v.id=('75710000-0000-0000-0000-'||right(e.id::text,12))::uuid
),
jurisdiction_event_result as (
 select 'verification_event' kind,('75720000-0000-0000-0000-'||right(e.id::text,12))::uuid id,concat(e.id,'/APPROVED/PRODUCT_OWNER') identity,
  case when v.id is null then 'AVAILABLE' when (to_jsonb(v)->>'office_jurisdiction_id')::uuid=e.id and to_jsonb(v)->>'event_type'='VERIFIED' and to_jsonb(v)->>'new_status'=case when right(e.id::text,12)::bigint between 16 and 20 then 'VERIFIED_OFFICIAL' else 'VERIFIED_CURRENT' end and to_jsonb(v)->>'review_decision'='APPROVED' and to_jsonb(v)->>'reviewer_role'='PRODUCT_OWNER' and to_jsonb(v)->>'provenance_class'=case when right(e.id::text,12)::bigint between 16 and 20 then 'OFFICIAL_SOURCE_VERIFIED' else 'DUTA_REVIEWED_VERIFIED' end and ((right(e.id::text,12)::bigint between 16 and 20 and to_jsonb(v)->>'evidence_id' is not null) or (right(e.id::text,12)::bigint not between 16 and 20 and to_jsonb(v)->>'manifest_reference'='src/config/malaysia-jurisdictions.ts' and to_jsonb(v)->>'evidence_id' is null)) then 'EXACT_EXISTING' else 'FAIL' end result
 from expected_jurisdiction e left join public.service_verification_events v on v.id=('75720000-0000-0000-0000-'||right(e.id::text,12))::uuid
),
conflicts as (
 select count(*) n from public.service_data_conflicts c where c.status='OPEN' and (c.representative_office_id in (select id from expected_office) or c.office_jurisdiction_id in (select id from expected_jurisdiction) or c.mission_service_id in (select id from expected_service))
),
results as (
 select * from office_result union all select * from jurisdiction_result union all select * from category_result union all select * from service_result union all select * from evidence_result union all select * from event_result union all select * from jurisdiction_event_result
)
select kind,id,identity,result from results
union all select 'package_contract',null::uuid,'contact_writes=0','PASS'
union all select 'open_conflicts',null::uuid,'office+jurisdiction+mission_service',case when n=0 then 'PASS' else 'FAIL:'||n end from conflicts
order by kind,id;
