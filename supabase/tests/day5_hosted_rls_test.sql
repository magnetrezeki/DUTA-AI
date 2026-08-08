begin;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day5-employer-a@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 5 Employer A"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day5-employer-b@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 5 Employer B"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day5-applicant-a@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 5 Applicant A"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day5-applicant-b@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 5 Applicant B"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'day5-moderator@example.invalid', 'test-only', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Day 5 Moderator"}'::jsonb, now(), now());

update public.profiles set onboarding_completed = true where id in (
  '00000000-0000-0000-0000-000000000051',
  '00000000-0000-0000-0000-000000000052',
  '00000000-0000-0000-0000-000000000053',
  '00000000-0000-0000-0000-000000000054',
  '00000000-0000-0000-0000-000000000055'
);
update public.profiles set role = 'moderator' where id = '00000000-0000-0000-0000-000000000055';

insert into public.employers (
  id, country_code, name, description, contact_email, status,
  verification_source_url, last_verified_at, submitted_by, reviewed_by, reviewed_at
) values
  ('63000000-0000-0000-0000-000000000001', 'MY', 'DEMO Employer A', 'DEMO employer used only inside this rolled-back test.', 'employer-a@example.invalid', 'verified', 'https://example.invalid/employer-a-verification', now(), '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000055', now()),
  ('63000000-0000-0000-0000-000000000002', 'MY', 'DEMO Employer B', 'DEMO employer used only inside this rolled-back test.', 'employer-b@example.invalid', 'verified', 'https://example.invalid/employer-b-verification', now(), '00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000055', now()),
  ('63000000-0000-0000-0000-000000000003', 'MY', 'DEMO Pending Employer', 'DEMO pending employer used only inside this rolled-back test.', 'pending@example.invalid', 'pending', null, null, '00000000-0000-0000-0000-000000000051', null, null);

insert into public.employer_members (employer_id, user_id, role) values
  ('63000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000051', 'admin'),
  ('63000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000052', 'admin');

insert into public.external_job_sources (
  id, code, name, official_url, authorization_status, adapter_key, is_active
) values (
  '66000000-0000-0000-0000-000000000001',
  'DEMO_DAY5_SOURCE',
  'DEMO Day 5 Source',
  'https://example.invalid/day5-source',
  'authorized',
  'demo-day5-source',
  true
);

insert into public.jobs (
  id, employer_id, country_code, title, description, location_text,
  employment_type, status, source_type, deadline, posted_by, moderated_by, moderated_at
) values
  ('64000000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000001', 'MY', 'DEMO Job A', 'DEMO published job used only inside this rolled-back authorization test.', 'DEMO Location A', 'full_time', 'published', 'internal', now() + interval '10 days', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000055', now()),
  ('64000000-0000-0000-0000-000000000002', '63000000-0000-0000-0000-000000000002', 'MY', 'DEMO Job B', 'DEMO published job used only inside this rolled-back authorization test.', 'DEMO Location B', 'contract', 'published', 'internal', now() + interval '10 days', '00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000055', now()),
  ('64000000-0000-0000-0000-000000000003', '63000000-0000-0000-0000-000000000001', 'MY', 'DEMO Expired Job', 'DEMO expired job used only inside this rolled-back authorization test.', 'DEMO Location A', 'temporary', 'published', 'internal', now() - interval '1 day', '00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000055', now()),
  ('64000000-0000-0000-0000-000000000004', '63000000-0000-0000-0000-000000000001', 'MY', 'DEMO Pending Job', 'DEMO pending job used only inside this rolled-back authorization test.', 'DEMO Location A', 'full_time', 'pending', 'internal', now() + interval '10 days', '00000000-0000-0000-0000-000000000051', null, null);

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

do $$
begin
  if not exists (select 1 from public.jobs where id = '64000000-0000-0000-0000-000000000001') then
    raise exception 'FAIL: anonymous user cannot read an active published job';
  end if;
  if exists (select 1 from public.jobs where id = '64000000-0000-0000-0000-000000000003') then
    raise exception 'FAIL: anonymous user can read an expired job';
  end if;
  if exists (select 1 from public.jobs where id = '64000000-0000-0000-0000-000000000004') then
    raise exception 'FAIL: anonymous user can read a pending job';
  end if;
  begin
    perform 1 from public.career_passports limit 1;
    raise exception 'FAIL: anonymous user accessed Career Passports';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.job_applications limit 1;
    raise exception 'FAIL: anonymous user accessed applications';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000053', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.career_passports (user_id, headline, summary, skills)
values ('00000000-0000-0000-0000-000000000053', 'DEMO Applicant A Passport', 'Private test Passport.', array['DEMO skill']);
insert into public.saved_jobs (job_id, user_id)
values ('64000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000053');
insert into public.job_alerts (id, user_id, name, country_code)
values ('67000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000053', 'DEMO Alert A', 'MY');
insert into public.job_applications (id, job_id, applicant_id, cover_note, share_career_passport)
values ('65000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000053', 'DEMO application A.', true);

do $$
begin
  if not exists (select 1 from public.career_passports where user_id = '00000000-0000-0000-0000-000000000053' and is_public = false) then
    raise exception 'FAIL: Applicant A cannot read their private Passport';
  end if;
  if exists (select 1 from public.job_applications where applicant_id = '00000000-0000-0000-0000-000000000054') then
    raise exception 'FAIL: Applicant A read Applicant B applications';
  end if;
  begin
    insert into public.job_applications (job_id, applicant_id)
    values ('64000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000053');
    raise exception 'FAIL: expired job accepted an application';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.job_applications (job_id, applicant_id)
    values ('64000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000053');
    raise exception 'FAIL: pending job accepted an application';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.jobs (employer_id, country_code, title, description, location_text, employment_type, status, source_type, posted_by)
    values ('63000000-0000-0000-0000-000000000001', 'MY', 'DEMO Unauthorized Job', 'This unauthorized job must be rejected by RLS.', 'DEMO Location', 'full_time', 'pending', 'internal', '00000000-0000-0000-0000-000000000053');
    raise exception 'FAIL: unauthorized applicant created an employer job';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.jobs (country_code, title, description, location_text, employment_type, status, source_type, external_source_id, external_id, original_url, last_checked_at)
    values ('MY', 'DEMO Fake External Job', 'This falsified external job must be rejected by RLS.', 'DEMO Location', 'contract', 'pending', 'external', '66000000-0000-0000-0000-000000000001', 'fake-id', 'https://example.invalid/fake-job', now());
    raise exception 'FAIL: ordinary user inserted an external job';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.job_applications set status = 'reviewing' where id = '65000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: applicant performed an employer status action';
  exception when raise_exception then
    if sqlerrm = 'FAIL: applicant performed an employer status action' then raise; end if;
    if sqlerrm <> 'Applicants may only withdraw their applications' then raise exception 'FAIL: unexpected applicant status error: %', sqlerrm; end if;
  end;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000054', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.career_passports (user_id, headline, summary, skills)
values ('00000000-0000-0000-0000-000000000054', 'DEMO Applicant B Passport', 'Private test Passport.', array['DEMO skill']);
insert into public.saved_jobs (job_id, user_id)
values ('64000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000054');
insert into public.job_alerts (id, user_id, name, country_code)
values ('67000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000054', 'DEMO Alert B', 'MY');
insert into public.job_applications (id, job_id, applicant_id, cover_note, share_career_passport)
values ('65000000-0000-0000-0000-000000000002', '64000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000054', 'DEMO application B.', false);
insert into public.job_applications (id, job_id, applicant_id, cover_note, share_career_passport)
values ('65000000-0000-0000-0000-000000000003', '64000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000054', 'DEMO application B to Employer A without Passport sharing.', false);

do $$
begin
  if exists (select 1 from public.career_passports where user_id = '00000000-0000-0000-0000-000000000053') then
    raise exception 'FAIL: Applicant B read Applicant A Passport';
  end if;
  if exists (select 1 from public.saved_jobs where user_id = '00000000-0000-0000-0000-000000000053') then
    raise exception 'FAIL: Applicant B read Applicant A saved jobs';
  end if;
  if exists (select 1 from public.job_alerts where user_id = '00000000-0000-0000-0000-000000000053') then
    raise exception 'FAIL: Applicant B read Applicant A alerts';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000053', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare changed_rows integer;
begin
  if exists (select 1 from public.job_applications where applicant_id = '00000000-0000-0000-0000-000000000054') then
    raise exception 'FAIL: Applicant A read Applicant B applications';
  end if;
  update public.career_passports
  set headline = 'DEMO unauthorized Passport edit'
  where user_id = '00000000-0000-0000-0000-000000000054';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then
    raise exception 'FAIL: Applicant A modified Applicant B Passport';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000051', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare changed_rows integer;
begin
  if not exists (select 1 from public.job_applications where id = '65000000-0000-0000-0000-000000000001') then
    raise exception 'FAIL: Employer A cannot read Job A applicant';
  end if;
  if exists (select 1 from public.job_applications where id = '65000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL: Employer A read Employer B applicant';
  end if;
  if not exists (select 1 from public.job_applications where id = '65000000-0000-0000-0000-000000000003') then
    raise exception 'FAIL: Employer A cannot read an applicant to its own job';
  end if;
  if not exists (select 1 from public.career_passports where user_id = '00000000-0000-0000-0000-000000000053') then
    raise exception 'FAIL: Employer A cannot read explicitly shared Passport';
  end if;
  if exists (select 1 from public.career_passports where user_id = '00000000-0000-0000-0000-000000000054') then
    raise exception 'FAIL: Employer A browsed an unrelated Passport';
  end if;
  update public.job_applications set status = 'reviewing', status_changed_by = '00000000-0000-0000-0000-000000000051', status_changed_at = now() where id = '65000000-0000-0000-0000-000000000001';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then raise exception 'FAIL: Employer A cannot track its applicant'; end if;
  update public.job_applications set status = 'reviewing', status_changed_by = '00000000-0000-0000-0000-000000000051', status_changed_at = now() where id = '65000000-0000-0000-0000-000000000002';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then raise exception 'FAIL: Employer A changed Employer B application'; end if;
  update public.jobs set title = 'DEMO unauthorized cross-employer edit' where id = '64000000-0000-0000-0000-000000000002';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then raise exception 'FAIL: Employer A modified Employer B job'; end if;
  begin
    update public.jobs set status = 'published' where id = '64000000-0000-0000-0000-000000000004';
    if found then raise exception 'FAIL: Employer A bypassed moderation'; end if;
  exception when raise_exception then
    if sqlerrm = 'FAIL: Employer A bypassed moderation' then raise; end if;
    if sqlerrm <> 'Only platform moderators may change job control fields' then raise exception 'FAIL: unexpected moderation error: %', sqlerrm; end if;
  end;
  begin
    perform public.verify_employer('63000000-0000-0000-0000-000000000003', 'https://example.invalid/pending-employer-verification');
    raise exception 'FAIL: Employer A self-verified an employer';
  exception when raise_exception then
    if sqlerrm = 'FAIL: Employer A self-verified an employer' then raise; end if;
    if sqlerrm <> 'Forbidden' then raise exception 'FAIL: unexpected verification error: %', sqlerrm; end if;
  end;
  if exists (select 1 from public.saved_jobs) then raise exception 'FAIL: Employer A browsed applicant saved jobs'; end if;
  if exists (select 1 from public.job_alerts) then raise exception 'FAIL: Employer A browsed applicant alerts'; end if;
end;
$$;

reset role;

do $$
begin
  if not exists (
    select 1
    from public.employers
    where id = '63000000-0000-0000-0000-000000000003'
      and status = 'pending'
      and verification_source_url is null
      and last_verified_at is null
      and reviewed_by is null
      and reviewed_at is null
  ) then
    raise exception 'FAIL: denied employer self-verification changed protected review state';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000055', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.verify_employer(
  '63000000-0000-0000-0000-000000000003',
  'https://example.invalid/pending-employer-verification'
);

reset role;

do $$
begin
  if not exists (
    select 1
    from public.employers
    where id = '63000000-0000-0000-0000-000000000003'
      and status = 'verified'
      and verification_source_url = 'https://example.invalid/pending-employer-verification'
      and last_verified_at is not null
  ) then
    raise exception 'FAIL: authorized moderator could not verify employer';
  end if;
  if not exists (select 1 from public.employer_members where employer_id = '63000000-0000-0000-0000-000000000003' and user_id = '00000000-0000-0000-0000-000000000051' and role = 'admin') then
    raise exception 'FAIL: verification did not create scoped employer administration';
  end if;
  if not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-000000000051' and role = 'member') then
    raise exception 'FAIL: employer verification escalated platform role';
  end if;
end;
$$;

reset role;
rollback;

select 'PASS: Day 5 hosted RLS/authorization transaction test completed successfully' as result;
