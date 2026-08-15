begin;

-- Product-owner decision timestamp only; it is not an external publication date.
do $$ begin
  if (select count(*) from public.representative_offices where id::text like '75000000-0000-0000-0000-00000000000%' and is_demo=false) <> 6
    or (select count(*) from public.office_jurisdictions where id::text like '75100000-0000-0000-0000-0000000000%' and is_demo=false) <> 42
  then raise exception 'LAYANAN_2D_FROZEN_PARENT_SET_MISSING'; end if;
end $$;

-- Six office identities have exact first-party locators. Existing office rows are
-- updated only after their frozen ID/mission/source identities are proved intact.
do $$ begin
 if exists (
   select 1 from (values
    ('75000000-0000-0000-0000-000000000001'::uuid,'KBRI-KUL','71000000-0000-0000-0000-000000000001'::uuid),
    ('75000000-0000-0000-0000-000000000002','KJRI-JHB','71000000-0000-0000-0000-000000000006'),
    ('75000000-0000-0000-0000-000000000003','KJRI-PEN','71000000-0000-0000-0000-000000000009'),
    ('75000000-0000-0000-0000-000000000004','KJRI-KCH','71000000-0000-0000-0000-000000000016'),
    ('75000000-0000-0000-0000-000000000005','KJRI-BKI','71000000-0000-0000-0000-000000000014'),
    ('75000000-0000-0000-0000-000000000006','KRI-TWU','71000000-0000-0000-0000-000000000019')
   ) expected(id,mission_code,source_id)
   left join public.representative_offices office on office.id=expected.id
   where office.id is null or office.mission_code is distinct from expected.mission_code
      or office.source_id is distinct from expected.source_id or office.country_code<>'MY' or office.is_demo
 ) then raise exception 'LAYANAN_2D_OFFICE_IDENTITY_COLLISION'; end if;
end $$;

update public.representative_offices
set verification_status='verified', last_verified_at='2026-08-15 00:00:00+08',
    publishability_status='VERIFIED_OFFICIAL', enabled=true, updated_at=now()
where id::text like '75000000-0000-0000-0000-00000000000%';

-- Existing evidence IDs are reusable only when the complete trusted mapping is exact.
do $$ begin
 if exists (select 1 from public.official_service_evidence e where e.id::text like '75620000-%' and not (
   e.id=('75620000-0000-0000-0000-'||right(e.representative_office_id::text,12))::uuid
   and e.official_source_id=(select o.source_id from public.representative_offices o where o.id=e.representative_office_id)
   and e.office_jurisdiction_id is null and e.mission_service_id is null and e.evidence_url is not null
 )) then raise exception 'LAYANAN_2G_OFFICE_EVIDENCE_IDENTITY_COLLISION'; end if;
end $$;

with office_evidence(id,office_id,source_id,url) as (values
 ('75620000-0000-0000-0000-000000000001'::uuid,'75000000-0000-0000-0000-000000000001'::uuid,'71000000-0000-0000-0000-000000000001'::uuid,'https://www.kemlu.go.id/kualalumpur/id'),
 ('75620000-0000-0000-0000-000000000002','75000000-0000-0000-0000-000000000002','71000000-0000-0000-0000-000000000006','https://www.kemlu.go.id/johorbahru'),
 ('75620000-0000-0000-0000-000000000003','75000000-0000-0000-0000-000000000003','71000000-0000-0000-0000-000000000009','https://kemlu.go.id/penang/berita/maklumat-pelayanan?type=publication'),
 ('75620000-0000-0000-0000-000000000004','75000000-0000-0000-0000-000000000004','71000000-0000-0000-0000-000000000016','https://kemlu.go.id/kuching/kontak'),
 ('75620000-0000-0000-0000-000000000005','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','https://kemlu.go.id/kotakinabalu'),
 ('75620000-0000-0000-0000-000000000006','75000000-0000-0000-0000-000000000006','71000000-0000-0000-0000-000000000019','https://kemlu.go.id/perwakilan/67c6a1e7ce56d3d6fa748ab6d9af3fd7?type=perwakilan-detail')
)
insert into public.official_service_evidence(id,official_source_id,representative_office_id,evidence_url,evidence_note,observed_at)
select id,source_id,office_id,url,'LAYANAN-2D target-scoped office identity evidence','2026-08-15 00:00:00+08'
from office_evidence on conflict(id) do update set evidence_note=excluded.evidence_note
where official_service_evidence.official_source_id=excluded.official_source_id
  and official_service_evidence.representative_office_id=excluded.representative_office_id
  and official_service_evidence.evidence_url=excluded.evidence_url
  and official_service_evidence.office_jurisdiction_id is null
  and official_service_evidence.mission_service_id is null;

do $$ begin
 if exists (
  select 1 from (values
   ('75620000-0000-0000-0000-000000000001'::uuid,'75000000-0000-0000-0000-000000000001'::uuid,'71000000-0000-0000-0000-000000000001'::uuid,'https://www.kemlu.go.id/kualalumpur/id'),
   ('75620000-0000-0000-0000-000000000002','75000000-0000-0000-0000-000000000002','71000000-0000-0000-0000-000000000006','https://www.kemlu.go.id/johorbahru'),
   ('75620000-0000-0000-0000-000000000003','75000000-0000-0000-0000-000000000003','71000000-0000-0000-0000-000000000009','https://kemlu.go.id/penang/berita/maklumat-pelayanan?type=publication'),
   ('75620000-0000-0000-0000-000000000004','75000000-0000-0000-0000-000000000004','71000000-0000-0000-0000-000000000016','https://kemlu.go.id/kuching/kontak'),
   ('75620000-0000-0000-0000-000000000005','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','https://kemlu.go.id/kotakinabalu'),
   ('75620000-0000-0000-0000-000000000006','75000000-0000-0000-0000-000000000006','71000000-0000-0000-0000-000000000019','https://kemlu.go.id/perwakilan/67c6a1e7ce56d3d6fa748ab6d9af3fd7?type=perwakilan-detail')
  ) x(id,target_id,source_id,url) left join public.official_service_evidence e on e.id=x.id
  where e.id is null or e.representative_office_id<>x.target_id or e.official_source_id<>x.source_id or e.evidence_url<>x.url or e.office_jurisdiction_id is not null or e.mission_service_id is not null
 ) then raise exception 'LAYANAN_2G_OFFICE_EVIDENCE_EXACT_ASSERTION_FAILED'; end if;
end $$;

-- Fail before any category write if either deterministic or natural identity is
-- already bound to a different semantic category.
do $$ begin
 if exists (
  select 1 from (values
   ('75300000-0000-0000-0000-000000000001'::uuid,'imigrasi','Imigrasi','IMMIGRATION','DOCUMENTS'),
   ('75300000-0000-0000-0000-000000000002','konsuler','Konsuler','CONSULAR','CONSULAR'),
   ('75300000-0000-0000-0000-000000000003','legalisasi','Legalisasi','LEGALIZATION','DOCUMENTS'),
   ('75300000-0000-0000-0000-000000000004','ketenagakerjaan','Ketenagakerjaan','EMPLOYMENT','PROTECTION'),
   ('75300000-0000-0000-0000-000000000005','kewarganegaraan','Kewarganegaraan','CITIZENSHIP','CONSULAR'),
   ('75300000-0000-0000-0000-000000000006','perhubungan','Perhubungan/Maritim','MARITIME','DOCUMENTS'),
   ('75300000-0000-0000-0000-000000000007','perlindungan','Perlindungan WNI','PROTECTION','PROTECTION')
  ) e(id,slug,name,service_code,intent_group)
  left join public.service_categories by_id on by_id.id=e.id
  left join public.service_categories natural_match on natural_match.service_code=e.service_code or natural_match.slug=e.slug
  where (by_id.id is not null and (by_id.slug<>e.slug or by_id.name<>e.name or by_id.service_code<>e.service_code or by_id.intent_group<>e.intent_group or by_id.is_demo))
     or (natural_match.id is not null and natural_match.id<>e.id)
 ) then raise exception 'LAYANAN_2G_CATEGORY_SEMANTIC_COLLISION'; end if;
end $$;

insert into public.service_categories(id,slug,name,is_active,is_demo,service_code,intent_group,display_order)
values
 ('75300000-0000-0000-0000-000000000001','imigrasi','Imigrasi',true,false,'IMMIGRATION','DOCUMENTS',10),
 ('75300000-0000-0000-0000-000000000002','konsuler','Konsuler',true,false,'CONSULAR','CONSULAR',20),
 ('75300000-0000-0000-0000-000000000003','legalisasi','Legalisasi',true,false,'LEGALIZATION','DOCUMENTS',30),
 ('75300000-0000-0000-0000-000000000004','ketenagakerjaan','Ketenagakerjaan',true,false,'EMPLOYMENT','PROTECTION',40),
 ('75300000-0000-0000-0000-000000000005','kewarganegaraan','Kewarganegaraan',true,false,'CITIZENSHIP','CONSULAR',50),
 ('75300000-0000-0000-0000-000000000006','perhubungan','Perhubungan/Maritim',true,false,'MARITIME','DOCUMENTS',60),
 ('75300000-0000-0000-0000-000000000007','perlindungan','Perlindungan WNI',true,false,'PROTECTION','PROTECTION',70)
on conflict (id) do update set
 name=excluded.name, is_active=excluded.is_active, display_order=excluded.display_order
where service_categories.slug=excluded.slug
  and service_categories.service_code=excluded.service_code
  and service_categories.intent_group=excluded.intent_group
  and not service_categories.is_demo;

do $$ begin
 if exists (select 1 from public.service_categories where id::text like '75300000-%' and (is_demo or service_code is null))
 then raise exception 'LAYANAN_2D_CATEGORY_COLLISION'; end if;
end $$;

-- Publish all frozen jurisdictions without inventing evidence. The five Tawau
-- districts use exact official target evidence; the remaining 37 use auditable
-- DUTA review events populated later in this transaction.
update public.office_jurisdictions
set verification_status='verified', last_verified_at='2026-08-15 00:00:00+08',
    enabled=true,
    publishability_status=case when id in (
      '75100000-0000-0000-0000-000000000016','75100000-0000-0000-0000-000000000017',
      '75100000-0000-0000-0000-000000000018','75100000-0000-0000-0000-000000000019',
      '75100000-0000-0000-0000-000000000020'
    ) then 'VERIFIED_OFFICIAL'::public.service_publishability_status
      else 'VERIFIED_CURRENT'::public.service_publishability_status end,
    updated_at=now()
where id::text like '75100000-0000-0000-0000-0000000000%';

do $$ begin
 if exists (select 1 from public.official_service_evidence e where e.id::text like '75600000-%' and not (
   e.id in ('75600000-0000-0000-0000-000000000002','75600000-0000-0000-0000-000000000003','75600000-0000-0000-0000-000000000004','75600000-0000-0000-0000-000000000005','75600000-0000-0000-0000-000000000006')
   and e.official_source_id='71000000-0000-0000-0000-000000000019' and e.office_jurisdiction_id is not null
   and e.representative_office_id is null and e.mission_service_id is null and e.evidence_url is not null
 )) then raise exception 'LAYANAN_2G_JURISDICTION_EVIDENCE_IDENTITY_COLLISION'; end if;
end $$;

with jurisdiction_evidence(id,jurisdiction_id,url) as (values
 ('75600000-0000-0000-0000-000000000002'::uuid,'75100000-0000-0000-0000-000000000016'::uuid,'https://kemlu.go.id/tawau/tawau/berita/konsulat-ri-tawau-perkuat-perlindungan-wni-melalui-pelaksanaan-sidang-itsbat-nikah-bagi-225-pasangan-di-wilayah-kerja?type=publication'),
 ('75600000-0000-0000-0000-000000000003','75100000-0000-0000-0000-000000000020','https://kemlu.go.id/tawau/tawau/berita/konsulat-ri-tawau-perkuat-perlindungan-wni-melalui-pelaksanaan-sidang-itsbat-nikah-bagi-225-pasangan-di-wilayah-kerja?type=publication'),
 ('75600000-0000-0000-0000-000000000004','75100000-0000-0000-0000-000000000017','https://kemlu.go.id/tawau/tawau/berita/konsulat-ri-tawau-perkuat-perlindungan-wni-melalui-pelaksanaan-sidang-itsbat-nikah-bagi-225-pasangan-di-wilayah-kerja?type=publication'),
 ('75600000-0000-0000-0000-000000000005','75100000-0000-0000-0000-000000000019','https://kemlu.go.id/tawau/tawau/berita/konsulat-ri-tawau-perkuat-perlindungan-wni-melalui-pelaksanaan-sidang-itsbat-nikah-bagi-225-pasangan-di-wilayah-kerja?type=publication'),
 ('75600000-0000-0000-0000-000000000006','75100000-0000-0000-0000-000000000018','https://kemlu.go.id/tawau/tawau/berita/konsulat-ri-tawau-perkuat-perlindungan-wni-melalui-pelaksanaan-sidang-itsbat-nikah-bagi-225-pasangan-di-wilayah-kerja?type=publication')
)
insert into public.official_service_evidence(id,official_source_id,office_jurisdiction_id,evidence_url,evidence_note,observed_at)
select seed.id,'71000000-0000-0000-0000-000000000019',seed.jurisdiction_id,seed.url,
  'LAYANAN-2E exact Tawau jurisdiction evidence','2026-08-15 00:00:00+08'
from jurisdiction_evidence seed on conflict(id) do update set evidence_note=excluded.evidence_note
where official_service_evidence.official_source_id=excluded.official_source_id
  and official_service_evidence.office_jurisdiction_id=excluded.office_jurisdiction_id
  and official_service_evidence.evidence_url=excluded.evidence_url
  and official_service_evidence.representative_office_id is null
  and official_service_evidence.mission_service_id is null;

do $$ begin
 if exists (
  select 1 from (values
   ('75600000-0000-0000-0000-000000000002'::uuid,'75100000-0000-0000-0000-000000000016'::uuid),('75600000-0000-0000-0000-000000000003','75100000-0000-0000-0000-000000000020'),('75600000-0000-0000-0000-000000000004','75100000-0000-0000-0000-000000000017'),('75600000-0000-0000-0000-000000000005','75100000-0000-0000-0000-000000000019'),('75600000-0000-0000-0000-000000000006','75100000-0000-0000-0000-000000000018')
  ) x(id,target_id) left join public.official_service_evidence e on e.id=x.id
  where e.id is null or e.office_jurisdiction_id<>x.target_id or e.official_source_id<>'71000000-0000-0000-0000-000000000019' or e.evidence_url<>'https://kemlu.go.id/tawau/tawau/berita/konsulat-ri-tawau-perkuat-perlindungan-wni-melalui-pelaksanaan-sidang-itsbat-nikah-bagi-225-pasangan-di-wilayah-kerja?type=publication' or e.representative_office_id is not null or e.mission_service_id is not null
 ) then raise exception 'LAYANAN_2G_JURISDICTION_EVIDENCE_EXACT_ASSERTION_FAILED'; end if;
end $$;

with service_seed(id,mission_code,service_code,locator_complete,source_id) as (values
 ('75400000-0000-0000-0000-000000000001'::uuid,'KBRI-KUL','IMMIGRATION',true,'71000000-0000-0000-0000-000000000001'::uuid),('75400000-0000-0000-0000-000000000002','KBRI-KUL','CONSULAR',true,'71000000-0000-0000-0000-000000000001'),('75400000-0000-0000-0000-000000000003','KBRI-KUL','LEGALIZATION',false,'71000000-0000-0000-0000-000000000001'),('75400000-0000-0000-0000-000000000004','KBRI-KUL','EMPLOYMENT',true,'71000000-0000-0000-0000-000000000001'),('75400000-0000-0000-0000-000000000005','KBRI-KUL','CITIZENSHIP',true,'71000000-0000-0000-0000-000000000001'),('75400000-0000-0000-0000-000000000006','KBRI-KUL','MARITIME',true,'71000000-0000-0000-0000-000000000001'),
 ('75400000-0000-0000-0000-000000000007','KJRI-JHB','CONSULAR',true,'71000000-0000-0000-0000-000000000006'),('75400000-0000-0000-0000-000000000008','KJRI-JHB','EMPLOYMENT',true,'71000000-0000-0000-0000-000000000006'),('75400000-0000-0000-0000-000000000009','KJRI-JHB','CITIZENSHIP',false,'71000000-0000-0000-0000-000000000006'),('75400000-0000-0000-0000-000000000010','KJRI-JHB','MARITIME',false,'71000000-0000-0000-0000-000000000006'),('75400000-0000-0000-0000-000000000011','KJRI-JHB','IMMIGRATION',true,'71000000-0000-0000-0000-000000000006'),('75400000-0000-0000-0000-000000000012','KJRI-JHB','PROTECTION',true,'71000000-0000-0000-0000-000000000006'),
 ('75400000-0000-0000-0000-000000000013','KJRI-PEN','CONSULAR',true,'71000000-0000-0000-0000-000000000009'),('75400000-0000-0000-0000-000000000014','KJRI-PEN','PROTECTION',false,'71000000-0000-0000-0000-000000000009'),
 ('75400000-0000-0000-0000-000000000015','KJRI-KCH','PROTECTION',true,'71000000-0000-0000-0000-000000000016'),('75400000-0000-0000-0000-000000000016','KJRI-KCH','EMPLOYMENT',true,'71000000-0000-0000-0000-000000000016'),('75400000-0000-0000-0000-000000000017','KJRI-KCH','IMMIGRATION',true,'71000000-0000-0000-0000-000000000016'),
 ('75400000-0000-0000-0000-000000000018','KJRI-BKI','IMMIGRATION',true,'71000000-0000-0000-0000-000000000014'),('75400000-0000-0000-0000-000000000019','KJRI-BKI','CONSULAR',true,'71000000-0000-0000-0000-000000000014'),('75400000-0000-0000-0000-000000000020','KJRI-BKI','LEGALIZATION',false,'71000000-0000-0000-0000-000000000014'),('75400000-0000-0000-0000-000000000021','KJRI-BKI','MARITIME',false,'71000000-0000-0000-0000-000000000014'),('75400000-0000-0000-0000-000000000022','KJRI-BKI','CITIZENSHIP',false,'71000000-0000-0000-0000-000000000014'),
 ('75400000-0000-0000-0000-000000000023','KRI-TWU','IMMIGRATION',true,'71000000-0000-0000-0000-000000000019'),('75400000-0000-0000-0000-000000000024','KRI-TWU','CONSULAR',true,'71000000-0000-0000-0000-000000000019'),('75400000-0000-0000-0000-000000000025','KRI-TWU','LEGALIZATION',false,'71000000-0000-0000-0000-000000000019'),('75400000-0000-0000-0000-000000000026','KRI-TWU','EMPLOYMENT',false,'71000000-0000-0000-0000-000000000019'),('75400000-0000-0000-0000-000000000027','KRI-TWU','CITIZENSHIP',false,'71000000-0000-0000-0000-000000000019'),('75400000-0000-0000-0000-000000000028','KRI-TWU','MARITIME',false,'71000000-0000-0000-0000-000000000019')
), resolved as (
 select seed.*,office.id office_id,category.id category_id from service_seed seed
 join public.representative_offices office on office.mission_code=seed.mission_code
 join public.service_categories category on category.service_code=seed.service_code
)
insert into public.mission_services(id,office_id,service_category_id,enabled,verification_status,publishability_status,source_id,last_verified_at,notes)
select id,office_id,category_id,true,'verified',case when locator_complete then 'VERIFIED_OFFICIAL'::public.service_publishability_status else 'VERIFIED_CURRENT'::public.service_publishability_status end,source_id,'2026-08-15 00:00:00+08',
 case when locator_complete then 'LAYANAN-2E OFFICIAL_SOURCE_VERIFIED.' else 'LAYANAN-2E DUTA_REVIEWED_VERIFIED; GRANULAR_EVIDENCE_LOCATOR_PENDING.' end
from resolved on conflict(id) do update set
  enabled=excluded.enabled, verification_status=excluded.verification_status,
  publishability_status=excluded.publishability_status, last_verified_at=excluded.last_verified_at,
  notes=excluded.notes, updated_at=now()
-- Never mutate trusted identity columns. A conflicting ID with another office,
-- category, or authoritative source remains untouched and fails the exact guard.
where mission_services.office_id=excluded.office_id
  and mission_services.service_category_id=excluded.service_category_id
  and mission_services.source_id=excluded.source_id;

do $$ begin
 if (select count(*) from public.mission_services service
     join public.representative_offices office on office.id=service.office_id
     join public.service_categories category on category.id=service.service_category_id
     where service.id::text like '75400000-%' and service.verification_status='verified'
       and service.last_verified_at='2026-08-15 00:00:00+08'
       and service.source_id=office.source_id and not office.is_demo and not category.is_demo) <> 28
 then raise exception 'LAYANAN_2D_VERIFIED_SET_INCOMPLETE'; end if;
end $$;

-- Evidence is intentionally inserted only for the 17 target-specific locators.
-- Any pre-existing package evidence must already have a one-to-one service/source
-- mapping; the exact locator equality is enforced by the guarded conflict clause.
do $$ begin
 if exists (select 1 from public.official_service_evidence e
   join public.mission_services s on s.id=e.mission_service_id
   join public.representative_offices o on o.id=s.office_id
   where e.id::text like '75610000-%' and (e.official_source_id<>o.source_id
     or e.representative_office_id is not null or e.office_jurisdiction_id is not null
     or e.evidence_url is null))
 then raise exception 'LAYANAN_2G_SERVICE_EVIDENCE_IDENTITY_COLLISION'; end if;
end $$;
with evidence_seed(id,service_id,source_id,url) as (values
 ('75610000-0000-0000-0000-000000000001'::uuid,'75400000-0000-0000-0000-000000000001'::uuid,'71000000-0000-0000-0000-000000000001'::uuid,'https://www.kemlu.go.id/kualalumpur/id'),('75610000-0000-0000-0000-000000000002','75400000-0000-0000-0000-000000000002','71000000-0000-0000-0000-000000000001','https://www.kemlu.go.id/kualalumpur/id'),('75610000-0000-0000-0000-000000000003','75400000-0000-0000-0000-000000000004','71000000-0000-0000-0000-000000000001','https://www.kemlu.go.id/kualalumpur/id'),('75610000-0000-0000-0000-000000000004','75400000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000001','https://www.kemlu.go.id/kualalumpur/id'),('75610000-0000-0000-0000-000000000005','75400000-0000-0000-0000-000000000006','71000000-0000-0000-0000-000000000001','https://www.kemlu.go.id/kualalumpur/id'),
 ('75610000-0000-0000-0000-000000000006','75400000-0000-0000-0000-000000000007','71000000-0000-0000-0000-000000000006','https://kemlu.go.id/johorbahru/pelayanan-perwakilan/virtual-hotline-ksatria-'),('75610000-0000-0000-0000-000000000007','75400000-0000-0000-0000-000000000008','71000000-0000-0000-0000-000000000006','https://kemlu.go.id/johorbahru/pelayanan-perwakilan/virtual-hotline-ksatria-'),('75610000-0000-0000-0000-000000000008','75400000-0000-0000-0000-000000000011','71000000-0000-0000-0000-000000000006','https://kemlu.go.id/johorbahru/pelayanan-perwakilan/virtual-hotline-ksatria-'),('75610000-0000-0000-0000-000000000009','75400000-0000-0000-0000-000000000012','71000000-0000-0000-0000-000000000006','https://kemlu.go.id/johorbahru/pelayanan-perwakilan/virtual-hotline-ksatria-'),
 ('75610000-0000-0000-0000-000000000010','75400000-0000-0000-0000-000000000013','71000000-0000-0000-0000-000000000009','https://kemlu.go.id/penang/berita/maklumat-pelayanan?type=publication'),
 ('75610000-0000-0000-0000-000000000011','75400000-0000-0000-0000-000000000015','71000000-0000-0000-0000-000000000016','https://kemlu.go.id/kuching/berita/nomor-hotline-layanan-publik-kjri-kuching?type=publication'),('75610000-0000-0000-0000-000000000012','75400000-0000-0000-0000-000000000016','71000000-0000-0000-0000-000000000016','https://kemlu.go.id/kuching/berita/nomor-hotline-layanan-publik-kjri-kuching?type=publication'),('75610000-0000-0000-0000-000000000013','75400000-0000-0000-0000-000000000017','71000000-0000-0000-0000-000000000016','https://www.kemlu.go.id/kuching'),
 ('75610000-0000-0000-0000-000000000014','75400000-0000-0000-0000-000000000018','71000000-0000-0000-0000-000000000014','https://kemlu.go.id/kotakinabalu'),('75610000-0000-0000-0000-000000000015','75400000-0000-0000-0000-000000000019','71000000-0000-0000-0000-000000000014','https://kemlu.go.id/kotakinabalu'),
 ('75610000-0000-0000-0000-000000000016','75400000-0000-0000-0000-000000000023','71000000-0000-0000-0000-000000000019','https://kemlu.go.id/tawau/tawau/berita/pelayanan-paspor-kri-tawau-tahun-2026?type=publication'),('75610000-0000-0000-0000-000000000017','75400000-0000-0000-0000-000000000024','71000000-0000-0000-0000-000000000019','https://www.peduliwni.kemlu.go.id/informasi_pelayanan/app/detail_kbri/.html?perwakilan_id=NjkzMw%3D%3D')
)
insert into public.official_service_evidence(id,official_source_id,mission_service_id,evidence_url,evidence_note,observed_at)
select id,source_id,service_id,url,'LAYANAN-2D target-scoped service evidence','2026-08-15 00:00:00+08' from evidence_seed
on conflict(id) do update set evidence_note=excluded.evidence_note
where official_service_evidence.official_source_id=excluded.official_source_id
  and official_service_evidence.mission_service_id=excluded.mission_service_id
  and official_service_evidence.evidence_url=excluded.evidence_url
  and official_service_evidence.representative_office_id is null
  and official_service_evidence.office_jurisdiction_id is null;

do $$ begin
 if (select count(*) from public.official_service_evidence where id::text like '75610000-%') <> 17
   or exists (
    select 1 from public.official_service_evidence e
    join public.mission_services s on s.id=e.mission_service_id
    join public.representative_offices o on o.id=s.office_id
    where e.id::text like '75610000-%' and (
      array_position(array[1,2,4,5,6,7,8,11,12,13,15,16,17,18,19,23,24],right(s.id::text,12)::integer) is null
      or e.id <> ('75610000-0000-0000-0000-'||lpad(array_position(array[1,2,4,5,6,7,8,11,12,13,15,16,17,18,19,23,24],right(s.id::text,12)::integer)::text,12,'0'))::uuid
      or e.official_source_id<>o.source_id
      or e.evidence_url<>case
       when s.id between '75400000-0000-0000-0000-000000000001' and '75400000-0000-0000-0000-000000000006' then 'https://www.kemlu.go.id/kualalumpur/id'
       when s.id between '75400000-0000-0000-0000-000000000007' and '75400000-0000-0000-0000-000000000012' then 'https://kemlu.go.id/johorbahru/pelayanan-perwakilan/virtual-hotline-ksatria-'
       when s.id='75400000-0000-0000-0000-000000000013' then 'https://kemlu.go.id/penang/berita/maklumat-pelayanan?type=publication'
       when s.id in ('75400000-0000-0000-0000-000000000015','75400000-0000-0000-0000-000000000016') then 'https://kemlu.go.id/kuching/berita/nomor-hotline-layanan-publik-kjri-kuching?type=publication'
       when s.id='75400000-0000-0000-0000-000000000017' then 'https://www.kemlu.go.id/kuching'
       when s.id in ('75400000-0000-0000-0000-000000000018','75400000-0000-0000-0000-000000000019') then 'https://kemlu.go.id/kotakinabalu'
       when s.id='75400000-0000-0000-0000-000000000023' then 'https://kemlu.go.id/tawau/tawau/berita/pelayanan-paspor-kri-tawau-tahun-2026?type=publication'
       else 'https://www.peduliwni.kemlu.go.id/informasi_pelayanan/app/detail_kbri/.html?perwakilan_id=NjkzMw%3D%3D' end
    ))
 then raise exception 'LAYANAN_2D_EVIDENCE_SET_INCOMPLETE'; end if;
end $$;

-- One immutable verification event per service. Official-source events point to
-- exact evidence; DUTA-reviewed events point only to the canonical manifest.
insert into public.service_verification_events(
  id,mission_service_id,event_type,previous_status,new_status,evidence_id,reason,
  provenance_class,manifest_reference,review_decision,reviewer_role,created_at
)
select
  ('75710000-0000-0000-0000-' || right(service.id::text,12))::uuid,
  service.id,'VERIFIED',null,service.publishability_status,evidence.id,
  case when evidence.id is null
    then 'Product-owner approved canonical service relationship; granular locator pending.'
    else 'Product-owner approved service relationship with exact first-party target evidence.' end,
  case when evidence.id is null then 'DUTA_REVIEWED_VERIFIED'::public.layanan_provenance_class
    else 'OFFICIAL_SOURCE_VERIFIED'::public.layanan_provenance_class end,
  case when evidence.id is null then 'docs/data/duta-layanan-2d-product-owner-decision.json' else null end,
  'APPROVED','PRODUCT_OWNER','2026-08-15 00:00:00+08'
from public.mission_services service
left join public.official_service_evidence evidence
  on evidence.mission_service_id=service.id and evidence.id::text like '75610000-%'
where service.id::text like '75400000-%'
on conflict(id) do update set reason=excluded.reason
where service_verification_events.mission_service_id=excluded.mission_service_id
  and service_verification_events.office_jurisdiction_id is null
  and service_verification_events.provenance_class=excluded.provenance_class
  and service_verification_events.review_decision=excluded.review_decision
  and service_verification_events.reviewer_role=excluded.reviewer_role
  and service_verification_events.manifest_reference is not distinct from excluded.manifest_reference
  and service_verification_events.evidence_id is not distinct from excluded.evidence_id;

insert into public.service_verification_events(
  id,office_jurisdiction_id,event_type,previous_status,new_status,evidence_id,reason,
  provenance_class,manifest_reference,review_decision,reviewer_role,created_at
)
select
  ('75720000-0000-0000-0000-' || right(jurisdiction.id::text,12))::uuid,
  jurisdiction.id,'VERIFIED',null,jurisdiction.publishability_status,evidence.id,
  case when evidence.id is null
    then 'Product-owner approved frozen LAYANAN-1 routing; granular locator pending.'
    else 'Product-owner approved frozen routing with exact first-party target evidence.' end,
  case when evidence.id is null then 'DUTA_REVIEWED_VERIFIED'::public.layanan_provenance_class
    else 'OFFICIAL_SOURCE_VERIFIED'::public.layanan_provenance_class end,
  case when evidence.id is null then 'src/config/malaysia-jurisdictions.ts' else null end,
  'APPROVED','PRODUCT_OWNER','2026-08-15 00:00:00+08'
from public.office_jurisdictions jurisdiction
left join public.official_service_evidence evidence
  on evidence.office_jurisdiction_id=jurisdiction.id and evidence.id::text like '75600000-%'
where jurisdiction.id::text like '75100000-%'
on conflict(id) do update set reason=excluded.reason
where service_verification_events.office_jurisdiction_id=excluded.office_jurisdiction_id
  and service_verification_events.mission_service_id is null
  and service_verification_events.provenance_class=excluded.provenance_class
  and service_verification_events.review_decision=excluded.review_decision
  and service_verification_events.reviewer_role=excluded.reviewer_role
  and service_verification_events.manifest_reference is not distinct from excluded.manifest_reference
  and service_verification_events.evidence_id is not distinct from excluded.evidence_id;

do $$ begin
 if (select count(*) from public.service_verification_events where id::text like '75710000-%') <> 28
   or (select count(*) from public.service_verification_events where id::text like '75710000-%' and provenance_class='OFFICIAL_SOURCE_VERIFIED') <> 17
   or (select count(*) from public.service_verification_events where id::text like '75710000-%' and provenance_class='DUTA_REVIEWED_VERIFIED') <> 11
   or (select count(*) from public.service_verification_events where id::text like '75720000-%') <> 42
   or (select count(*) from public.service_verification_events where id::text like '75720000-%' and provenance_class='OFFICIAL_SOURCE_VERIFIED') <> 5
   or (select count(*) from public.service_verification_events where id::text like '75720000-%' and provenance_class='DUTA_REVIEWED_VERIFIED') <> 37
   or exists (select 1 from public.service_verification_events e where e.id::text like '75710000-%'
      and (e.mission_service_id is null or right(e.id::text,12)<>right(e.mission_service_id::text,12)
        or e.office_jurisdiction_id is not null or e.review_decision<>'APPROVED' or e.reviewer_role<>'PRODUCT_OWNER'
        or (e.provenance_class='DUTA_REVIEWED_VERIFIED' and e.manifest_reference is distinct from 'docs/data/duta-layanan-2d-product-owner-decision.json')
        or (e.provenance_class='OFFICIAL_SOURCE_VERIFIED' and e.evidence_id is null)))
   or exists (select 1 from public.service_verification_events e where e.id::text like '75720000-%'
      and (e.office_jurisdiction_id is null or right(e.id::text,12)<>right(e.office_jurisdiction_id::text,12)
        or e.mission_service_id is not null or e.review_decision<>'APPROVED' or e.reviewer_role<>'PRODUCT_OWNER'
        or (e.provenance_class='DUTA_REVIEWED_VERIFIED' and e.manifest_reference is distinct from 'src/config/malaysia-jurisdictions.ts')
        or (e.provenance_class='OFFICIAL_SOURCE_VERIFIED' and e.evidence_id is null)))
 then raise exception 'LAYANAN_2E_PROVENANCE_EVENT_SET_INCOMPLETE'; end if;
end $$;

commit;
