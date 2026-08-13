begin;

insert into public.countries (
  code, name, is_active, source_url, verification_status, verified_at
)
values (
  'ID', 'Indonesia', false,
  'https://www.iso.org/obp/ui/#iso:code:3166:ID', 'verified',
  '2026-08-11 00:00:00+08'::timestamptz
)
on conflict (code) do nothing;

insert into public.countries (
  code, name, is_active, source_url, verification_status, verified_at
)
values (
  'ZZ', 'DEMO Scope Test Country', false,
  'https://example.invalid/scope-test-country', 'verified', now()
)
on conflict (code) do nothing;

do $$
begin
  if not exists (
    select 1 from public.countries
    where code = 'ID' and name = 'Indonesia' and not is_active
  ) then
    raise exception 'FAIL: exact inactive Indonesia country fixture is unavailable';
  end if;

  if not exists (
    select 1 from public.countries
    where code = 'ZZ' and name = 'DEMO Scope Test Country' and not is_active
  ) then
    raise exception 'FAIL: exact second-country fixture is unavailable';
  end if;
end;
$$;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('94000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','scope-member@example.invalid','test-only',now(),'{}','{"display_name":"Scope Member"}',now(),now()),
  ('94000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','scope-organization-admin@example.invalid','test-only',now(),'{}','{"display_name":"Scope Organization Admin"}',now(),now()),
  ('94000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','scope-country-admin@example.invalid','test-only',now(),'{}','{"display_name":"Scope Country Admin"}',now(),now()),
  ('94000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','scope-moderator@example.invalid','test-only',now(),'{}','{"display_name":"Scope Moderator"}',now(),now()),
  ('94000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','scope-super-admin@example.invalid','test-only',now(),'{}','{"display_name":"Scope Super Admin"}',now(),now());

update public.profiles
set onboarding_completed = true
where id between '94000000-0000-0000-0000-000000000001'::uuid
  and '94000000-0000-0000-0000-000000000005'::uuid;
update public.profiles set role = 'organization_admin' where id = '94000000-0000-0000-0000-000000000002';
update public.profiles set role = 'country_admin', current_country_code = 'MY' where id = '94000000-0000-0000-0000-000000000003';
update public.profiles set role = 'moderator' where id = '94000000-0000-0000-0000-000000000004';
update public.profiles set role = 'super_admin' where id = '94000000-0000-0000-0000-000000000005';

set local role authenticated;
select set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if not private.can_manage_country('MY') then
    raise exception 'FAIL: MY country_admin lost legitimate MY access';
  end if;

  if private.can_manage_country('ID') then
    raise exception 'FAIL: MY country_admin unexpectedly manages ID before scope-change attempt';
  end if;

  begin
    update public.profiles
    set current_country_code = 'ID'
    where id = '94000000-0000-0000-0000-000000000003';
    raise exception 'FAIL: country_admin self-switched from MY to ID';
  exception
    when insufficient_privilege then
      if sqlerrm <> 'Country administrators cannot change their own administrative country scope' then
        raise exception 'FAIL: MY to ID denial came from an unexpected 42501 error: %', sqlerrm;
      end if;
  end;

  begin
    update public.profiles
    set current_country_code = 'ZZ'
    where id = '94000000-0000-0000-0000-000000000003';
    raise exception 'FAIL: country_admin self-switched from MY to second country';
  exception
    when insufficient_privilege then
      if sqlerrm <> 'Country administrators cannot change their own administrative country scope' then
        raise exception 'FAIL: MY to second-country denial came from an unexpected 42501 error: %', sqlerrm;
      end if;
  end;

  begin
    update public.profiles
    set current_country_code = null
    where id = '94000000-0000-0000-0000-000000000003';
    raise exception 'FAIL: country_admin changed administrative scope to NULL';
  exception
    when insufficient_privilege then
      if sqlerrm <> 'Country administrators cannot change their own administrative country scope' then
        raise exception 'FAIL: NULL denial came from an unexpected 42501 error: %', sqlerrm;
      end if;
  end;

  if not exists (
    select 1 from public.profiles
    where id = '94000000-0000-0000-0000-000000000003'
      and role = 'country_admin' and current_country_code = 'MY'
  ) then
    raise exception 'FAIL: rejected scope change altered country_admin profile';
  end if;

  if private.can_manage_country('ID') then
    raise exception 'FAIL: country_admin gained ID access after rejected direct update';
  end if;
end;
$$;

reset role;

do $$
begin
  begin
    update public.profiles
    set role = 'member', current_country_code = 'ID'
    where id = '94000000-0000-0000-0000-000000000003';
    raise exception 'FAIL: country_admin bypassed guard with a combined role and country update';
  exception
    when insufficient_privilege then
      if sqlerrm <> 'Users cannot change their own authorization role' then
        raise exception 'FAIL: combined role and country denial came from an unexpected 42501 error: %', sqlerrm;
      end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000005', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

update public.profiles
set current_country_code = 'ZZ'
where id = '94000000-0000-0000-0000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if not private.can_manage_country('ZZ') then
    raise exception 'FAIL: trusted privileged reassignment did not grant the reassigned country scope';
  end if;

  if private.can_manage_country('MY') then
    raise exception 'FAIL: trusted privileged reassignment retained the old country scope';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

update public.profiles
set display_name = 'Updated Scope Member'
where id = '94000000-0000-0000-0000-000000000001';

do $$
begin
  if not exists (
    select 1 from public.profiles
    where id = '94000000-0000-0000-0000-000000000001'
      and display_name = 'Updated Scope Member'
  ) then
    raise exception 'FAIL: legitimate member profile update was blocked';
  end if;

  if private.can_manage_country('MY') or private.can_manage_country('ID') then
    raise exception 'FAIL: ordinary member gained country administration';
  end if;

  if exists (
    select 1 from public.countries where code = 'ID'
  ) then
    raise exception 'FAIL: inactive Indonesia appeared in the authenticated active-country selection path';
  end if;

  begin
    update public.profiles
    set role = 'country_admin', current_country_code = 'ID'
    where id = '94000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: member changed role and country scope';
  exception
    when insufficient_privilege then
      if position('permission denied for table profiles' in sqlerrm) = 0 then
        raise exception 'FAIL: member role/country denial came from an unexpected 42501 error: %', sqlerrm;
      end if;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if private.can_manage_country('MY') or private.can_manage_country('ID') then
    raise exception 'FAIL: organization_admin gained country administration';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if not private.can_manage_country('MY') or not private.can_manage_country('ID') then
    raise exception 'FAIL: moderator cross-country behavior regressed';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '94000000-0000-0000-0000-000000000005', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if not private.can_manage_country('MY') or not private.can_manage_country('ID') then
    raise exception 'FAIL: super_admin cross-country behavior regressed';
  end if;
end;
$$;

reset role;

insert into public.official_sources (
  id, scope, country_code, name, source_url, verification_status,
  last_verified_at, integration_type, integration_enabled, is_active, is_demo,
  institution_code, platform, official_website, verification_level,
  registry_status, priority, category_scope, enabled, news_enabled,
  news_source_type, news_source_group, news_primary_region,
  news_ingestion_authorized, notes
)
values (
  '95000000-0000-0000-0000-000000000001', 'news', 'ID',
  'DEMO Scope Hardening Media', 'https://example.invalid/scope-hardening-media',
  'verified', now(), 'manual_url', false, true, false,
  'DEMO-SCOPE-HARDENING-MEDIA', 'website',
  'https://example.invalid/scope-hardening-media', 'B', 'VERIFIED', 'P2',
  '["GENERAL_OFFICIAL"]', true, true, 'MEDIA', 'INDONESIAN_MEDIA',
  'NASIONAL', false, 'Rollback-only scope hardening fixture'
);

do $$
begin
  if not private.is_news_source_publishable('95000000-0000-0000-0000-000000000001') then
    raise exception 'FAIL: inactive country reference blocked otherwise-publishable Group C source';
  end if;
end;
$$;

do $$
begin
  raise notice 'PASS: country_admin scope hardening hosted RLS test completed successfully';
end;
$$;

rollback;
