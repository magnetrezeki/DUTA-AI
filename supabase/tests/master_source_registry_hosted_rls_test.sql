begin;

do $$
declare
  missing_tables text;
  rls_disabled_tables text;
begin
  select string_agg(expected.table_name, ', ' order by expected.table_name)
  into missing_tables
  from (
    select unnest(array[
      'countries', 'profiles',
      'official_sources', 'representative_offices', 'office_jurisdictions',
      'service_categories', 'office_contact_channels', 'news_items',
      'place_categories', 'community_places', 'place_corrections',
      'place_reviews', 'place_recommendations', 'place_confirmations', 'place_reports',
      'organizations', 'organization_claims', 'organization_memberships',
      'organization_announcements', 'organization_events',
      'organization_event_registrations', 'organization_join_links',
      'employers', 'employer_members', 'external_job_sources', 'jobs',
      'career_passports', 'job_applications', 'saved_jobs', 'job_alerts',
      'official_source_items'
    ]) as table_name
  ) expected
  where to_regclass('public.' || expected.table_name) is null;

  if missing_tables is not null then
    raise exception 'FAIL: required Day 1-Day 7 tables are missing: %', missing_tables;
  end if;

  select string_agg(expected.table_name, ', ' order by expected.table_name)
  into rls_disabled_tables
  from (
    select unnest(array[
      'countries', 'profiles',
      'official_sources', 'representative_offices', 'office_jurisdictions',
      'service_categories', 'office_contact_channels', 'news_items',
      'place_categories', 'community_places', 'place_corrections',
      'place_reviews', 'place_recommendations', 'place_confirmations', 'place_reports',
      'organizations', 'organization_claims', 'organization_memberships',
      'organization_announcements', 'organization_events',
      'organization_event_registrations', 'organization_join_links',
      'employers', 'employer_members', 'external_job_sources', 'jobs',
      'career_passports', 'job_applications', 'saved_jobs', 'job_alerts',
      'official_source_items'
    ]) as table_name
  ) expected
  left join pg_class relation
    on relation.oid = to_regclass('public.' || expected.table_name)
  where relation.oid is null or not relation.relrowsecurity;

  if rls_disabled_tables is not null then
    raise exception 'FAIL: RLS is not enabled on required tables: %', rls_disabled_tables;
  end if;
end;
$$;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000071',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'registry-member@example.invalid', 'test-only',
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Registry Test Member"}'::jsonb, now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000072',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'registry-admin@example.invalid', 'test-only',
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Registry Test Admin"}'::jsonb, now(), now()
  );

update public.profiles
set onboarding_completed = true
where id in (
  '00000000-0000-0000-0000-000000000071',
  '00000000-0000-0000-0000-000000000072'
);

update public.profiles
set role = 'moderator'
where id = '00000000-0000-0000-0000-000000000072';

insert into public.official_sources (
  id, scope, country_code, name, source_url, verification_status,
  last_verified_at, integration_type, integration_enabled, is_active, is_demo,
  institution_code, platform, verification_level, registry_status,
  priority, category_scope, enabled, notes
) values
  (
    '72000000-0000-0000-0000-000000000001', 'news', 'MY',
    'DEMO Registry Public A', 'https://example.invalid/registry-public-a',
    'verified', now(), 'manual_url', false, true, false,
    'DEMO-REGISTRY-PUBLIC-A', 'website', 'A', 'VERIFIED',
    'P2', '["GENERAL_OFFICIAL"]'::jsonb, true,
    'Temporary rolled-back hosted RLS test record.'
  ),
  (
    '72000000-0000-0000-0000-000000000002', 'news', 'MY',
    'DEMO Registry Disabled B', 'https://example.invalid/registry-disabled-b',
    'verified', now(), 'manual_url', false, true, false,
    'DEMO-REGISTRY-DISABLED-B', 'website', 'B', 'VERIFIED',
    'P2', '["GENERAL_OFFICIAL"]'::jsonb, false,
    'Temporary rolled-back hosted RLS test record.'
  ),
  (
    '72000000-0000-0000-0000-000000000003', 'news', 'MY',
    'DEMO Registry Hold', null,
    'unverified', null, null, false, false, false,
    'DEMO-REGISTRY-HOLD', null, 'HOLD', 'HOLD',
    'P2', '[]'::jsonb, false,
    'Temporary rolled-back hosted RLS test record.'
  ),
  (
    '72000000-0000-0000-0000-000000000004', 'news', 'MY',
    'DEMO Registry Legacy', 'https://example.invalid/registry-legacy',
    'unverified', null, 'manual_url', false, false, false,
    'DEMO-REGISTRY-LEGACY', 'website', 'LEGACY', 'LEGACY',
    'P2', '["GENERAL_OFFICIAL"]'::jsonb, false,
    'Temporary rolled-back hosted RLS test record.'
  ),
  (
    '72000000-0000-0000-0000-000000000005', 'news', 'MY',
    'DEMO Registry Review', null,
    'unverified', null, null, false, false, false,
    'DEMO-REGISTRY-REVIEW', 'instagram', 'B', 'REVIEW',
    'P2', '["SECURITY"]'::jsonb, false,
    'Temporary rolled-back hosted RLS test record.'
  ),
  (
    '72000000-0000-0000-0000-000000000006', 'news', 'MY',
    'DEMO Registry Level C', 'https://example.invalid/registry-level-c',
    'verified', now(), 'manual_url', false, true, false,
    'DEMO-REGISTRY-LEVEL-C', 'website', 'C', 'VERIFIED',
    'P2', '["GENERAL_OFFICIAL"]'::jsonb, false,
    'Temporary rolled-back hosted RLS test record.'
  );

insert into public.official_source_items (
  id, source_id, external_post_id, canonical_url, title,
  category, verified_source
) values
  (
    '82000000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000001',
    'registry-public-verified-item',
    'https://example.invalid/registry-public-a/item-1',
    'DEMO verified public registry item', 'GENERAL_OFFICIAL', true
  ),
  (
    '82000000-0000-0000-0000-000000000002',
    '72000000-0000-0000-0000-000000000001',
    'registry-public-unverified-item',
    'https://example.invalid/registry-public-a/item-2',
    'DEMO unverified registry item', 'GENERAL_OFFICIAL', false
  ),
  (
    '82000000-0000-0000-0000-000000000003',
    '72000000-0000-0000-0000-000000000003',
    'registry-hold-verified-item',
    'https://example.invalid/registry-hold/item-1',
    'DEMO item under HOLD source', 'GENERAL_OFFICIAL', true
  );

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $$
declare
  visible_source_count integer;
  visible_item_count integer;
begin
  select count(*)
  into visible_source_count
  from public.official_sources
  where id between
    '72000000-0000-0000-0000-000000000001'::uuid
    and '72000000-0000-0000-0000-000000000006'::uuid;

  if visible_source_count <> 1 then
    raise exception 'FAIL: anonymous readers saw % registry test sources instead of exactly 1', visible_source_count;
  end if;

  if not exists (
    select 1
    from public.official_sources
    where id = '72000000-0000-0000-0000-000000000001'
      and enabled
      and registry_status = 'VERIFIED'
      and verification_level in ('A', 'B')
  ) then
    raise exception 'FAIL: anonymous readers cannot read the enabled VERIFIED A source';
  end if;

  if exists (
    select 1
    from public.official_sources
    where id in (
      '72000000-0000-0000-0000-000000000002',
      '72000000-0000-0000-0000-000000000003',
      '72000000-0000-0000-0000-000000000004',
      '72000000-0000-0000-0000-000000000005',
      '72000000-0000-0000-0000-000000000006'
    )
  ) then
    raise exception 'FAIL: anonymous readers can read a disabled, HOLD, LEGACY, REVIEW, or C source';
  end if;

  select count(*)
  into visible_item_count
  from public.official_source_items
  where id between
    '82000000-0000-0000-0000-000000000001'::uuid
    and '82000000-0000-0000-0000-000000000003'::uuid;

  if visible_item_count <> 1 then
    raise exception 'FAIL: anonymous readers saw % registry test items instead of exactly 1', visible_item_count;
  end if;

  if not exists (
    select 1
    from public.official_source_items
    where id = '82000000-0000-0000-0000-000000000001'
      and verified_source
  ) then
    raise exception 'FAIL: anonymous readers cannot read the verified item under an enabled verified source';
  end if;

  if exists (
    select 1
    from public.official_source_items
    where id in (
      '82000000-0000-0000-0000-000000000002',
      '82000000-0000-0000-0000-000000000003'
    )
  ) then
    raise exception 'FAIL: anonymous readers can read an unverified item or an item under a HOLD source';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000071', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
  changed_rows integer;
begin
  if not exists (
    select 1
    from public.official_sources
    where id = '72000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'FAIL: authenticated public reader cannot read the enabled verified source';
  end if;

  if exists (
    select 1
    from public.official_sources
    where id in (
      '72000000-0000-0000-0000-000000000003',
      '72000000-0000-0000-0000-000000000004',
      '72000000-0000-0000-0000-000000000005',
      '72000000-0000-0000-0000-000000000006'
    )
  ) then
    raise exception 'FAIL: ordinary authenticated reader can read HOLD, LEGACY, REVIEW, or C sources';
  end if;

  begin
    insert into public.official_sources (
      id, scope, country_code, name, source_url, verification_status,
      last_verified_at, integration_type, integration_enabled, is_active, is_demo,
      institution_code, platform, verification_level, registry_status,
      priority, category_scope, enabled
    ) values (
      '72000000-0000-0000-0000-000000000009', 'news', 'MY',
      'DEMO Unauthorized Registry Insert',
      'https://example.invalid/registry-unauthorized-insert',
      'verified', now(), 'manual_url', false, true, false,
      'DEMO-REGISTRY-UNAUTHORIZED', 'website', 'A', 'VERIFIED',
      'P2', '["GENERAL_OFFICIAL"]'::jsonb, true
    );
    raise exception 'FAIL: ordinary authenticated user inserted an official source';
  exception
    when insufficient_privilege then null;
  end;

  update public.official_sources
  set notes = 'Unauthorized ordinary-user update'
  where id = '72000000-0000-0000-0000-000000000001';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then
    raise exception 'FAIL: ordinary authenticated user updated an official source';
  end if;

  delete from public.official_sources
  where id = '72000000-0000-0000-0000-000000000001';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then
    raise exception 'FAIL: ordinary authenticated user deleted an official source';
  end if;

  update public.official_sources
  set enabled = true
  where id in (
    '72000000-0000-0000-0000-000000000003',
    '72000000-0000-0000-0000-000000000004',
    '72000000-0000-0000-0000-000000000006'
  );
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then
    raise exception 'FAIL: ordinary authenticated user enabled a HOLD, LEGACY, or C source';
  end if;

  begin
    insert into public.official_source_items (
      id, source_id, external_post_id, canonical_url, title,
      category, verified_source
    ) values (
      '82000000-0000-0000-0000-000000000009',
      '72000000-0000-0000-0000-000000000001',
      'registry-unauthorized-item',
      'https://example.invalid/registry-public-a/unauthorized-item',
      'DEMO unauthorized registry item', 'GENERAL_OFFICIAL', true
    );
    raise exception 'FAIL: ordinary authenticated user inserted an official source item';
  exception
    when insufficient_privilege then null;
  end;

  update public.official_source_items
  set title = 'DEMO unauthorized registry item update'
  where id = '82000000-0000-0000-0000-000000000001';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then
    raise exception 'FAIL: ordinary authenticated user updated an official source item';
  end if;

  delete from public.official_source_items
  where id = '82000000-0000-0000-0000-000000000001';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then
    raise exception 'FAIL: ordinary authenticated user deleted an official source item';
  end if;
end;
$$;

reset role;

do $$
begin
  if exists (
    select 1
    from public.official_sources
    where id = '72000000-0000-0000-0000-000000000009'
  ) then
    raise exception 'FAIL: denied ordinary-user source insert changed database state';
  end if;

  if not exists (
    select 1
    from public.official_sources
    where id = '72000000-0000-0000-0000-000000000001'
      and notes = 'Temporary rolled-back hosted RLS test record.'
  ) then
    raise exception 'FAIL: denied ordinary-user source update or delete changed database state';
  end if;

  if exists (
    select 1
    from public.official_sources
    where id in (
      '72000000-0000-0000-0000-000000000003',
      '72000000-0000-0000-0000-000000000004',
      '72000000-0000-0000-0000-000000000006'
    )
      and enabled
  ) then
    raise exception 'FAIL: denied unsafe source enable changed database state';
  end if;

  if exists (
    select 1
    from public.official_source_items
    where id = '82000000-0000-0000-0000-000000000009'
  ) then
    raise exception 'FAIL: denied ordinary-user item insert changed database state';
  end if;

  if not exists (
    select 1
    from public.official_source_items
    where id = '82000000-0000-0000-0000-000000000001'
      and title = 'DEMO verified public registry item'
  ) then
    raise exception 'FAIL: denied ordinary-user item update or delete changed database state';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000072', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.official_sources (
  id, scope, country_code, name, source_url, verification_status,
  last_verified_at, integration_type, integration_enabled, is_active, is_demo,
  institution_code, platform, verification_level, registry_status,
  priority, category_scope, enabled, created_by, notes
) values (
  '72000000-0000-0000-0000-000000000009', 'news', 'MY',
  'DEMO Admin Authorized Registry Source',
  'https://example.invalid/registry-admin-authorized',
  'verified', now(), 'manual_url', false, true, false,
  'DEMO-REGISTRY-ADMIN-AUTHORIZED', 'website', 'A', 'VERIFIED',
  'P2', '["GENERAL_OFFICIAL"]'::jsonb, true,
  '00000000-0000-0000-0000-000000000072',
  'Temporary rolled-back hosted RLS test record.'
);

insert into public.official_source_items (
  id, source_id, external_post_id, canonical_url, title,
  category, verified_source
) values (
  '82000000-0000-0000-0000-000000000009',
  '72000000-0000-0000-0000-000000000009',
  'registry-admin-authorized-item',
  'https://example.invalid/registry-admin-authorized/item-1',
  'DEMO admin authorized registry item', 'GENERAL_OFFICIAL', true
);

do $$
declare
  changed_rows integer;
begin
  if not exists (
    select 1
    from public.official_sources
    where id = '72000000-0000-0000-0000-000000000009'
  ) then
    raise exception 'FAIL: trusted platform admin cannot read the source it created';
  end if;

  update public.official_sources
  set notes = 'Temporary admin-authorized update inside rolled-back test.'
  where id = '72000000-0000-0000-0000-000000000009';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'FAIL: trusted platform admin cannot update an authorized source';
  end if;

  update public.official_source_items
  set title = 'DEMO admin-authorized registry item update'
  where id = '82000000-0000-0000-0000-000000000009';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'FAIL: trusted platform admin cannot update an authorized source item';
  end if;

  delete from public.official_source_items
  where id = '82000000-0000-0000-0000-000000000009';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'FAIL: trusted platform admin cannot delete an authorized source item';
  end if;

  begin
    update public.official_sources
    set enabled = true
    where id = '72000000-0000-0000-0000-000000000003';
    raise exception 'FAIL: platform admin enabled a HOLD source';
  exception
    when check_violation then null;
  end;

  begin
    update public.official_sources
    set enabled = true
    where id = '72000000-0000-0000-0000-000000000004';
    raise exception 'FAIL: platform admin enabled a LEGACY source';
  exception
    when check_violation then null;
  end;

  begin
    update public.official_sources
    set enabled = true
    where id = '72000000-0000-0000-0000-000000000006';
    raise exception 'FAIL: platform admin enabled a verification-level C source';
  exception
    when check_violation then null;
  end;

  delete from public.official_sources
  where id = '72000000-0000-0000-0000-000000000009';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'FAIL: trusted platform admin cannot delete an authorized test source';
  end if;
end;
$$;

reset role;

do $$
declare
  rls_disabled_tables text;
begin
  if exists (
    select 1
    from public.official_sources
    where id = '72000000-0000-0000-0000-000000000009'
  ) then
    raise exception 'FAIL: trusted-admin delete did not remove its temporary source';
  end if;

  if exists (
    select 1
    from public.official_sources
    where id in (
      '72000000-0000-0000-0000-000000000003',
      '72000000-0000-0000-0000-000000000004',
      '72000000-0000-0000-0000-000000000006'
    )
      and enabled
  ) then
    raise exception 'FAIL: unsafe HOLD, LEGACY, or C source became enabled';
  end if;

  select string_agg(expected.table_name, ', ' order by expected.table_name)
  into rls_disabled_tables
  from (
    select unnest(array[
      'countries', 'profiles',
      'official_sources', 'representative_offices', 'office_jurisdictions',
      'service_categories', 'office_contact_channels', 'news_items',
      'place_categories', 'community_places', 'place_corrections',
      'place_reviews', 'place_recommendations', 'place_confirmations', 'place_reports',
      'organizations', 'organization_claims', 'organization_memberships',
      'organization_announcements', 'organization_events',
      'organization_event_registrations', 'organization_join_links',
      'employers', 'employer_members', 'external_job_sources', 'jobs',
      'career_passports', 'job_applications', 'saved_jobs', 'job_alerts',
      'official_source_items'
    ]) as table_name
  ) expected
  left join pg_class relation
    on relation.oid = to_regclass('public.' || expected.table_name)
  where relation.oid is null or not relation.relrowsecurity;

  if rls_disabled_tables is not null then
    raise exception 'FAIL: Day 1-Day 7 RLS state changed for: %', rls_disabled_tables;
  end if;
end;
$$;

rollback;

select 'PASS: Master Source Registry hosted RLS/authorization transaction test completed successfully' as result;
