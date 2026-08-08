begin;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'day2-member@example.invalid', 'test-only', now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"display_name":"Day 2 Member"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'day2-admin@example.invalid', 'test-only', now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"display_name":"Day 2 Admin"}'::jsonb, now(), now());

update public.profiles set onboarding_completed = true
where id in ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012');
update public.profiles set role = 'moderator'
where id = '00000000-0000-0000-0000-000000000012';

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if (select count(*) from public.representative_offices where is_demo) < 1 then
    raise exception 'Public demo office should be readable';
  end if;

  begin
    insert into public.official_sources (
      scope, country_code, name, source_url, is_demo, created_by
    ) values (
      'news', 'MY', 'Unauthorized member source',
      'https://example.invalid/member-must-not-create', true,
      '00000000-0000-0000-0000-000000000011'
    );
    raise exception 'RLS failure: member created an official source';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.official_sources (
  scope, country_code, name, source_url, is_demo, created_by
) values (
  'news', 'MY', 'DEMO — RLS admin test',
  'https://example.invalid/day2-admin-test', true,
  '00000000-0000-0000-0000-000000000012'
);

reset role;
rollback;
