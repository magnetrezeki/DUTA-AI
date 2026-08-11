begin;

do $$
declare
  missing_tables text;
  rls_disabled text;
begin
  select string_agg(expected.name, ', ' order by expected.name)
  into missing_tables
  from unnest(array[
    'official_sources', 'official_source_items', 'news_items',
    'news_categories', 'news_source_category_scopes', 'news_item_categories',
    'news_editorial_reviews', 'news_duplicate_relations',
    'news_source_integrations', 'news_source_assessments'
  ]) expected(name)
  where to_regclass('public.' || expected.name) is null;

  if missing_tables is not null then
    raise exception 'FAIL: missing News V2 tables: %', missing_tables;
  end if;

  select string_agg(expected.name, ', ' order by expected.name)
  into rls_disabled
  from unnest(array[
    'official_sources', 'official_source_items', 'news_items',
    'news_categories', 'news_source_category_scopes', 'news_item_categories',
    'news_editorial_reviews', 'news_duplicate_relations',
    'news_source_integrations', 'news_source_assessments'
  ]) expected(name)
  join pg_class relation on relation.oid = to_regclass('public.' || expected.name)
  where not relation.relrowsecurity;

  if rls_disabled is not null then
    raise exception 'FAIL: RLS disabled on News V2 tables: %', rls_disabled;
  end if;
end;
$$;

insert into public.countries (
  code, name, is_active, source_url, verification_status, verified_at
) values (
  'ZZ', 'DEMO News Test Country', false,
  'https://example.invalid/news-v2/test-country', 'verified', now()
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('90000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','news-member@example.invalid','test-only',now(),'{}','{"display_name":"News Member"}',now(),now()),
  ('90000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','news-country-admin@example.invalid','test-only',now(),'{}','{"display_name":"News Country Admin"}',now(),now()),
  ('90000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','news-organization-admin@example.invalid','test-only',now(),'{}','{"display_name":"News Organization Admin"}',now(),now()),
  ('90000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','news-moderator@example.invalid','test-only',now(),'{}','{"display_name":"News Moderator"}',now(),now()),
  ('90000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','news-super-admin@example.invalid','test-only',now(),'{}','{"display_name":"News Super Admin"}',now(),now());

update public.profiles
set onboarding_completed = true
where id between '90000000-0000-0000-0000-000000000001'::uuid
  and '90000000-0000-0000-0000-000000000005'::uuid;
update public.profiles set role = 'country_admin', current_country_code = 'MY'
where id = '90000000-0000-0000-0000-000000000002';
update public.profiles set role = 'organization_admin'
where id = '90000000-0000-0000-0000-000000000003';
update public.profiles set role = 'moderator'
where id = '90000000-0000-0000-0000-000000000004';
update public.profiles set role = 'super_admin'
where id = '90000000-0000-0000-0000-000000000005';

insert into public.official_sources (
  id, scope, country_code, name, source_url, verification_status,
  last_verified_at, integration_type, integration_enabled, is_active, is_demo,
  institution_code, platform, verification_level, registry_status, priority,
  category_scope, enabled, news_enabled, news_source_type, news_source_group,
  news_primary_region, news_ingestion_authorized, notes
) values
  ('91000000-0000-0000-0000-000000000001','news','MY','DEMO News Approved MY','https://example.invalid/news/approved-my','verified',now(),'manual_url',false,true,false,'DEMO-NEWS-APPROVED-MY','website','A','VERIFIED','P2','["GENERAL_OFFICIAL"]',true,true,'INDONESIAN_GOVERNMENT','INDONESIAN_MISSIONS','MALAYSIA',false,'private test note'),
  ('91000000-0000-0000-0000-000000000002','news','MY','DEMO News Disabled MY','https://example.invalid/news/disabled-my','verified',now(),'manual_url',false,true,false,'DEMO-NEWS-DISABLED-MY','website','A','VERIFIED','P2','["GENERAL_OFFICIAL"]',false,false,'INDONESIAN_GOVERNMENT','INDONESIAN_MISSIONS','MALAYSIA',false,'private test note'),
  ('91000000-0000-0000-0000-000000000003','news','MY','DEMO News HOLD MY','https://example.invalid/news/hold-my','unverified',null,'manual_url',false,true,false,'DEMO-NEWS-HOLD-MY','website','HOLD','HOLD','P2','["GENERAL_OFFICIAL"]',false,false,'INDONESIAN_GOVERNMENT','INDONESIAN_MISSIONS','MALAYSIA',false,'private test note'),
  ('91000000-0000-0000-0000-000000000004','news','MY','DEMO News LEGACY MY','https://example.invalid/news/legacy-my','unverified',null,'manual_url',false,true,false,'DEMO-NEWS-LEGACY-MY','website','LEGACY','LEGACY','P2','["GENERAL_OFFICIAL"]',false,false,'INDONESIAN_GOVERNMENT','INDONESIAN_MISSIONS','MALAYSIA',false,'private test note'),
  ('91000000-0000-0000-0000-000000000005','news','MY','DEMO News Unverified MY','https://example.invalid/news/unverified-my','unverified',null,'manual_url',false,true,false,'DEMO-NEWS-UNVERIFIED-MY','website','B','REVIEW','P2','["GENERAL_OFFICIAL"]',false,false,'INDONESIAN_GOVERNMENT','INDONESIAN_MISSIONS','MALAYSIA',false,'private test note'),
  ('91000000-0000-0000-0000-000000000006','news','MY','DEMO News Source Fixture','https://example.invalid/news/demo-source','unverified',null,'manual_url',false,true,true,'DEMO-NEWS-SOURCE','website','HOLD','HOLD','P2','[]',false,false,null,null,null,false,'private test note'),
  ('91000000-0000-0000-0000-000000000007','news','ZZ','DEMO News Approved ZZ','https://example.invalid/news/approved-zz','verified',now(),'manual_url',false,true,false,'DEMO-NEWS-APPROVED-ZZ','website','A','VERIFIED','P2','["GENERAL_OFFICIAL"]',true,true,'INDONESIAN_GOVERNMENT','INDONESIAN_MISSIONS','NASIONAL',false,'private test note');

insert into public.news_source_category_scopes (source_id, category_id, enabled, created_by)
select source.id, category.id, true, '90000000-0000-0000-0000-000000000004'
from public.official_sources source
cross join public.news_categories category
where source.id between '91000000-0000-0000-0000-000000000001'::uuid
  and '91000000-0000-0000-0000-000000000007'::uuid
  and category.code = 'GOVERNMENT';

insert into public.official_source_items (
  id, source_id, external_post_id, canonical_url, published_at, title,
  content_hash, verified_source, editorial_status, original_publisher_url,
  thumbnail_permission
) values
  ('93000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001','approved','https://example.invalid/news/item/approved',now(),'Approved item',repeat('1',64),true,'PUBLISHED','https://example.invalid/news/item/approved','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000002','disabled','https://example.invalid/news/item/disabled',now(),'Disabled-source item',repeat('2',64),true,'PUBLISHED','https://example.invalid/news/item/disabled','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000003','91000000-0000-0000-0000-000000000003','hold','https://example.invalid/news/item/hold',now(),'HOLD-source item',repeat('3',64),true,'PUBLISHED','https://example.invalid/news/item/hold','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000004','91000000-0000-0000-0000-000000000004','legacy','https://example.invalid/news/item/legacy',now(),'LEGACY-source item',repeat('4',64),true,'PUBLISHED','https://example.invalid/news/item/legacy','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000005','91000000-0000-0000-0000-000000000005','unverified','https://example.invalid/news/item/unverified',now(),'Unverified-source item',repeat('5',64),true,'PUBLISHED','https://example.invalid/news/item/unverified','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000006','91000000-0000-0000-0000-000000000001','demo','https://example.invalid/news/item/demo',now(),'Demo article item',repeat('6',64),true,'PUBLISHED','https://example.invalid/news/item/demo','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000007','91000000-0000-0000-0000-000000000001','rejected','https://example.invalid/news/item/rejected',now(),'Rejected item',repeat('7',64),true,'PUBLISHED','https://example.invalid/news/item/rejected','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000008','91000000-0000-0000-0000-000000000001','hard-winner','https://example.invalid/news/item/hard-winner',now(),'Hard duplicate winner',repeat('8',64),true,'PUBLISHED','https://example.invalid/news/item/hard-winner','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000009','91000000-0000-0000-0000-000000000001','hard-related','https://example.invalid/news/item/hard-related',now(),'Hard duplicate related',repeat('9',64),true,'PUBLISHED','https://example.invalid/news/item/hard-related','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000010','91000000-0000-0000-0000-000000000001','superseded','https://example.invalid/news/item/superseded',now(),'Superseded item',repeat('a',64),true,'PUBLISHED','https://example.invalid/news/item/superseded','NOT_PROVIDED'),
  ('93000000-0000-0000-0000-000000000011','91000000-0000-0000-0000-000000000001','unknown-thumbnail','https://example.invalid/news/item/unknown-thumbnail',now(),'Unknown thumbnail item',repeat('b',64),true,'PUBLISHED','https://example.invalid/news/item/unknown-thumbnail','UNKNOWN'),
  ('93000000-0000-0000-0000-000000000012','91000000-0000-0000-0000-000000000001','restricted-thumbnail','https://example.invalid/news/item/restricted-thumbnail',now(),'Restricted thumbnail item',repeat('c',64),true,'PUBLISHED','https://example.invalid/news/item/restricted-thumbnail','RESTRICTED'),
  ('93000000-0000-0000-0000-000000000013','91000000-0000-0000-0000-000000000007','cross-country','https://example.invalid/news/item/cross-country',now(),'Cross-country item',repeat('d',64),true,'PUBLISHED','https://example.invalid/news/item/cross-country','NOT_PROVIDED');

insert into public.news_items (
  id, source_id, title, official_url, summary, published_at, publication_status,
  verification_status, last_verified_at, is_demo, official_source_item_id,
  canonical_url, canonicalization_version, region, province, editorial_status,
  original_publisher_url, thumbnail_url, thumbnail_permission, superseded_by
) values
  ('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001','Approved article','https://example.invalid/news/item/approved','Approved',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000001','https://example.invalid/news/item/approved','NEWS_URL_CANON_V1','MALAYSIA','Kuala Lumpur','PUBLISHED','https://example.invalid/news/item/approved',null,'NOT_PROVIDED',null),
  ('92000000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000002','Disabled-source article','https://example.invalid/news/item/disabled','Hidden',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000002','https://example.invalid/news/item/disabled','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/disabled',null,'NOT_PROVIDED',null),
  ('92000000-0000-0000-0000-000000000003','91000000-0000-0000-0000-000000000003','HOLD-source article','https://example.invalid/news/item/hold','Hidden',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000003','https://example.invalid/news/item/hold','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/hold',null,'NOT_PROVIDED',null),
  ('92000000-0000-0000-0000-000000000004','91000000-0000-0000-0000-000000000004','LEGACY-source article','https://example.invalid/news/item/legacy','Hidden',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000004','https://example.invalid/news/item/legacy','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/legacy',null,'NOT_PROVIDED',null),
  ('92000000-0000-0000-0000-000000000005','91000000-0000-0000-0000-000000000005','Unverified-source article','https://example.invalid/news/item/unverified','Hidden',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000005','https://example.invalid/news/item/unverified','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/unverified',null,'NOT_PROVIDED',null),
  ('92000000-0000-0000-0000-000000000006','91000000-0000-0000-0000-000000000001','Demo article','https://example.invalid/news/item/demo','Hidden',now(),'published','verified',now(),true,'93000000-0000-0000-0000-000000000006','https://example.invalid/news/item/demo','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/demo',null,'NOT_PROVIDED',null),
  ('92000000-0000-0000-0000-000000000007','91000000-0000-0000-0000-000000000001','Rejected article','https://example.invalid/news/item/rejected','Hidden',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000007','https://example.invalid/news/item/rejected','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/rejected',null,'NOT_PROVIDED',null),
  ('92000000-0000-0000-0000-000000000008','91000000-0000-0000-0000-000000000001','Hard duplicate winner','https://example.invalid/news/item/hard-winner','Visible',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000008','https://example.invalid/news/item/hard-winner','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/hard-winner',null,'NOT_PROVIDED',null),
  ('92000000-0000-0000-0000-000000000009','91000000-0000-0000-0000-000000000001','Hard duplicate related','https://example.invalid/news/item/hard-related','Hidden',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000009','https://example.invalid/news/item/hard-related','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/hard-related',null,'NOT_PROVIDED',null),
  ('92000000-0000-0000-0000-000000000010','91000000-0000-0000-0000-000000000001','Superseded article','https://example.invalid/news/item/superseded','Hidden',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000010','https://example.invalid/news/item/superseded','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/superseded',null,'NOT_PROVIDED','92000000-0000-0000-0000-000000000001'),
  ('92000000-0000-0000-0000-000000000011','91000000-0000-0000-0000-000000000001','Unknown thumbnail article','https://example.invalid/news/item/unknown-thumbnail','Visible without thumbnail',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000011','https://example.invalid/news/item/unknown-thumbnail','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/unknown-thumbnail','https://example.invalid/media/unknown.jpg','UNKNOWN',null),
  ('92000000-0000-0000-0000-000000000012','91000000-0000-0000-0000-000000000001','Restricted thumbnail article','https://example.invalid/news/item/restricted-thumbnail','Visible without thumbnail',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000012','https://example.invalid/news/item/restricted-thumbnail','NEWS_URL_CANON_V1','MALAYSIA',null,'PUBLISHED','https://example.invalid/news/item/restricted-thumbnail','https://example.invalid/media/restricted.jpg','RESTRICTED',null),
  ('92000000-0000-0000-0000-000000000013','91000000-0000-0000-0000-000000000007','Cross-country article','https://example.invalid/news/item/cross-country','Visible',now(),'published','verified',now(),false,'93000000-0000-0000-0000-000000000013','https://example.invalid/news/item/cross-country','NEWS_URL_CANON_V1','NASIONAL',null,'PUBLISHED','https://example.invalid/news/item/cross-country',null,'NOT_PROVIDED',null);

insert into public.news_item_categories (news_item_id, category_id, is_primary, assigned_by)
select item.id, category.id, true, '90000000-0000-0000-0000-000000000004'
from public.news_items item
cross join public.news_categories category
where item.id between '92000000-0000-0000-0000-000000000001'::uuid
  and '92000000-0000-0000-0000-000000000013'::uuid
  and category.code = 'GOVERNMENT';

insert into public.news_editorial_reviews (news_item_id, decision, reason, private_notes, reviewed_by)
select item.id,
  case when item.id = '92000000-0000-0000-0000-000000000007' then 'REJECT'::public.news_review_decision else 'APPROVE'::public.news_review_decision end,
  case when item.id = '92000000-0000-0000-0000-000000000007' then 'ORDINARY_CRIME'::public.news_review_reason else 'OTHER'::public.news_review_reason end,
  'private editorial test note', '90000000-0000-0000-0000-000000000004'
from public.news_items item
where item.id between '92000000-0000-0000-0000-000000000001'::uuid
  and '92000000-0000-0000-0000-000000000013'::uuid;

insert into public.news_duplicate_relations (
  news_item_id, related_news_item_id, duplicate_kind, confidence, reviewed_by, reviewed_at
) values (
  '92000000-0000-0000-0000-000000000008',
  '92000000-0000-0000-0000-000000000009',
  'HARD', 1, '90000000-0000-0000-0000-000000000004', now()
);

insert into public.news_source_assessments (
  source_id, thumbnail_permission, terms_url, assessed_by
) values (
  '91000000-0000-0000-0000-000000000001', 'RESTRICTED',
  'https://example.invalid/news/thumbnail-terms',
  '90000000-0000-0000-0000-000000000004'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $$
begin
  begin
    perform 1 from public.news_items limit 1;
    raise exception 'FAIL: anon raw news_items SELECT unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    perform notes from public.official_sources limit 1;
    raise exception 'FAIL: anon raw protected official_sources SELECT unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  if not exists (
    select 1 from public.news_public_items
    where id = '92000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'FAIL: anon cannot read an approved curated News item';
  end if;

  if (
    select count(*) from public.news_public_items
    where id in (
      '92000000-0000-0000-0000-000000000001',
      '92000000-0000-0000-0000-000000000008',
      '92000000-0000-0000-0000-000000000011',
      '92000000-0000-0000-0000-000000000012',
      '92000000-0000-0000-0000-000000000013'
    )
  ) <> 5 then
    raise exception 'FAIL: curated reader did not return every valid publishable fixture';
  end if;

  if not exists (
    select 1 from public.official_sources_public
    where id = '91000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'FAIL: curated source reader hid an approved source';
  end if;

  if exists (
    select 1 from public.news_public_items
    where id in (
      '92000000-0000-0000-0000-000000000002',
      '92000000-0000-0000-0000-000000000003',
      '92000000-0000-0000-0000-000000000004',
      '92000000-0000-0000-0000-000000000005',
      '92000000-0000-0000-0000-000000000006',
      '92000000-0000-0000-0000-000000000007',
      '92000000-0000-0000-0000-000000000009',
      '92000000-0000-0000-0000-000000000010'
    )
  ) then
    raise exception 'FAIL: curated reader exposed disabled/HOLD/LEGACY/unverified/demo/rejected/duplicate/superseded content';
  end if;

  if exists (
    select 1 from public.news_public_items
    where id in (
      '92000000-0000-0000-0000-000000000011',
      '92000000-0000-0000-0000-000000000012'
    ) and thumbnail_url is not null
  ) then
    raise exception 'FAIL: curated reader exposed an UNKNOWN or restricted thumbnail';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if exists (
    select 1 from public.news_items
    where id between '92000000-0000-0000-0000-000000000001'::uuid
      and '92000000-0000-0000-0000-000000000013'::uuid
  ) then
    raise exception 'FAIL: ordinary member bypassed raw news_items RLS';
  end if;

  if exists (
    select 1 from public.official_sources
    where id between '91000000-0000-0000-0000-000000000001'::uuid
      and '91000000-0000-0000-0000-000000000007'::uuid
  ) then
    raise exception 'FAIL: ordinary member read raw official_sources metadata';
  end if;

  if exists (
    select 1 from public.official_source_items
    where id between '93000000-0000-0000-0000-000000000001'::uuid
      and '93000000-0000-0000-0000-000000000013'::uuid
  ) then
    raise exception 'FAIL: ordinary member read raw official_source_items';
  end if;

  if exists (
    select 1 from public.news_editorial_reviews
    where news_item_id = '92000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'FAIL: ordinary member read private editorial review data';
  end if;

  if private.news_url_canonical_v1('https://example.com/article/')
     = private.news_url_canonical_v1('https://example.com/article//') then
    raise exception 'FAIL: canonicalization merged distinct trailing-slash paths';
  end if;

  if private.news_url_canonical_v1('https://User:Pass@example.com/article') is not null then
    raise exception 'FAIL: canonicalization accepted userinfo credentials';
  end if;

  if private.news_url_canonical_v1('https://EXAMPLE.com/article?id=123&page=2')
     <> 'https://example.com/article?id=123&page=2' then
    raise exception 'FAIL: canonicalization changed semantic query parameters';
  end if;

  if private.news_url_canonical_v1('https://example.com/article?utm_source=x&id=123&fbclid=y&page=2&gclid=z')
     <> 'https://example.com/article?id=123&page=2' then
    raise exception 'FAIL: canonicalization did not remove only approved tracking parameters';
  end if;

  if private.news_url_canonical_v1('http://example.com/article')
     <> 'http://example.com/article' then
    raise exception 'FAIL: canonicalization performed an unapproved HTTP to HTTPS upgrade';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
  changed integer;
begin
  update public.official_sources set notes = 'country admin MY update'
  where id = '91000000-0000-0000-0000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: country_admin cannot manage its MY source'; end if;

  update public.official_sources set notes = 'forbidden cross-country update'
  where id = '91000000-0000-0000-0000-000000000007';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: country_admin escaped MY source scope'; end if;

  update public.news_items set province = 'Country admin test'
  where id = '92000000-0000-0000-0000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: country_admin cannot manage its MY News item'; end if;

  update public.news_items set province = 'Forbidden cross-country update'
  where id = '92000000-0000-0000-0000-000000000013';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: country_admin escaped MY News-item scope'; end if;

  insert into public.news_editorial_reviews (
    news_item_id, decision, reason, reviewed_by, reviewed_at, created_at
  ) values (
    '92000000-0000-0000-0000-000000000001', 'APPROVE', 'OTHER',
    '90000000-0000-0000-0000-000000000002', now() + interval '1 year', now() + interval '1 year'
  );

  insert into public.news_source_assessments (
    source_id, thumbnail_permission, terms_url, assessed_by, assessed_at, created_at
  ) values (
    '91000000-0000-0000-0000-000000000001', 'UNKNOWN', null,
    '90000000-0000-0000-0000-000000000002', now() + interval '1 year', now() + interval '1 year'
  );
end;
$$;

reset role;

do $$
begin
  if exists (
    select 1 from public.news_editorial_reviews
    where reviewed_by = '90000000-0000-0000-0000-000000000002'
      and reviewed_at > now() + interval '1 minute'
  ) then
    raise exception 'FAIL: a future editorial timestamp bypassed server time';
  end if;

  if exists (
    select 1 from public.news_source_assessments
    where assessed_by = '90000000-0000-0000-0000-000000000002'
      and assessed_at > now() + interval '1 minute'
  ) then
    raise exception 'FAIL: a future assessment timestamp bypassed server time';
  end if;

  begin
    update public.news_items
    set superseded_by = '92000000-0000-0000-0000-000000000010'
    where id = '92000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: supersession cycle was accepted';
  exception when check_violation then null;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
  changed integer;
begin
  update public.official_sources set notes = 'forbidden organization admin update'
  where id = '91000000-0000-0000-0000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: organization_admin gained platform News administration'; end if;

  if exists (
    select 1 from public.official_sources
    where id between '91000000-0000-0000-0000-000000000001'::uuid
      and '91000000-0000-0000-0000-000000000007'::uuid
  ) then
    raise exception 'FAIL: organization_admin read raw official_sources metadata';
  end if;

  update public.news_items set province = 'Forbidden organization admin update'
  where id = '92000000-0000-0000-0000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: organization_admin modified a News item'; end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
  changed integer;
begin
  update public.official_sources set notes = 'moderator authorized update'
  where id in (
    '91000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000007'
  );
  get diagnostics changed = row_count;
  if changed <> 2 then raise exception 'FAIL: moderator could not manage both authorized countries'; end if;

  update public.news_items set province = 'Moderator authorized update'
  where id in (
    '92000000-0000-0000-0000-000000000001',
    '92000000-0000-0000-0000-000000000013'
  );
  get diagnostics changed = row_count;
  if changed <> 2 then raise exception 'FAIL: moderator could not manage authorized News items'; end if;
end;
$$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000005', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
  changed integer;
begin
  update public.official_sources set notes = 'super admin authorized update'
  where id in (
    '91000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000007'
  );
  get diagnostics changed = row_count;
  if changed <> 2 then raise exception 'FAIL: super_admin could not manage authorized News sources'; end if;
end;
$$;

reset role;

rollback;

do $$
begin
  if exists (
    select 1 from auth.users
    where id between '90000000-0000-0000-0000-000000000001'::uuid
      and '90000000-0000-0000-0000-000000000005'::uuid
  ) then
    raise exception 'FAIL: transaction rollback left test users behind';
  end if;

  if exists (
    select 1 from public.official_sources
    where id between '91000000-0000-0000-0000-000000000001'::uuid
      and '91000000-0000-0000-0000-000000000007'::uuid
  ) then
    raise exception 'FAIL: transaction rollback left News fixtures behind';
  end if;
end;
$$;

select 'PASS: DUTA News V2 hosted RLS/authorization transaction test completed successfully' as result;
