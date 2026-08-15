begin;

do $$
begin
  if (select count(*) from public.official_sources where id in (
    '71000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000006',
    '71000000-0000-0000-0000-000000000009','71000000-0000-0000-0000-000000000014',
    '71000000-0000-0000-0000-000000000016','71000000-0000-0000-0000-000000000019'
  ) and enabled and registry_status = 'VERIFIED' and verification_level in ('A','B')) <> 6 then
    raise exception 'LAYANAN_1_SOURCE_GATE_FAILED';
  end if;
end $$;

insert into public.representative_offices (
  id, country_code, name, office_type, source_id, verification_status,
  last_verified_at, is_active, is_demo, mission_code, city, enabled, publishability_status
)
select seed.id, 'MY', seed.name, seed.office_type::public.office_type, seed.source_id,
  'verified', source.last_verified_at, true, false, seed.mission_code, seed.city, false, 'UNVERIFIED'
from (values
  ('75000000-0000-0000-0000-000000000001'::uuid,'KBRI Kuala Lumpur','embassy','71000000-0000-0000-0000-000000000001'::uuid,'KBRI-KUL','Kuala Lumpur'),
  ('75000000-0000-0000-0000-000000000002'::uuid,'KJRI Johor Bahru','consulate_general','71000000-0000-0000-0000-000000000006'::uuid,'KJRI-JHB','Johor Bahru'),
  ('75000000-0000-0000-0000-000000000003'::uuid,'KJRI Penang','consulate_general','71000000-0000-0000-0000-000000000009'::uuid,'KJRI-PEN','Pulau Pinang'),
  ('75000000-0000-0000-0000-000000000004'::uuid,'KJRI Kuching','consulate_general','71000000-0000-0000-0000-000000000016'::uuid,'KJRI-KCH','Kuching'),
  ('75000000-0000-0000-0000-000000000005'::uuid,'KJRI Kota Kinabalu','consulate_general','71000000-0000-0000-0000-000000000014'::uuid,'KJRI-BKI','Kota Kinabalu'),
  ('75000000-0000-0000-0000-000000000006'::uuid,'Konsulat Republik Indonesia Tawau','consulate','71000000-0000-0000-0000-000000000019'::uuid,'KRI-TWU','Tawau')
) seed(id,name,office_type,source_id,mission_code,city)
join public.official_sources source on source.id = seed.source_id
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1 from (values
      ('75000000-0000-0000-0000-000000000001'::uuid,'KBRI-KUL'),('75000000-0000-0000-0000-000000000002'::uuid,'KJRI-JHB'),
      ('75000000-0000-0000-0000-000000000003'::uuid,'KJRI-PEN'),('75000000-0000-0000-0000-000000000004'::uuid,'KJRI-KCH'),
      ('75000000-0000-0000-0000-000000000005'::uuid,'KJRI-BKI'),('75000000-0000-0000-0000-000000000006'::uuid,'KRI-TWU')
    ) expected(id, mission_code)
    left join public.representative_offices office on office.id = expected.id
    where office.id is null or office.mission_code is distinct from expected.mission_code or office.is_demo or office.enabled
  ) then raise exception 'LAYANAN_1_OFFICE_COLLISION'; end if;
end $$;

with jurisdiction_seed(id, office_id, source_id, state_name, state_normalized, district_name, district_normalized, jurisdiction_type, routing_priority) as (
  values
    ('75100000-0000-0000-0000-000000000001'::uuid,'75000000-0000-0000-0000-000000000001'::uuid,'71000000-0000-0000-0000-000000000001'::uuid,'Kuala Lumpur','kuala lumpur',null,null,'FEDERAL_TERRITORY',10),
    ('75100000-0000-0000-0000-000000000002','75000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001','Putrajaya','putrajaya',null,null,'FEDERAL_TERRITORY',10),
    ('75100000-0000-0000-0000-000000000003','75000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001','Selangor','selangor',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000004','75000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001','Perak','perak',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000005','75000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001','Kelantan','kelantan',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000006','75000000-0000-0000-0000-000000000001','71000000-0000-0000-0000-000000000001','Terengganu','terengganu',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000007','75000000-0000-0000-0000-000000000002','71000000-0000-0000-0000-000000000006','Johor','johor',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000008','75000000-0000-0000-0000-000000000002','71000000-0000-0000-0000-000000000006','Melaka','melaka',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000009','75000000-0000-0000-0000-000000000002','71000000-0000-0000-0000-000000000006','Negeri Sembilan','negeri sembilan',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000010','75000000-0000-0000-0000-000000000002','71000000-0000-0000-0000-000000000006','Pahang','pahang',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000011','75000000-0000-0000-0000-000000000003','71000000-0000-0000-0000-000000000009','Pulau Pinang','pulau pinang',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000012','75000000-0000-0000-0000-000000000003','71000000-0000-0000-0000-000000000009','Kedah','kedah',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000013','75000000-0000-0000-0000-000000000003','71000000-0000-0000-0000-000000000009','Perlis','perlis',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000014','75000000-0000-0000-0000-000000000004','71000000-0000-0000-0000-000000000016','Sarawak','sarawak',null,null,'STATE_WIDE',10),
    ('75100000-0000-0000-0000-000000000015','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','WP Labuan','wp labuan',null,null,'FEDERAL_TERRITORY',10),
    ('75100000-0000-0000-0000-000000000016','75000000-0000-0000-0000-000000000006','71000000-0000-0000-0000-000000000019','Sabah','sabah','Tawau','tawau','DISTRICT',10),
    ('75100000-0000-0000-0000-000000000017','75000000-0000-0000-0000-000000000006','71000000-0000-0000-0000-000000000019','Sabah','sabah','Kunak','kunak','DISTRICT',10),
    ('75100000-0000-0000-0000-000000000018','75000000-0000-0000-0000-000000000006','71000000-0000-0000-0000-000000000019','Sabah','sabah','Semporna','semporna','DISTRICT',10),
    ('75100000-0000-0000-0000-000000000019','75000000-0000-0000-0000-000000000006','71000000-0000-0000-0000-000000000019','Sabah','sabah','Lahad Datu','lahad datu','DISTRICT',10),
    ('75100000-0000-0000-0000-000000000020','75000000-0000-0000-0000-000000000006','71000000-0000-0000-0000-000000000019','Sabah','sabah','Kalabakan','kalabakan','DISTRICT',10),
    ('75100000-0000-0000-0000-000000000021','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Beluran','beluran','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000022','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Beaufort','beaufort','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000023','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Keningau','keningau','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000024','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Kinabatangan','kinabatangan','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000025','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Kota Belud','kota belud','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000026','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Kota Kinabalu','kota kinabalu','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000027','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Kota Marudu','kota marudu','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000028','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Kuala Penyu','kuala penyu','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000029','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Kudat','kudat','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000030','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Nabawan','nabawan','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000031','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Papar','papar','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000032','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Penampang','penampang','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000033','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Pitas','pitas','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000034','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Putatan','putatan','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000035','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Ranau','ranau','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000036','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Sandakan','sandakan','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000037','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Sipitang','sipitang','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000038','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Tambunan','tambunan','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000039','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Telupid','telupid','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000040','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Tenom','tenom','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000041','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Tongod','tongod','DISTRICT',20),
    ('75100000-0000-0000-0000-000000000042','75000000-0000-0000-0000-000000000005','71000000-0000-0000-0000-000000000014','Sabah','sabah','Tuaran','tuaran','DISTRICT',20)
)
insert into public.office_jurisdictions (
  id, office_id, country_code, state_name, source_id, verification_status, is_demo,
  state_normalized, district_name, district_normalized, jurisdiction_type,
  routing_priority, enabled, publishability_status
)
select id, office_id, 'MY', state_name, source_id, 'unverified', false,
  state_normalized, district_name, district_normalized,
  jurisdiction_type::public.jurisdiction_type, routing_priority, false, 'UNVERIFIED'
from jurisdiction_seed
on conflict (id) do nothing;

insert into public.location_aliases (
  id, country_code, alias_normalized, canonical_state_normalized,
  canonical_district_normalized, enabled, verification_status,
  publishability_status, source_id
)
values
  ('75200000-0000-0000-0000-000000000001','MY','kl','kuala lumpur',null,false,'unverified','UNVERIFIED','71000000-0000-0000-0000-000000000001'),
  ('75200000-0000-0000-0000-000000000002','MY','penang','pulau pinang',null,false,'unverified','UNVERIFIED','71000000-0000-0000-0000-000000000009'),
  ('75200000-0000-0000-0000-000000000003','MY','labuan','wp labuan',null,false,'unverified','UNVERIFIED','71000000-0000-0000-0000-000000000014'),
  ('75200000-0000-0000-0000-000000000004','MY','wilayah persekutuan labuan','wp labuan',null,false,'unverified','UNVERIFIED','71000000-0000-0000-0000-000000000014')
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1
    from (values
      ('75000000-0000-0000-0000-000000000001'::uuid,'KBRI-KUL','MY','71000000-0000-0000-0000-000000000001'::uuid),
      ('75000000-0000-0000-0000-000000000002','KJRI-JHB','MY','71000000-0000-0000-0000-000000000006'),
      ('75000000-0000-0000-0000-000000000003','KJRI-PEN','MY','71000000-0000-0000-0000-000000000009'),
      ('75000000-0000-0000-0000-000000000004','KJRI-KCH','MY','71000000-0000-0000-0000-000000000016'),
      ('75000000-0000-0000-0000-000000000005','KJRI-BKI','MY','71000000-0000-0000-0000-000000000014'),
      ('75000000-0000-0000-0000-000000000006','KRI-TWU','MY','71000000-0000-0000-0000-000000000019')
    ) expected(id,mission_code,country_code,source_id)
    left join public.representative_offices office on office.id=expected.id
    where office.id is null or office.mission_code is distinct from expected.mission_code
      or office.country_code is distinct from expected.country_code
      or office.source_id is distinct from expected.source_id
      or office.is_demo or office.enabled
  )
    or exists (
      select 1
      from (
        select ('75100000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid id,
          case when n<=6 then '75000000-0000-0000-0000-000000000001'::uuid when n<=10 then '75000000-0000-0000-0000-000000000002'::uuid when n<=13 then '75000000-0000-0000-0000-000000000003'::uuid when n=14 then '75000000-0000-0000-0000-000000000004'::uuid when n=15 or n>=21 then '75000000-0000-0000-0000-000000000005'::uuid else '75000000-0000-0000-0000-000000000006'::uuid end office_id,
          (array['kuala lumpur','putrajaya','selangor','perak','kelantan','terengganu','johor','melaka','negeri sembilan','pahang','pulau pinang','kedah','perlis','sarawak','wp labuan','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah','sabah'])[n] state_normalized,
          (array[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'tawau','kunak','semporna','lahad datu','kalabakan','beluran','beaufort','keningau','kinabatangan','kota belud','kota kinabalu','kota marudu','kuala penyu','kudat','nabawan','papar','penampang','pitas','putatan','ranau','sandakan','sipitang','tambunan','telupid','tenom','tongod','tuaran']::text[])[n] district_normalized,
          case when n in (1,2,15) then 'FEDERAL_TERRITORY' when n between 16 and 42 then 'DISTRICT' else 'STATE_WIDE' end jurisdiction_type
        from generate_series(1,42) n
      ) expected
      left join public.office_jurisdictions jurisdiction on jurisdiction.id=expected.id
      where jurisdiction.id is null or jurisdiction.office_id is distinct from expected.office_id
        or jurisdiction.country_code is distinct from 'MY'
        or jurisdiction.state_normalized is distinct from expected.state_normalized
        or jurisdiction.district_normalized is distinct from expected.district_normalized
        or jurisdiction.jurisdiction_type::text is distinct from expected.jurisdiction_type
        or jurisdiction.is_demo or jurisdiction.enabled
    )
    or (select count(*) from public.location_aliases where id::text like '75200000-0000-0000-0000-00000000000%') <> 4
  then raise exception 'LAYANAN_1_DETERMINISTIC_SET_INCOMPLETE'; end if;
end $$;

commit;
