begin;

do $$
declare
  expected_tables text[] := array[
    'community_places', 'place_categories', 'place_confirmations',
    'place_corrections', 'place_recommendations', 'place_reports', 'place_reviews'
  ];
  expected_indexes text[] := array[
    'community_places_public_search_idx', 'community_places_duplicate_idx',
    'community_places_location_idx', 'place_corrections_moderation_idx',
    'place_reviews_public_idx', 'place_reports_moderation_idx'
  ];
begin
  if (select count(*) from pg_catalog.pg_tables where schemaname = 'public' and tablename = any(expected_tables)) <> 7 then
    raise exception 'FAIL: not all seven Day 3 tables exist in public schema';
  end if;
  if (select count(*) from pg_catalog.pg_class where relnamespace = 'public'::regnamespace and relname = any(expected_tables) and relrowsecurity) <> 7 then
    raise exception 'FAIL: RLS is not enabled on all seven Day 3 tables';
  end if;
  if (select count(*) from pg_catalog.pg_policies where schemaname = 'public' and tablename = any(expected_tables)) <> 18 then
    raise exception 'FAIL: expected 18 Day 3 RLS policies';
  end if;
  if (select count(*) from pg_catalog.pg_indexes where schemaname = 'public' and indexname = any(expected_indexes)) <> 6 then
    raise exception 'FAIL: required Day 3 indexes are missing';
  end if;
  if (select count(*) from pg_catalog.pg_constraint c join pg_catalog.pg_class r on r.oid = c.conrelid where r.relnamespace = 'public'::regnamespace and r.relname = any(expected_tables) and c.contype = 'p') <> 7 then
    raise exception 'FAIL: expected seven Day 3 primary keys';
  end if;
  if (select count(*) from pg_catalog.pg_constraint c join pg_catalog.pg_class r on r.oid = c.conrelid where r.relnamespace = 'public'::regnamespace and r.relname = any(expected_tables) and c.contype = 'f') <> 19 then
    raise exception 'FAIL: expected nineteen Day 3 foreign keys';
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'place_categories_slug_key' and contype = 'u')
     or not exists (select 1 from pg_catalog.pg_constraint where conname = 'place_reviews_place_id_author_id_key' and contype = 'u') then
    raise exception 'FAIL: required unique constraints are missing';
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conname = 'community_places_moderation_audit' and contype = 'c')
     or not exists (select 1 from pg_catalog.pg_constraint where conname = 'community_places_no_self_duplicate' and contype = 'c')
     or not exists (select 1 from pg_catalog.pg_constraint where conname = 'place_categories_not_self_parent' and contype = 'c') then
    raise exception 'FAIL: required named check constraints are missing';
  end if;
end;
$$;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day3-user-a@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 3 User A"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day3-user-b@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 3 User B"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day3-admin@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 3 Admin"}'::jsonb, now(), now());

update public.profiles set onboarding_completed = true
where id in ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000023');
update public.profiles set role = 'moderator' where id = '00000000-0000-0000-0000-000000000023';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
insert into public.community_places (
  id, country_code, category_id, name, address_text, city, state_region,
  latitude, longitude, submitted_by
) values (
  '52000000-0000-0000-0000-000000000001', 'MY', '51000000-0000-0000-0000-000000000001',
  'DEMO - Day 3 RLS Place', 'DEMO address, not real', 'DEMO City', 'DEMO State', 0, 0,
  '00000000-0000-0000-0000-000000000021'
);

do $$ begin
  if not exists (select 1 from public.community_places where id = '52000000-0000-0000-0000-000000000001' and moderation_status = 'pending' and trust_label = 'community_unverified') then
    raise exception 'FAIL: submission was not pending and community-unverified';
  end if;
end $$;

insert into public.community_places (
  id, country_code, category_id, name, address_text, city, state_region,
  latitude, longitude, submitted_by
) values (
  '52000000-0000-0000-0000-000000000002', 'MY', '51000000-0000-0000-0000-000000000001',
  'DEMO - Day 3 RLS Place', 'Another DEMO address, not real', 'DEMO City', 'DEMO State', 0.1, 0.1,
  '00000000-0000-0000-0000-000000000021'
);

do $$ begin
  if (select potential_duplicate_id from public.community_places where id = '52000000-0000-0000-0000-000000000002') <> '52000000-0000-0000-0000-000000000001'::uuid then
    raise exception 'FAIL: duplicate candidate was not flagged';
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$ declare changed integer; begin
  update public.community_places set name = 'User B unauthorized edit' where id = '52000000-0000-0000-0000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: User B modified User A contribution'; end if;

  update public.community_places set moderation_status = 'approved', trust_label = 'admin_reviewed' where id = '52000000-0000-0000-0000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: ordinary member escalated moderation or trust'; end if;
end $$;

reset role;
set local role anon;
do $$ begin
  if exists (select 1 from public.community_places where id = '52000000-0000-0000-0000-000000000001') then
    raise exception 'FAIL: pending place is visible anonymously';
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000023', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
update public.community_places set
  moderation_status = 'approved', trust_label = 'admin_reviewed',
  moderated_by = '00000000-0000-0000-0000-000000000023', moderated_at = now()
where id = '52000000-0000-0000-0000-000000000001';

reset role;
set local role anon;
do $$ begin
  if not exists (select 1 from public.community_places where id = '52000000-0000-0000-0000-000000000001') then
    raise exception 'FAIL: approved place is not visible anonymously';
  end if;
end $$;

reset role;
rollback;

select 'PASS: Day 3 hosted schema, RLS, ownership, moderation, duplicate detection, anonymous access, and rollback cleanup verified.' as result;
