begin;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day4-admin-a@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 4 Admin A"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day4-member-b@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 4 Member B"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day4-moderator@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 4 Moderator"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000045', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day4-member-c@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 4 Member C"}'::jsonb, now(), now());

update public.profiles
set onboarding_completed = true
where id in (
  '00000000-0000-0000-0000-000000000041',
  '00000000-0000-0000-0000-000000000042',
  '00000000-0000-0000-0000-000000000043',
  '00000000-0000-0000-0000-000000000045'
);

update public.profiles
set role = 'moderator'
where id = '00000000-0000-0000-0000-000000000043';

insert into public.organizations (
  id, country_code, slug, name, description, city, state_region,
  status, verification_status, submitted_by, reviewed_by, reviewed_at
) values
  ('53000000-0000-0000-0000-000000000001', 'MY', 'demo-day4-organization-a', 'DEMO Day 4 Organization A', 'DEMO organization used only inside this rolled-back authorization test.', 'DEMO City', 'DEMO State', 'approved', 'unverified', '00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000043', now()),
  ('53000000-0000-0000-0000-000000000002', 'MY', 'demo-day4-organization-b', 'DEMO Day 4 Organization B', 'DEMO organization used only inside this rolled-back authorization test.', 'DEMO City', 'DEMO State', 'approved', 'unverified', '00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000043', now());

insert into public.organization_memberships (
  id, organization_id, user_id, role, status, approved_by, approved_at
) values (
  '54000000-0000-0000-0000-000000000001',
  '53000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000041',
  'admin', 'approved',
  '00000000-0000-0000-0000-000000000043', now()
);

insert into public.organization_memberships (
  id, organization_id, user_id, role, status
) values (
  '54000000-0000-0000-0000-000000000002',
  '53000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000042',
  'member', 'pending'
);

insert into public.organization_announcements (
  id, organization_id, title, body, status, created_by
) values (
  '55000000-0000-0000-0000-000000000002',
  '53000000-0000-0000-0000-000000000002',
  'DEMO Organization B draft',
  'DEMO private draft announcement for this transaction test.',
  'draft',
  '00000000-0000-0000-0000-000000000043'
);

insert into public.organization_events (
  id, organization_id, title, description, starts_at, ends_at,
  online_url, status, created_by
) values (
  '56000000-0000-0000-0000-000000000002',
  '53000000-0000-0000-0000-000000000002',
  'DEMO Organization B draft event',
  'DEMO private draft event for this transaction test.',
  now() + interval '10 days', now() + interval '10 days 2 hours',
  'https://example.invalid/day4-org-b-event', 'draft',
  '00000000-0000-0000-0000-000000000043'
);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $$
begin
  if (select count(*) from public.organizations where id in (
    '53000000-0000-0000-0000-000000000001',
    '53000000-0000-0000-0000-000000000002'
  )) <> 2 then
    raise exception 'FAIL: anonymous users cannot read approved organizations';
  end if;

  if exists (select 1 from public.organization_announcements where id = '55000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL: anonymous user read a draft announcement';
  end if;

  if exists (select 1 from public.organization_events where id = '56000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL: anonymous user read a draft event';
  end if;

  begin
    perform 1 from public.organization_memberships limit 1;
    raise exception 'FAIL: anonymous user accessed private memberships';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from public.organization_claims limit 1;
    raise exception 'FAIL: anonymous user accessed private claims';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000042', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.organization_memberships (
  id, organization_id, user_id, role, status
) values (
  '54000000-0000-0000-0000-000000000003',
  '53000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000042',
  'member', 'pending'
);

insert into public.organization_claims (
  id, organization_id, claimant_id, reason, status
) values (
  '57000000-0000-0000-0000-000000000001',
  '53000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000042',
  'DEMO claim evidence used only inside this rolled-back authorization test.',
  'pending'
);

do $$
declare changed_rows integer;
begin
  if not exists (select 1 from public.organization_memberships where id = '54000000-0000-0000-0000-000000000003' and user_id = '00000000-0000-0000-0000-000000000042' and role = 'member' and status = 'pending') then
    raise exception 'FAIL: member cannot read their membership request';
  end if;

  if not exists (select 1 from public.organization_claims where id = '57000000-0000-0000-0000-000000000001' and claimant_id = '00000000-0000-0000-0000-000000000042') then
    raise exception 'FAIL: claimant cannot read their own claim';
  end if;

  begin
    insert into public.organization_announcements (organization_id, title, body, status, created_by)
    values ('53000000-0000-0000-0000-000000000001', 'DEMO unauthorized announcement', 'This unauthorized announcement must be rejected by RLS.', 'draft', '00000000-0000-0000-0000-000000000042');
    raise exception 'FAIL: ordinary member created an announcement';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.organization_events (organization_id, title, description, starts_at, online_url, status, created_by)
    values ('53000000-0000-0000-0000-000000000001', 'DEMO unauthorized event', 'This unauthorized event must be rejected by RLS.', now() + interval '20 days', 'https://example.invalid/unauthorized-event', 'draft', '00000000-0000-0000-0000-000000000042');
    raise exception 'FAIL: ordinary member created an event';
  exception when insufficient_privilege then null;
  end;

  update public.organization_memberships
  set status = 'approved', approved_by = '00000000-0000-0000-0000-000000000042', approved_at = now()
  where id = '54000000-0000-0000-0000-000000000003';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then
    raise exception 'FAIL: member approved their own membership';
  end if;

  begin
    perform public.approve_organization_claim('57000000-0000-0000-0000-000000000001');
    raise exception 'FAIL: member approved their own claim';
  exception when raise_exception then
    if sqlerrm = 'FAIL: member approved their own claim' then raise; end if;
    if sqlerrm <> 'Forbidden' then raise exception 'FAIL: unexpected member claim error: %', sqlerrm; end if;
  end;

  begin
    update public.profiles set role = 'super_admin' where id = '00000000-0000-0000-0000-000000000042';
    raise exception 'FAIL: member changed their platform role';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000041', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.organization_announcements (
  id, organization_id, title, body, status, published_at, created_by
) values (
  '55000000-0000-0000-0000-000000000001',
  '53000000-0000-0000-0000-000000000001',
  'DEMO Organization A announcement',
  'DEMO published announcement for this transaction test.',
  'published', now(),
  '00000000-0000-0000-0000-000000000041'
);

insert into public.organization_events (
  id, organization_id, title, description, starts_at, ends_at,
  online_url, capacity, status, published_at, created_by
) values (
  '56000000-0000-0000-0000-000000000001',
  '53000000-0000-0000-0000-000000000001',
  'DEMO Organization A event',
  'DEMO published event for this transaction test.',
  now() + interval '5 days', now() + interval '5 days 2 hours',
  'https://example.invalid/day4-org-a-event', 50, 'published', now(),
  '00000000-0000-0000-0000-000000000041'
);

insert into public.organization_join_links (
  id, organization_id, token, is_active, expires_at, created_by
) values (
  '58000000-0000-0000-0000-000000000001',
  '53000000-0000-0000-0000-000000000001',
  '59000000-0000-0000-0000-000000000001',
  true, now() + interval '7 days',
  '00000000-0000-0000-0000-000000000041'
);

do $$
declare changed_rows integer;
begin
  update public.organization_announcements set title = 'DEMO Organization A announcement edited' where id = '55000000-0000-0000-0000-000000000001';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then raise exception 'FAIL: Admin A cannot edit Organization A announcement'; end if;

  update public.organization_events set title = 'DEMO Organization A event edited' where id = '56000000-0000-0000-0000-000000000001';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then raise exception 'FAIL: Admin A cannot edit Organization A event'; end if;

  begin
    insert into public.organization_announcements (organization_id, title, body, status, created_by)
    values ('53000000-0000-0000-0000-000000000002', 'DEMO forbidden announcement', 'This cross-organization announcement must be rejected.', 'draft', '00000000-0000-0000-0000-000000000041');
    raise exception 'FAIL: Admin A created Organization B announcement';
  exception when insufficient_privilege then null;
  end;

  update public.organization_announcements set title = 'DEMO unauthorized edit' where id = '55000000-0000-0000-0000-000000000002';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then raise exception 'FAIL: Admin A edited Organization B announcement'; end if;

  begin
    insert into public.organization_events (organization_id, title, description, starts_at, online_url, status, created_by)
    values ('53000000-0000-0000-0000-000000000002', 'DEMO forbidden event', 'This cross-organization event must be rejected.', now() + interval '30 days', 'https://example.invalid/forbidden-event', 'draft', '00000000-0000-0000-0000-000000000041');
    raise exception 'FAIL: Admin A created Organization B event';
  exception when insufficient_privilege then null;
  end;

  update public.organization_events set title = 'DEMO unauthorized edit' where id = '56000000-0000-0000-0000-000000000002';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then raise exception 'FAIL: Admin A edited Organization B event'; end if;

  update public.organization_memberships
  set status = 'approved', approved_by = '00000000-0000-0000-0000-000000000041', approved_at = now()
  where id = '54000000-0000-0000-0000-000000000003';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then raise exception 'FAIL: Admin A cannot approve Organization A member'; end if;

  update public.organization_memberships
  set status = 'approved', approved_by = '00000000-0000-0000-0000-000000000041', approved_at = now()
  where id = '54000000-0000-0000-0000-000000000002';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then raise exception 'FAIL: Admin A approved Organization B member'; end if;

  begin
    update public.organization_memberships set role = 'admin' where id = '54000000-0000-0000-0000-000000000003';
    raise exception 'FAIL: Admin A promoted another user';
  exception when raise_exception then
    if sqlerrm = 'FAIL: Admin A promoted another user' then raise; end if;
    if sqlerrm <> 'Organization admins cannot change membership identity or role' then raise exception 'FAIL: unexpected promotion error: %', sqlerrm; end if;
  end;

  begin
    update public.profiles set role = 'moderator' where id = '00000000-0000-0000-0000-000000000042';
    raise exception 'FAIL: Admin A changed another user platform role';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.organizations
    set verification_status = 'verified', source_url = 'https://example.invalid/day4-verification', last_verified_at = now()
    where id = '53000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: Admin A self-verified Organization A';
  exception when raise_exception then
    if sqlerrm = 'FAIL: Admin A self-verified Organization A' then raise; end if;
    if sqlerrm <> 'Only platform moderators may change organization review fields' then raise exception 'FAIL: unexpected verification error: %', sqlerrm; end if;
  end;

  begin
    perform public.approve_organization_claim('57000000-0000-0000-0000-000000000001');
    raise exception 'FAIL: Admin A approved a platform claim';
  exception when raise_exception then
    if sqlerrm = 'FAIL: Admin A approved a platform claim' then raise; end if;
    if sqlerrm <> 'Forbidden' then raise exception 'FAIL: unexpected admin claim error: %', sqlerrm; end if;
  end;

  if not exists (select 1 from public.organization_memberships where id = '54000000-0000-0000-0000-000000000003') then
    raise exception 'FAIL: Admin A cannot read Organization A membership';
  end if;
  if exists (select 1 from public.organization_memberships where id = '54000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL: Admin A read Organization B private membership';
  end if;

  begin
    insert into public.organization_join_links (organization_id, token, is_active, expires_at, created_by)
    values ('53000000-0000-0000-0000-000000000002', '59000000-0000-0000-0000-000000000002', true, now() + interval '7 days', '00000000-0000-0000-0000-000000000041');
    raise exception 'FAIL: Admin A created Organization B join link';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000045', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.organization_memberships (
  id, organization_id, user_id, role, status
) values (
  '54000000-0000-0000-0000-000000000004',
  '53000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000045',
  'member', 'pending'
);

insert into public.organization_event_registrations (event_id, user_id, status)
values (
  '56000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000045',
  'registered'
);

do $$
begin
  if not exists (select 1 from public.organization_join_links where token = '59000000-0000-0000-0000-000000000001' and is_active) then
    raise exception 'FAIL: member cannot read active join link';
  end if;
  if not exists (select 1 from public.organization_memberships where id = '54000000-0000-0000-0000-000000000004' and role = 'member' and status = 'pending' and approved_by is null and approved_at is null) then
    raise exception 'FAIL: join request did not remain pending';
  end if;
  if exists (select 1 from public.organization_memberships where id in ('54000000-0000-0000-0000-000000000001', '54000000-0000-0000-0000-000000000002', '54000000-0000-0000-0000-000000000003')) then
    raise exception 'FAIL: member read another user private membership';
  end if;
  if not exists (select 1 from public.organization_event_registrations where event_id = '56000000-0000-0000-0000-000000000001' and user_id = '00000000-0000-0000-0000-000000000045' and status = 'registered') then
    raise exception 'FAIL: user cannot read their own event registration';
  end if;
end;
$$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $$
begin
  if not exists (select 1 from public.organization_announcements where id = '55000000-0000-0000-0000-000000000001' and status = 'published') then
    raise exception 'FAIL: anonymous user cannot read published announcement';
  end if;
  if exists (select 1 from public.organization_announcements where id = '55000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL: anonymous user read draft announcement';
  end if;
  if not exists (select 1 from public.organization_events where id = '56000000-0000-0000-0000-000000000001' and status = 'published') then
    raise exception 'FAIL: anonymous user cannot read published event';
  end if;
  if exists (select 1 from public.organization_events where id = '56000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL: anonymous user read draft event';
  end if;
  if not exists (select 1 from public.organization_join_links where id = '58000000-0000-0000-0000-000000000001' and is_active) then
    raise exception 'FAIL: anonymous user cannot read active join link';
  end if;
  begin
    perform 1 from public.organization_event_registrations limit 1;
    raise exception 'FAIL: anonymous user accessed event registrations';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000043', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.approve_organization_claim('57000000-0000-0000-0000-000000000001');

do $$
begin
  if not exists (select 1 from public.organization_claims where id = '57000000-0000-0000-0000-000000000001' and status = 'approved' and reviewed_by = '00000000-0000-0000-0000-000000000043' and reviewed_at is not null) then
    raise exception 'FAIL: moderator approval was not recorded';
  end if;
  if not exists (select 1 from public.organization_memberships where organization_id = '53000000-0000-0000-0000-000000000001' and user_id = '00000000-0000-0000-0000-000000000042' and role = 'admin' and status = 'approved' and approved_by = '00000000-0000-0000-0000-000000000043') then
    raise exception 'FAIL: claimant did not receive Organization A admin role';
  end if;
  if exists (select 1 from public.organization_memberships where organization_id = '53000000-0000-0000-0000-000000000002' and user_id = '00000000-0000-0000-0000-000000000042' and role = 'admin' and status = 'approved') then
    raise exception 'FAIL: claim granted access to Organization B';
  end if;
  if not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-000000000042' and role = 'member') then
    raise exception 'FAIL: claim escalated the platform-level role';
  end if;
end;
$$;

reset role;
rollback;

select 'PASS: Day 4 hosted RLS/authorization transaction test completed successfully' as result;
