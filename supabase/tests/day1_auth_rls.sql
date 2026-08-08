begin;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user-a@example.invalid',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"User A"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user-b@example.invalid',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"User B"}'::jsonb,
    now(),
    now()
  );

update public.profiles
set onboarding_completed = true
where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'RLS failure: User A can read another user profile';
  end if;

  if exists (
    select 1 from public.profiles
    where id = '00000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'RLS failure: User A can access User B private data';
  end if;

  if (select private.is_platform_admin()) then
    raise exception 'Authorization failure: member is treated as platform admin';
  end if;
end;
$$;

reset role;
rollback;
