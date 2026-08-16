begin;

create type public.official_source_verification_level as enum ('A', 'B', 'C', 'LEGACY', 'HOLD');
create type public.official_source_registry_status as enum ('VERIFIED', 'REVIEW', 'LEGACY', 'HOLD');
create type public.official_source_priority as enum ('P0', 'P1', 'P2');
create type public.official_source_platform as enum ('website', 'instagram', 'facebook', 'x', 'youtube', 'tiktok');
create type public.official_source_category as enum (
  'GENERAL_OFFICIAL', 'CONSULAR', 'PROTECTION', 'IMMIGRATION',
  'MIGRANT_WORKER', 'EMPLOYMENT', 'REPATRIATION', 'LEGAL', 'LEGAL_AID',
  'EDUCATION', 'STUDENT', 'SCHOLARSHIP', 'CULTURE', 'TRANSPORT',
  'SEAFARER', 'TRAVEL', 'TRADE', 'BUSINESS', 'EXPORT', 'ECONOMY',
  'SECURITY', 'SCAM_ALERT', 'LAW_ENFORCEMENT', 'COMMUNITY', 'LOCAL_ALERT'
);

create or replace function private.official_source_categories_valid(categories jsonb)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select jsonb_typeof(categories) = 'array'
    and not exists (
      select 1
      from jsonb_array_elements_text(categories) category(value)
      where category.value not in (
        'GENERAL_OFFICIAL', 'CONSULAR', 'PROTECTION', 'IMMIGRATION',
        'MIGRANT_WORKER', 'EMPLOYMENT', 'REPATRIATION', 'LEGAL', 'LEGAL_AID',
        'EDUCATION', 'STUDENT', 'SCHOLARSHIP', 'CULTURE', 'TRANSPORT',
        'SEAFARER', 'TRAVEL', 'TRADE', 'BUSINESS', 'EXPORT', 'ECONOMY',
        'SECURITY', 'SCAM_ALERT', 'LAW_ENFORCEMENT', 'COMMUNITY', 'LOCAL_ALERT'
      )
    );
$$;
revoke all on function private.official_source_categories_valid(jsonb) from public;

alter table public.official_sources
  alter column source_url drop not null,
  add column institution_code text,
  add column unit_name text,
  add column city text,
  add column platform public.official_source_platform,
  add column handle text,
  add column official_website text,
  add column verification_level public.official_source_verification_level not null default 'HOLD',
  add column registry_status public.official_source_registry_status not null default 'HOLD',
  add column priority public.official_source_priority not null default 'P2',
  add column category_scope jsonb not null default '[]'::jsonb,
  add column enabled boolean not null default false,
  add column last_successful_fetch_at timestamptz,
  add column fetch_method text,
  add column notes text,
  add constraint official_sources_institution_code_format check (
    institution_code is null or institution_code ~ '^[A-Z0-9]+(?:-[A-Z0-9]+)*$'
  ),
  add constraint official_sources_official_website_https check (
    official_website is null or official_website ~ '^https://'
  ),
  add constraint official_sources_categories_valid check (
    private.official_source_categories_valid(category_scope)
  ),
  add constraint official_sources_enabled_safety check (
    not enabled or (
      verification_level in ('A', 'B')
      and registry_status = 'VERIFIED'
      and verification_status = 'verified'
      and last_verified_at is not null
      and source_url is not null
      and source_url ~ '^https://'
      and not is_demo
    )
  );

update public.official_sources
set institution_code = case id
    when '10000000-0000-0000-0000-000000000001' then 'DEMO-DAY2-OFFICE'
    when '10000000-0000-0000-0000-000000000002' then 'DEMO-DAY2-NEWS'
    else institution_code
  end,
  platform = coalesce(platform, 'website'),
  enabled = false,
  registry_status = 'HOLD',
  verification_level = 'HOLD'
where id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
);

create unique index official_sources_registry_identity_idx
  on public.official_sources (institution_code, platform, source_url)
  where institution_code is not null and platform is not null and source_url is not null;
create index official_sources_enabled_idx on public.official_sources (enabled) where enabled;
create index official_sources_institution_code_idx on public.official_sources (institution_code);
create index official_sources_platform_idx on public.official_sources (platform);
create index official_sources_priority_idx on public.official_sources (priority);
create index official_sources_verification_level_idx on public.official_sources (verification_level);

alter table public.official_sources enable row level security;
drop policy "Public can read publishable official sources" on public.official_sources;
create policy "Public reads enabled verified official sources"
on public.official_sources
for select to anon, authenticated
using (enabled and registry_status = 'VERIFIED' and verification_level in ('A', 'B'));

create table public.official_source_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.official_sources(id) on delete cascade,
  external_post_id text,
  canonical_url text not null check (canonical_url ~ '^https://'),
  published_at timestamptz,
  title text check (title is null or char_length(trim(title)) between 3 and 300),
  summary text check (summary is null or char_length(summary) <= 5000),
  media_url text check (media_url is null or media_url ~ '^https://'),
  content_hash text check (content_hash is null or content_hash ~ '^[a-f0-9]{64}$'),
  category public.official_source_category,
  importance_score smallint not null default 0 check (importance_score between 0 and 100),
  verified_source boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_source_items_external_identity unique (source_id, external_post_id),
  constraint official_source_items_source_verification check (not verified_source or source_id is not null)
);
create unique index official_source_items_canonical_url_idx on public.official_source_items (canonical_url);
create index official_source_items_source_published_idx on public.official_source_items (source_id, published_at desc);
create index official_source_items_hash_idx on public.official_source_items (content_hash) where content_hash is not null;
create trigger official_source_items_set_updated_at before update on public.official_source_items
for each row execute function private.set_updated_at();

alter table public.official_source_items enable row level security;
create policy "Public reads items from enabled official sources"
on public.official_source_items for select to anon, authenticated
using (exists (
  select 1 from public.official_sources source
  where source.id = source_id
    and source.enabled
    and source.registry_status = 'VERIFIED'
    and source.verification_level in ('A', 'B')
) and verified_source);
create policy "Admins manage official source items"
on public.official_source_items for all to authenticated
using (private.can_manage_source(source_id))
with check (private.can_manage_source(source_id));
revoke all on public.official_source_items from anon, authenticated;
grant select on public.official_source_items to anon, authenticated;
grant insert, update, delete on public.official_source_items to authenticated;

insert into public.official_sources (
  id, scope, country_code, name, source_url, verification_status, last_verified_at,
  integration_type, integration_enabled, is_active, is_demo, institution_code,
  unit_name, city, platform, handle, official_website, verification_level,
  registry_status, priority, category_scope, enabled, fetch_method, notes
)
values
  ('71000000-0000-0000-0000-000000000001','news','MY','KBRI Kuala Lumpur','https://kemlu.go.id/kualalumpur','verified',now(),'manual_url',false,true,false,'KBRI-KUL',null,'Kuala Lumpur','website',null,'https://kemlu.go.id/kualalumpur','A','VERIFIED','P0','["GENERAL_OFFICIAL","CONSULAR","PROTECTION","IMMIGRATION"]',true,null,null),
  ('71000000-0000-0000-0000-000000000002','news','MY','KBRI Kuala Lumpur','https://www.instagram.com/indonesiainkualalumpur/','verified',now(),'manual_url',false,true,false,'KBRI-KUL',null,'Kuala Lumpur','instagram','@indonesiainkualalumpur','https://kemlu.go.id/kualalumpur','A','VERIFIED','P0','["GENERAL_OFFICIAL","CONSULAR","PROTECTION","IMMIGRATION"]',true,null,null),
  ('71000000-0000-0000-0000-000000000003','news','MY','KBRI Kuala Lumpur','https://www.facebook.com/IndonesianEmbassyKualaLumpur/','verified',now(),'manual_url',false,true,false,'KBRI-KUL',null,'Kuala Lumpur','facebook','IndonesianEmbassyKualaLumpur','https://kemlu.go.id/kualalumpur','A','VERIFIED','P0','["GENERAL_OFFICIAL","CONSULAR","PROTECTION"]',true,null,null),
  ('71000000-0000-0000-0000-000000000004','news','MY','KBRI Kuala Lumpur','https://x.com/kbrikualalumpur','verified',now(),'manual_url',false,true,false,'KBRI-KUL',null,'Kuala Lumpur','x','@kbrikualalumpur','https://kemlu.go.id/kualalumpur','A','VERIFIED','P1','["GENERAL_OFFICIAL","CONSULAR"]',true,null,null),
  ('71000000-0000-0000-0000-000000000005','news','MY','KBRI Kuala Lumpur','https://www.youtube.com/@kbrikualalumpur','verified',now(),'manual_url',false,true,false,'KBRI-KUL',null,'Kuala Lumpur','youtube','@kbrikualalumpur','https://kemlu.go.id/kualalumpur','A','VERIFIED','P1','["GENERAL_OFFICIAL","CONSULAR"]',true,null,null),

  ('71000000-0000-0000-0000-000000000006','news','MY','KJRI Johor Bahru','https://kemlu.go.id/johorbahru','verified',now(),'manual_url',false,true,false,'KJRI-JHB',null,'Johor Bahru','website',null,'https://kemlu.go.id/johorbahru','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000007','news','MY','KJRI Johor Bahru','https://www.instagram.com/indonesiainjb/','verified',now(),'manual_url',false,true,false,'KJRI-JHB',null,'Johor Bahru','instagram','@indonesiainjb','https://kemlu.go.id/johorbahru','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000008','news','MY','KJRI Johor Bahru','https://www.facebook.com/IndonesianInJohorBahru/','verified',now(),'manual_url',false,true,false,'KJRI-JHB',null,'Johor Bahru','facebook',null,'https://kemlu.go.id/johorbahru','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),

  ('71000000-0000-0000-0000-000000000009','news','MY','KJRI Penang','https://kemlu.go.id/penang','verified',now(),'manual_url',false,true,false,'KJRI-PEN',null,'Penang','website',null,'https://kemlu.go.id/penang','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000010','news','MY','KJRI Penang','https://www.instagram.com/indonesiainpenang/','verified',now(),'manual_url',false,true,false,'KJRI-PEN',null,'Penang','instagram','@indonesiainpenang','https://kemlu.go.id/penang','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000011','news','MY','KJRI Penang','https://www.facebook.com/indonesiainpenang/','verified',now(),'manual_url',false,true,false,'KJRI-PEN',null,'Penang','facebook',null,'https://kemlu.go.id/penang','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000012','news','MY','KJRI Penang','https://x.com/IndonesiaPenang','verified',now(),'manual_url',false,true,false,'KJRI-PEN',null,'Penang','x','@IndonesiaPenang','https://kemlu.go.id/penang','A','VERIFIED','P1','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000013','news','MY','KJRI Penang','https://www.youtube.com/channel/UCQ6aLdnF6UFNDjP-1_QqHpw','verified',now(),'manual_url',false,true,false,'KJRI-PEN',null,'Penang','youtube',null,'https://kemlu.go.id/penang','A','VERIFIED','P1','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),

  ('71000000-0000-0000-0000-000000000014','news','MY','KJRI Kota Kinabalu','https://kemlu.go.id/kotakinabalu','verified',now(),'manual_url',false,true,false,'KJRI-BKI',null,'Kota Kinabalu','website',null,'https://kemlu.go.id/kotakinabalu','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000015','news','MY','KJRI Kota Kinabalu','https://www.instagram.com/indonesiainkotakinabalu/','verified',now(),'manual_url',false,true,false,'KJRI-BKI',null,'Kota Kinabalu','instagram','@indonesiainkotakinabalu','https://kemlu.go.id/kotakinabalu','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),

  ('71000000-0000-0000-0000-000000000016','news','MY','KJRI Kuching','https://kemlu.go.id/kuching','verified',now(),'manual_url',false,true,false,'KJRI-KCH',null,'Kuching','website',null,'https://kemlu.go.id/kuching','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000017','news','MY','KJRI Kuching','https://www.instagram.com/indonesiainkuching/','verified',now(),'manual_url',false,true,false,'KJRI-KCH',null,'Kuching','instagram','@indonesiainkuching','https://kemlu.go.id/kuching','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000018','news','MY','KJRI Kuching','https://www.facebook.com/kjrikuching/','verified',now(),'manual_url',false,true,false,'KJRI-KCH',null,'Kuching','facebook',null,'https://kemlu.go.id/kuching','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),

  ('71000000-0000-0000-0000-000000000019','news','MY','KRI Tawau','https://kemlu.go.id/tawau','verified',now(),'manual_url',false,true,false,'KRI-TWU',null,'Tawau','website',null,'https://kemlu.go.id/tawau','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000020','news','MY','KRI Tawau','https://www.instagram.com/indonesiaintawau/','verified',now(),'manual_url',false,true,false,'KRI-TWU',null,'Tawau','instagram','@indonesiaintawau','https://kemlu.go.id/tawau','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000021','news','MY','KRI Tawau','https://www.facebook.com/konsulatritawau/','verified',now(),'manual_url',false,true,false,'KRI-TWU',null,'Tawau','facebook',null,'https://kemlu.go.id/tawau','A','VERIFIED','P0','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),
  ('71000000-0000-0000-0000-000000000022','news','MY','KRI Tawau','https://x.com/indonesiaintwu','verified',now(),'manual_url',false,true,false,'KRI-TWU',null,'Tawau','x','@indonesiaintwu','https://kemlu.go.id/tawau','A','VERIFIED','P1','["CONSULAR","IMMIGRATION","PROTECTION","COMMUNITY","LOCAL_ALERT"]',true,null,null),

  ('71000000-0000-0000-0000-000000000023','news','MY','KBRI Kuala Lumpur','https://www.instagram.com/atnaker.kl/','verified',now(),'manual_url',false,true,false,'KBRI-KUL-ATNAKER','Atase/Fungsi Tenaga Kerja','Kuala Lumpur','instagram','@atnaker.kl','https://kemlu.go.id/kualalumpur','A','VERIFIED','P0','["MIGRANT_WORKER","EMPLOYMENT","PROTECTION","REPATRIATION"]',true,null,null),
  ('71000000-0000-0000-0000-000000000024','news','MY','KBRI Kuala Lumpur','https://www.instagram.com/atkum.kualalumpur/','verified',now(),'manual_url',false,true,false,'KBRI-KUL-ATKUM','Atase Hukum','Kuala Lumpur','instagram','@atkum.kualalumpur','https://kemlu.go.id/kualalumpur','A','VERIFIED','P0','["LEGAL","PROTECTION","LEGAL_AID"]',true,null,null),
  ('71000000-0000-0000-0000-000000000025','news','MY','KBRI Kuala Lumpur','https://www.instagram.com/atdikbud_kualalumpur/','verified',now(),'manual_url',false,true,false,'KBRI-KUL-ATDIKBUD','Atase Pendidikan dan Kebudayaan','Kuala Lumpur','instagram','@atdikbud_kualalumpur','https://kemlu.go.id/kualalumpur','A','VERIFIED','P0','["EDUCATION","STUDENT","SCHOLARSHIP","CULTURE"]',true,null,null),
  ('71000000-0000-0000-0000-000000000026','news','MY','KBRI Kuala Lumpur','https://www.instagram.com/ataseperhubungan.kl/','verified',now(),'manual_url',false,true,false,'KBRI-KUL-ATHUB','Atase Perhubungan','Kuala Lumpur','instagram','@ataseperhubungan.kl','https://kemlu.go.id/kualalumpur','A','VERIFIED','P0','["TRANSPORT","SEAFARER","TRAVEL"]',true,null,null),
  ('71000000-0000-0000-0000-000000000027','news','MY','KBRI Kuala Lumpur','https://www.instagram.com/atdag.kualalumpur/','verified',now(),'manual_url',false,true,false,'KBRI-KUL-ATDAG','Atase Perdagangan','Kuala Lumpur','instagram','@atdag.kualalumpur','https://kemlu.go.id/kualalumpur','A','VERIFIED','P1','["TRADE","BUSINESS","EXPORT","ECONOMY"]',true,null,null),

  ('71000000-0000-0000-0000-000000000028','news','MY','KBRI Kuala Lumpur',null,'unverified',null,null,false,false,false,'KBRI-KUL-ATPOL','Atase Polri','Kuala Lumpur','instagram','@atpol_kl','https://kemlu.go.id/kualalumpur','B','REVIEW','P1','["SECURITY","SCAM_ALERT","LAW_ENFORCEMENT"]',false,null,'Strong cross-reference found but requires final primary-source verification before production ingestion.'),
  ('71000000-0000-0000-0000-000000000029','news','MY','KBRI Kuala Lumpur',null,'unverified',null,null,false,false,false,'KBRI-KUL-ATIM','Atase Imigrasi','Kuala Lumpur',null,null,'https://kemlu.go.id/kualalumpur','HOLD','HOLD','P0','["IMMIGRATION","CONSULAR"]',false,null,'Official function exists, but dedicated official social account not yet verified. Use KBRI Kuala Lumpur official sources for immigration content.'),
  ('71000000-0000-0000-0000-000000000030','news','MY','KBRI Kuala Lumpur',null,'unverified',null,null,false,false,false,'KBRI-KUL-ATHAN','Atase Pertahanan','Kuala Lumpur',null,null,'https://kemlu.go.id/kualalumpur','HOLD','HOLD','P2','[]',false,null,'Official function exists, but no dedicated official source has been verified.'),
  ('71000000-0000-0000-0000-000000000031','news','MY','KBRI Kuala Lumpur','https://x.com/IndonesiaInKL','unverified',null,'manual_url',false,false,false,'KBRI-KUL',null,'Kuala Lumpur','x','@IndonesiaInKL','https://kemlu.go.id/kualalumpur','LEGACY','LEGACY','P2','["GENERAL_OFFICIAL"]',false,null,'Legacy/alternate KBRI identity. Keep disabled to avoid duplicate ingestion until account migration history is conclusively verified.')
on conflict (id) do update set
  scope = excluded.scope,
  country_code = excluded.country_code,
  name = excluded.name,
  source_url = excluded.source_url,
  verification_status = excluded.verification_status,
  last_verified_at = excluded.last_verified_at,
  integration_type = excluded.integration_type,
  integration_enabled = false,
  is_active = excluded.is_active,
  is_demo = false,
  institution_code = excluded.institution_code,
  unit_name = excluded.unit_name,
  city = excluded.city,
  platform = excluded.platform,
  handle = excluded.handle,
  official_website = excluded.official_website,
  verification_level = excluded.verification_level,
  registry_status = excluded.registry_status,
  priority = excluded.priority,
  category_scope = excluded.category_scope,
  enabled = excluded.enabled,
  fetch_method = excluded.fetch_method,
  notes = excluded.notes,
  updated_at = now();

commit;
