begin;

insert into public.countries (
  code, name, is_active, source_url, verification_status, verified_at
)
values
  ('ID', 'Indonesia', false, 'https://www.iso.org/obp/ui/#iso:code:3166:ID', 'verified', now()),
  ('ZZ', 'DEMO Ingestion Test Country', false, 'https://example.invalid/ingestion-test-country', 'verified', now())
on conflict (code) do nothing;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('96000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ingestion-member@example.invalid','test-only',now(),'{}','{"display_name":"Ingestion Member"}',now(),now()),
  ('96000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ingestion-org-admin@example.invalid','test-only',now(),'{}','{"display_name":"Ingestion Organization Admin"}',now(),now()),
  ('96000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ingestion-country-admin@example.invalid','test-only',now(),'{}','{"display_name":"Ingestion Country Admin"}',now(),now()),
  ('96000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ingestion-moderator@example.invalid','test-only',now(),'{}','{"display_name":"Ingestion Moderator"}',now(),now()),
  ('96000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ingestion-super-admin@example.invalid','test-only',now(),'{}','{"display_name":"Ingestion Super Admin"}',now(),now());

update public.profiles set onboarding_completed = true
where id between '96000000-0000-0000-0000-000000000001'::uuid
  and '96000000-0000-0000-0000-000000000005'::uuid;
update public.profiles set role = 'organization_admin'
where id = '96000000-0000-0000-0000-000000000002';
update public.profiles set role = 'country_admin', current_country_code = 'MY'
where id = '96000000-0000-0000-0000-000000000003';
update public.profiles set role = 'moderator'
where id = '96000000-0000-0000-0000-000000000004';
update public.profiles set role = 'super_admin'
where id = '96000000-0000-0000-0000-000000000005';

insert into public.official_sources (
  id, scope, country_code, name, source_url, verification_status,
  last_verified_at, integration_type, integration_enabled, is_active, is_demo,
  institution_code, platform, official_website, verification_level,
  registry_status, priority, category_scope, enabled, news_enabled,
  news_source_type, news_source_group, news_primary_region,
  news_ingestion_authorized, notes
)
values
  ('96100000-0000-0000-0000-000000000001','news','MY','TEST MY Ingestion Source','https://example.invalid/ingestion-my','verified',now(),'authorized_feed',false,true,false,'TEST-ING-MY','website','https://example.invalid/ingestion-my','A','VERIFIED','P2','[]',true,true,'MALAYSIAN_GOVERNMENT','MALAYSIAN_GOVERNMENT','MALAYSIA',true,'Rollback-only fixture.'),
  ('96100000-0000-0000-0000-000000000002','news','ID','TEST ID Ingestion Source','https://example.invalid/ingestion-id','verified',now(),'authorized_feed',false,true,false,'TEST-ING-ID','website','https://example.invalid/ingestion-id','A','VERIFIED','P2','[]',true,true,'MEDIA','INDONESIAN_MEDIA','NASIONAL',true,'Rollback-only fixture.'),
  ('96100000-0000-0000-0000-000000000003','news','MY','TEST Unauthorized Ingestion Source','https://example.invalid/ingestion-unauthorized','verified',now(),'authorized_feed',false,true,false,'TEST-ING-NOAUTH','website','https://example.invalid/ingestion-unauthorized','A','VERIFIED','P2','[]',true,true,'MALAYSIAN_GOVERNMENT','MALAYSIAN_GOVERNMENT','MALAYSIA',false,'Rollback-only fixture.');

insert into public.news_source_integrations (
  id, source_id, method, endpoint_url, enabled, authorization_verified,
  authorization_notes, created_by, terms_review_status, terms_reviewed_by,
  terms_reviewed_at, terms_reference_url, operational_status
)
values
  ('96200000-0000-0000-0000-000000000001','96100000-0000-0000-0000-000000000001','RSS','https://example.invalid/feed-ready',true,true,'Rollback-only PASS fixture.','96000000-0000-0000-0000-000000000005','PASS','96000000-0000-0000-0000-000000000005',now(),'https://example.invalid/terms-ready','READY'),
  ('96200000-0000-0000-0000-000000000002','96100000-0000-0000-0000-000000000002','RSS','https://example.invalid/feed-id',true,true,'Rollback-only ID fixture.','96000000-0000-0000-0000-000000000005','PASS','96000000-0000-0000-0000-000000000005',now(),'https://example.invalid/terms-id','READY'),
  ('96200000-0000-0000-0000-000000000003','96100000-0000-0000-0000-000000000001','API','https://example.invalid/feed-pending',false,true,'Rollback-only PENDING fixture.','96000000-0000-0000-0000-000000000005','PENDING',null,null,null,'READY'),
  ('96200000-0000-0000-0000-000000000004','96100000-0000-0000-0000-000000000002','API','https://example.invalid/feed-rejected',false,true,'Rollback-only REJECTED fixture.','96000000-0000-0000-0000-000000000005','REJECTED','96000000-0000-0000-0000-000000000005',now(),'https://example.invalid/terms-rejected','READY'),
  ('96200000-0000-0000-0000-000000000005','96100000-0000-0000-0000-000000000003','RSS','https://example.invalid/feed-unauthorized',true,true,'Rollback-only source-authorization fixture.','96000000-0000-0000-0000-000000000005','PASS','96000000-0000-0000-0000-000000000005',now(),'https://example.invalid/terms-unauthorized','READY'),
  ('96200000-0000-0000-0000-000000000006','96100000-0000-0000-0000-000000000003','API','https://example.invalid/feed-disabled-existing',false,false,'Rollback-only existing disabled compatibility fixture.','96000000-0000-0000-0000-000000000005','PENDING',null,null,null,'HOLD');

do $$
begin
  if not exists (
    select 1 from public.news_source_integrations
    where id = '96200000-0000-0000-0000-000000000006'
      and not enabled and not authorization_verified
      and terms_review_status = 'PENDING' and operational_status = 'HOLD'
  ) then
    raise exception 'FAIL: existing disabled integration fail-closed state was rejected';
  end if;
end;
$$;

insert into public.news_ingestion_runs (
  id, integration_id, source_id, status, attempt_number, trigger_type,
  endpoint_snapshot, started_at, finished_at, lease_owner_id, lease_expires_at
)
values
  ('96300000-0000-0000-0000-000000000001','96200000-0000-0000-0000-000000000001','96100000-0000-0000-0000-000000000001','SUCCEEDED',1,'MANUAL','https://example.invalid/feed-ready',now() - interval '2 minutes',now() - interval '1 minute','96400000-0000-0000-0000-000000000001',now() + interval '3 minutes'),
  ('96300000-0000-0000-0000-000000000002','96200000-0000-0000-0000-000000000002','96100000-0000-0000-0000-000000000002','SUCCEEDED',1,'MANUAL','https://example.invalid/feed-id',now() - interval '2 minutes',now() - interval '1 minute','96400000-0000-0000-0000-000000000002',now() + interval '3 minutes');

set local role anon;
do $$
begin
  begin
    perform 1 from public.news_ingestion_runs;
    raise exception 'FAIL: anon unexpectedly read ingestion runs';
  exception
    when insufficient_privilege then
      if position('permission denied for table news_ingestion_runs' in sqlerrm) = 0 then
        raise exception 'FAIL: anon denial used unexpected error: %', sqlerrm;
      end if;
  end;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '96000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
do $$
begin
  if exists (select 1 from public.news_ingestion_runs) then
    raise exception 'FAIL: ordinary member unexpectedly read ingestion runs';
  end if;
  begin
    insert into public.news_ingestion_runs (
      integration_id, source_id, trigger_type, endpoint_snapshot,
      lease_owner_id, lease_expires_at
    ) values (
      '96200000-0000-0000-0000-000000000001','96100000-0000-0000-0000-000000000001',
      'MANUAL','https://example.invalid/member-write','96400000-0000-0000-0000-000000000003',now() + interval '5 minutes'
    );
    raise exception 'FAIL: browser-authenticated member inserted an ingestion run';
  exception
    when insufficient_privilege then
      if position('permission denied for table news_ingestion_runs' in sqlerrm) = 0 then
        raise exception 'FAIL: browser write denial used unexpected error: %', sqlerrm;
      end if;
  end;
  begin
    update public.news_ingestion_runs
    set safe_error_message = 'Browser update must be denied.'
    where id = '96300000-0000-0000-0000-000000000001';
    raise exception 'FAIL: browser-authenticated member updated an ingestion run';
  exception
    when insufficient_privilege then
      if position('permission denied for table news_ingestion_runs' in sqlerrm) = 0 then
        raise exception 'FAIL: browser update denial used unexpected error: %', sqlerrm;
      end if;
  end;
  begin
    delete from public.news_ingestion_runs
    where id = '96300000-0000-0000-0000-000000000001';
    raise exception 'FAIL: browser-authenticated member deleted an ingestion run';
  exception
    when insufficient_privilege then
      if position('permission denied for table news_ingestion_runs' in sqlerrm) = 0 then
        raise exception 'FAIL: browser delete denial used unexpected error: %', sqlerrm;
      end if;
  end;
  begin
    perform private.acquire_news_ingestion_run(
      '96200000-0000-0000-0000-000000000001'::uuid, 1::smallint,
      'MANUAL'::public.news_ingestion_trigger_type,
      '96400000-0000-0000-0000-000000000099'::uuid
    );
    raise exception 'FAIL: browser-authenticated member executed worker acquisition';
  exception
    when insufficient_privilege then
      if position('permission denied for function acquire_news_ingestion_run' in sqlerrm) = 0 then
        raise exception 'FAIL: worker function denial used unexpected error: %', sqlerrm;
      end if;
  end;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '96000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
do $$
begin
  if exists (select 1 from public.news_ingestion_runs) then
    raise exception 'FAIL: organization_admin unexpectedly read ingestion runs';
  end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '96000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
do $$
begin
  if not exists (select 1 from public.news_ingestion_runs where id = '96300000-0000-0000-0000-000000000001') then
    raise exception 'FAIL: country_admin could not read assigned-country ingestion run';
  end if;
  if exists (select 1 from public.news_ingestion_runs where id = '96300000-0000-0000-0000-000000000002') then
    raise exception 'FAIL: country_admin read a cross-country ingestion run';
  end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '96000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
do $$
begin
  if (select count(*) from public.news_ingestion_runs where id in ('96300000-0000-0000-0000-000000000001','96300000-0000-0000-0000-000000000002')) <> 2 then
    raise exception 'FAIL: moderator could not read cross-country ingestion runs';
  end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '96000000-0000-0000-0000-000000000005', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
do $$
begin
  if (select count(*) from public.news_ingestion_runs where id in ('96300000-0000-0000-0000-000000000001','96300000-0000-0000-0000-000000000002')) <> 2 then
    raise exception 'FAIL: super_admin could not read cross-country ingestion runs';
  end if;
end;
$$;
reset role;

do $$
declare
  failed_constraint text;
begin
  begin
    insert into public.news_ingestion_runs (
      integration_id, source_id, attempt_number, trigger_type, endpoint_snapshot,
      lease_owner_id, lease_expires_at
    ) values (
      '96200000-0000-0000-0000-000000000001','96100000-0000-0000-0000-000000000001',5,
      'MANUAL','https://example.invalid/attempt-bound','96400000-0000-0000-0000-000000000004',now() + interval '5 minutes'
    );
    raise exception 'FAIL: attempt number above four was accepted';
  exception
    when check_violation then
      get stacked diagnostics failed_constraint = constraint_name;
      if failed_constraint <> 'news_ingestion_runs_attempt_number' then
        raise exception 'FAIL: attempt bound failed through unexpected constraint: %', failed_constraint;
      end if;
  end;

  begin
    insert into public.news_ingestion_runs (
      integration_id, source_id, trigger_type, endpoint_snapshot,
      lease_owner_id, lease_expires_at
    ) values (
      '96200000-0000-0000-0000-000000000001','96100000-0000-0000-0000-000000000002',
      'MANUAL','https://example.invalid/mismatch','96400000-0000-0000-0000-000000000005',now() + interval '5 minutes'
    );
    raise exception 'FAIL: source/integration mismatch was accepted';
  exception
    when foreign_key_violation then
      get stacked diagnostics failed_constraint = constraint_name;
      if failed_constraint <> 'news_ingestion_runs_integration_source_fk' then
        raise exception 'FAIL: mismatch failed through unexpected constraint: %', failed_constraint;
      end if;
  end;
end;
$$;

do $$
declare
  acquired record;
  failed_constraint text;
  renewed_until timestamptz;
  renewal_previous_expiry timestamptz;
  lease_before_wrong_owner timestamptz;
begin
  select * into acquired from private.acquire_news_ingestion_run(
    '96200000-0000-0000-0000-000000000001'::uuid, 1::smallint,
    'SCHEDULED'::public.news_ingestion_trigger_type,
    '96400000-0000-0000-0000-000000000010'::uuid
  );

  update public.news_ingestion_runs
  set lease_expires_at = lease_expires_at - interval '1 minute'
  where id = acquired.run_id
  returning lease_expires_at into renewal_previous_expiry;

  renewed_until := private.renew_news_ingestion_lease(
    acquired.run_id::uuid, '96400000-0000-0000-0000-000000000010'::uuid
  );
  if renewed_until <= renewal_previous_expiry then
    raise exception 'FAIL: valid lease renewal did not move lease expiry forward';
  end if;
  if not exists (
    select 1 from public.news_ingestion_runs
    where id = acquired.run_id
      and integration_id = acquired.integration_id
      and source_id = acquired.source_id
      and status = 'RUNNING'
      and lease_owner_id = '96400000-0000-0000-0000-000000000010'
      and lease_expires_at = renewed_until
  ) then
    raise exception 'FAIL: valid lease renewal changed run identity, owner, or state';
  end if;
  if (select count(*) from public.news_ingestion_runs where status = 'RUNNING') <> 1 then
    raise exception 'FAIL: valid lease renewal modified or created another RUNNING run';
  end if;

  lease_before_wrong_owner := renewed_until;
  begin
    perform private.renew_news_ingestion_lease(
      acquired.run_id::uuid, '96400000-0000-0000-0000-000000000013'::uuid
    );
    raise exception 'FAIL: wrong lease owner renewed an ingestion run';
  exception
    when insufficient_privilege then
      if sqlerrm <> 'NEWS_INGESTION_LEASE_DENIED' then
        raise exception 'FAIL: wrong-owner renewal denial used unexpected error: %', sqlerrm;
      end if;
  end;
  if not exists (
    select 1 from public.news_ingestion_runs
    where id = acquired.run_id
      and integration_id = acquired.integration_id
      and source_id = acquired.source_id
      and status = 'RUNNING'
      and lease_owner_id = '96400000-0000-0000-0000-000000000010'
      and lease_expires_at = lease_before_wrong_owner
  ) then
    raise exception 'FAIL: wrong-owner renewal changed the protected run';
  end if;

  begin
    insert into public.news_ingestion_runs (
      integration_id, source_id, trigger_type, endpoint_snapshot,
      lease_owner_id, lease_expires_at
    ) values (
      '96200000-0000-0000-0000-000000000001','96100000-0000-0000-0000-000000000001',
      'SCHEDULED','https://example.invalid/direct-collision',
      '96400000-0000-0000-0000-000000000012',now() + interval '5 minutes'
    );
    raise exception 'FAIL: one RUNNING invariant accepted a direct collision';
  exception
    when unique_violation then
      get stacked diagnostics failed_constraint = constraint_name;
      if failed_constraint <> 'news_ingestion_runs_one_running_idx' then
        raise exception 'FAIL: RUNNING collision used unexpected constraint: %', failed_constraint;
      end if;
  end;

  begin
    perform private.acquire_news_ingestion_run(
      '96200000-0000-0000-0000-000000000001'::uuid, 1::smallint,
      'SCHEDULED'::public.news_ingestion_trigger_type,
      '96400000-0000-0000-0000-000000000011'::uuid
    );
    raise exception 'FAIL: active lease collision created a second run';
  exception
    when object_not_in_prerequisite_state then
      if sqlerrm <> 'NEWS_INGESTION_ACTIVE_LEASE' then
        raise exception 'FAIL: active lease denial used unexpected error: %', sqlerrm;
      end if;
  end;

  begin
    perform private.complete_news_ingestion_run(
      acquired.run_id::uuid, '96400000-0000-0000-0000-000000000013'::uuid,
      'SUCCEEDED'::public.news_ingestion_run_status, 200::smallint,
      3::integer, 1::integer, 1::integer, 1::integer
    );
    raise exception 'FAIL: wrong lease owner completed an ingestion run';
  exception
    when insufficient_privilege then
      if sqlerrm <> 'NEWS_INGESTION_LEASE_DENIED' then
        raise exception 'FAIL: wrong-owner completion denial used unexpected error: %', sqlerrm;
      end if;
  end;
  if not exists (
    select 1 from public.news_ingestion_runs
    where id = acquired.run_id
      and integration_id = acquired.integration_id
      and source_id = acquired.source_id
      and status = 'RUNNING'
      and finished_at is null
      and http_status is null
      and items_seen = 0
      and items_accepted = 0
      and items_duplicate = 0
      and items_rejected = 0
      and error_class is null
      and safe_error_message is null
  ) then
    raise exception 'FAIL: wrong-owner completion changed protected run state';
  end if;

  perform private.complete_news_ingestion_run(
    acquired.run_id::uuid, '96400000-0000-0000-0000-000000000010'::uuid,
    'SUCCEEDED'::public.news_ingestion_run_status, 200::smallint,
    3::integer, 1::integer, 1::integer, 1::integer
  );
  if not exists (
    select 1 from public.news_ingestion_runs
    where id = acquired.run_id
      and integration_id = acquired.integration_id
      and source_id = acquired.source_id
      and status = 'SUCCEEDED'
      and finished_at is not null
      and http_status = 200
      and items_seen = 3
      and items_accepted = 1
      and items_duplicate = 1
      and items_rejected = 1
  ) then
    raise exception 'FAIL: valid completion did not persist the expected terminal state';
  end if;

  begin
    perform private.renew_news_ingestion_lease(
      acquired.run_id::uuid, '96400000-0000-0000-0000-000000000010'::uuid
    );
    raise exception 'FAIL: terminal ingestion run accepted lease renewal';
  exception
    when insufficient_privilege then
      if sqlerrm <> 'NEWS_INGESTION_LEASE_DENIED' then
        raise exception 'FAIL: terminal renewal denial used unexpected error: %', sqlerrm;
      end if;
  end;
  if not exists (
    select 1 from public.news_ingestion_runs
    where id = acquired.run_id
      and integration_id = acquired.integration_id
      and source_id = acquired.source_id
      and status = 'SUCCEEDED'
      and lease_owner_id = '96400000-0000-0000-0000-000000000010'
      and lease_expires_at = renewed_until
  ) then
    raise exception 'FAIL: terminal renewal denial changed the completed run';
  end if;
end;
$$;

do $$
begin
  update public.official_sources
  set is_active = false
  where id = '96100000-0000-0000-0000-000000000001';
  begin
    perform private.acquire_news_ingestion_run('96200000-0000-0000-0000-000000000001'::uuid,2::smallint,'RETRY'::public.news_ingestion_trigger_type,'96400000-0000-0000-0000-000000000050'::uuid);
    raise exception 'FAIL: inactive source was acquired';
  exception when insufficient_privilege then
    if sqlerrm <> 'NEWS_INGESTION_SOURCE_GATE_DENIED' then raise exception 'FAIL: inactive denial used unexpected error: %', sqlerrm; end if;
  end;
  update public.official_sources
  set is_active = true
  where id = '96100000-0000-0000-0000-000000000001';

  update public.official_sources
  set news_ingestion_authorized = false
  where id = '96100000-0000-0000-0000-000000000001';
  begin
    perform private.acquire_news_ingestion_run('96200000-0000-0000-0000-000000000001'::uuid,2::smallint,'RETRY'::public.news_ingestion_trigger_type,'96400000-0000-0000-0000-000000000051'::uuid);
    raise exception 'FAIL: source with revoked ingestion authorization was acquired';
  exception when insufficient_privilege then
    if sqlerrm <> 'NEWS_INGESTION_GATE_DENIED' then raise exception 'FAIL: revoked authorization denial used unexpected error: %', sqlerrm; end if;
  end;
  update public.official_sources
  set news_ingestion_authorized = true
  where id = '96100000-0000-0000-0000-000000000001';
end;
$$;

do $$
declare
  failed_constraint text;
begin
  begin
    update public.official_sources set verification_status = 'unverified'
    where id = '96100000-0000-0000-0000-000000000001';
    raise exception 'FAIL: verification_status safety constraint accepted an unverified enabled News source';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint not in ('official_sources_enabled_safety', 'official_sources_news_enable_safety') then raise exception 'FAIL: verification_status failed through unexpected constraint: %', failed_constraint; end if;
  end;
  begin
    update public.official_sources set last_verified_at = null
    where id = '96100000-0000-0000-0000-000000000001';
    raise exception 'FAIL: last_verified_at safety constraint accepted missing verification time';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint not in ('official_sources_enabled_safety', 'official_sources_news_enable_safety', 'official_sources_verification_metadata') then raise exception 'FAIL: last_verified_at failed through unexpected constraint: %', failed_constraint; end if;
  end;
  begin
    update public.official_sources set registry_status = 'HOLD'
    where id = '96100000-0000-0000-0000-000000000001';
    raise exception 'FAIL: Registry safety constraint accepted HOLD for enabled News source';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint not in ('official_sources_enabled_safety', 'official_sources_news_enable_safety') then raise exception 'FAIL: registry status failed through unexpected constraint: %', failed_constraint; end if;
  end;
  begin
    update public.official_sources set verification_level = 'C'
    where id = '96100000-0000-0000-0000-000000000001';
    raise exception 'FAIL: verification-level safety constraint accepted C for enabled News source';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint not in ('official_sources_enabled_safety', 'official_sources_news_enable_safety') then raise exception 'FAIL: verification level failed through unexpected constraint: %', failed_constraint; end if;
  end;
  begin
    update public.official_sources set enabled = false
    where id = '96100000-0000-0000-0000-000000000001';
    raise exception 'FAIL: Registry enabled safety constraint accepted disabled parent for enabled News source';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint <> 'official_sources_news_enable_safety' then raise exception 'FAIL: source enabled state failed through unexpected constraint: %', failed_constraint; end if;
  end;
  begin
    update public.official_sources set news_enabled = false
    where id = '96100000-0000-0000-0000-000000000001';
    raise exception 'FAIL: ingestion authorization safety accepted news_enabled=false';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint <> 'official_sources_news_ingestion_fail_closed' then raise exception 'FAIL: news_enabled failed through unexpected constraint: %', failed_constraint; end if;
  end;
  begin
    update public.official_sources set is_demo = true
    where id = '96100000-0000-0000-0000-000000000001';
    raise exception 'FAIL: demo safety constraint accepted demo for enabled News source';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint not in ('official_sources_enabled_safety', 'official_sources_news_enable_safety') then raise exception 'FAIL: demo state failed through unexpected constraint: %', failed_constraint; end if;
  end;
end;
$$;

insert into public.news_ingestion_runs (
  id, integration_id, source_id, status, attempt_number, trigger_type,
  endpoint_snapshot, started_at, lease_owner_id, lease_expires_at
)
values (
  '96300000-0000-0000-0000-000000000003','96200000-0000-0000-0000-000000000002',
  '96100000-0000-0000-0000-000000000002','RUNNING',1,'SCHEDULED',
  'https://example.invalid/feed-id',now() - interval '10 minutes',
  '96400000-0000-0000-0000-000000000020',now() - interval '5 minutes'
);

do $$
declare
  acquired record;
begin
  select * into acquired from private.acquire_news_ingestion_run(
    '96200000-0000-0000-0000-000000000002'::uuid, 2::smallint,
    'RETRY'::public.news_ingestion_trigger_type,
    '96400000-0000-0000-0000-000000000021'::uuid
  );
  if not exists (
    select 1 from public.news_ingestion_runs
    where id = '96300000-0000-0000-0000-000000000003'
      and status = 'ABANDONED' and error_class = 'INTERNAL'
  ) then
    raise exception 'FAIL: expired run was not marked ABANDONED';
  end if;
  perform private.complete_news_ingestion_run(
    acquired.run_id::uuid, '96400000-0000-0000-0000-000000000021'::uuid,
    'FAILED'::public.news_ingestion_run_status, 503::smallint,
    0::integer, 0::integer, 0::integer, 0::integer,
    'HTTP'::public.news_ingestion_error_class, 'Transient upstream error.'::text,
    (now() + interval '20 minutes')::timestamptz
  );
end;
$$;

do $$
declare
  failed_constraint text;
begin
  begin
    update public.news_source_integrations
    set authorization_verified = false
    where id = '96200000-0000-0000-0000-000000000001';
    raise exception 'FAIL: enabled integration accepted authorization_verified=false';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint not in ('news_source_integrations_control_plane_fail_closed', 'news_source_integrations_fail_closed') then
      raise exception 'FAIL: authorization_verified failed through unexpected constraint: %', failed_constraint;
    end if;
  end;
  begin
    update public.news_source_integrations
    set endpoint_url = null
    where id = '96200000-0000-0000-0000-000000000001';
    raise exception 'FAIL: enabled integration accepted endpoint_url=null';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint not in ('news_source_integrations_control_plane_fail_closed', 'news_source_integrations_fail_closed') then
      raise exception 'FAIL: endpoint_url failed through unexpected constraint: %', failed_constraint;
    end if;
  end;
  begin
    update public.news_source_integrations
    set enabled = true
    where id = '96200000-0000-0000-0000-000000000003';
    raise exception 'FAIL: terms PENDING integration passed the database enablement gate';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint <> 'news_source_integrations_control_plane_fail_closed' then
      raise exception 'FAIL: PENDING enablement failed through unexpected constraint: %', failed_constraint;
    end if;
  end;
  begin
    update public.news_source_integrations
    set enabled = true
    where id = '96200000-0000-0000-0000-000000000004';
    raise exception 'FAIL: terms REJECTED integration passed the database enablement gate';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint <> 'news_source_integrations_control_plane_fail_closed' then
      raise exception 'FAIL: REJECTED enablement failed through unexpected constraint: %', failed_constraint;
    end if;
  end;
  begin
    perform private.acquire_news_ingestion_run('96200000-0000-0000-0000-000000000003'::uuid,1::smallint,'MANUAL'::public.news_ingestion_trigger_type,'96400000-0000-0000-0000-000000000030'::uuid);
    raise exception 'FAIL: terms PENDING integration was acquired';
  exception when insufficient_privilege then
    if sqlerrm <> 'NEWS_INGESTION_GATE_DENIED' then raise exception 'FAIL: PENDING denial used unexpected error: %', sqlerrm; end if;
  end;
  begin
    perform private.acquire_news_ingestion_run('96200000-0000-0000-0000-000000000004'::uuid,1::smallint,'MANUAL'::public.news_ingestion_trigger_type,'96400000-0000-0000-0000-000000000031'::uuid);
    raise exception 'FAIL: terms REJECTED integration was acquired';
  exception when insufficient_privilege then
    if sqlerrm <> 'NEWS_INGESTION_GATE_DENIED' then raise exception 'FAIL: REJECTED denial used unexpected error: %', sqlerrm; end if;
  end;
  begin
    perform private.acquire_news_ingestion_run('96200000-0000-0000-0000-000000000005'::uuid,1::smallint,'MANUAL'::public.news_ingestion_trigger_type,'96400000-0000-0000-0000-000000000032'::uuid);
    raise exception 'FAIL: unauthorized source was acquired';
  exception when insufficient_privilege then
    if sqlerrm <> 'NEWS_INGESTION_GATE_DENIED' then raise exception 'FAIL: source denial used unexpected error: %', sqlerrm; end if;
  end;
end;
$$;

do $$
declare
  acquire_definition text;
  integration_guard text;
  source_guard text;
begin
  select lower(pg_get_functiondef(
    'private.acquire_news_ingestion_run(uuid,smallint,public.news_ingestion_trigger_type,uuid)'::regprocedure
  )) into acquire_definition;

  integration_guard := split_part(
    split_part(acquire_definition, 'if integration_row.method', 2),
    'then', 1
  );
  source_guard := split_part(
    split_part(acquire_definition, 'if not exists', 2),
    'then', 1
  );

  if integration_guard = ''
    or integration_guard !~ 'or[[:space:]]+not[[:space:]]+integration_row[.]enabled([[:space:]]|$)'
    or integration_guard !~ 'or[[:space:]]+not[[:space:]]+integration_row[.]authorization_verified([[:space:]]|$)'
    or integration_guard !~ 'integration_row[.]endpoint_url[[:space:]]+is[[:space:]]+null'
    or integration_guard !~ 'integration_row[.]terms_review_status[[:space:]]*<>[[:space:]]*''pass'''
    or integration_guard !~ 'integration_row[.]operational_status[[:space:]]*=[[:space:]]*''hold'''
  then
    raise exception 'FAIL: installed acquisition function is missing an integration defensive gate';
  end if;

  if source_guard = ''
    or source_guard !~ 'source[.]news_enabled[[:space:]]*(=|is)[[:space:]]*true'
    or source_guard !~ 'source[.]news_ingestion_authorized[[:space:]]*(=|is)[[:space:]]*true'
    or source_guard !~ 'source[.]enabled[[:space:]]*(=|is)[[:space:]]*true'
    or source_guard !~ 'source[.]registry_status[[:space:]]*=[[:space:]]*''verified'''
    or source_guard !~ 'source[.]verification_status[[:space:]]*=[[:space:]]*''verified'''
    or source_guard !~ 'source[.]last_verified_at[[:space:]]+is[[:space:]]+not[[:space:]]+null'
    or source_guard !~ 'source[.]is_active[[:space:]]*(=|is)[[:space:]]*true'
    or source_guard !~ 'source[.]is_demo[[:space:]]*(=|is)[[:space:]]*false'
    or source_guard !~ 'source[.]verification_level[[:space:]]*(=[[:space:]]*any|in)[[:space:]]*[(][^)]*''a''[^)]*''b'''
  then
    raise exception 'FAIL: installed acquisition function is missing a source defensive gate';
  end if;

  if 'source.is_demo = true' ~ 'source[.]is_demo[[:space:]]*(=|is)[[:space:]]*false'
    or 'source.is_active = false' ~ 'source[.]is_active[[:space:]]*(=|is)[[:space:]]*true'
    or 'source.news_enabled = false' ~ 'source[.]news_enabled[[:space:]]*(=|is)[[:space:]]*true'
    or 'not source.news_enabled' ~ 'source[.]news_enabled[[:space:]]*(=|is)[[:space:]]*true'
    or 'source.news_ingestion_authorized = false' ~ 'source[.]news_ingestion_authorized[[:space:]]*(=|is)[[:space:]]*true'
    or 'source.verification_status <> ''verified''' ~ 'source[.]verification_status[[:space:]]*=[[:space:]]*''verified'''
    or 'source.last_verified_at is null' ~ 'source[.]last_verified_at[[:space:]]+is[[:space:]]+not[[:space:]]+null'
    or 'source.registry_status <> ''verified''' ~ 'source[.]registry_status[[:space:]]*=[[:space:]]*''verified'''
    or 'source.verification_level in (''c'')' ~ 'source[.]verification_level[[:space:]]*(=[[:space:]]*any|in)[[:space:]]*[(].*''a''.*''b'''
    or 'integration_row.terms_review_status = ''pass''' ~ 'integration_row[.]terms_review_status[[:space:]]*<>[[:space:]]*''pass'''
    or 'integration_row.operational_status <> ''hold''' ~ 'integration_row[.]operational_status[[:space:]]*=[[:space:]]*''hold'''
    or 'integration_row.authorization_verified = true' ~ 'or[[:space:]]+not[[:space:]]+integration_row[.]authorization_verified([[:space:]]|$)'
  then
    raise exception 'FAIL: installed-function predicate checker accepted an inverted synthetic definition';
  end if;
end;
$$;

update public.news_source_integrations
set enabled = false, operational_status = 'HOLD',
    suspended_at = now(), suspension_reason = 'Rollback-only HOLD test.'
where id = '96200000-0000-0000-0000-000000000001';

do $$
declare
  failed_constraint text;
begin
  begin
    update public.news_source_integrations
    set enabled = true
    where id = '96200000-0000-0000-0000-000000000001';
    raise exception 'FAIL: HOLD integration passed the database enablement gate';
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint <> 'news_source_integrations_control_plane_fail_closed' then
      raise exception 'FAIL: HOLD enablement failed through unexpected constraint: %', failed_constraint;
    end if;
  end;
  begin
    perform private.acquire_news_ingestion_run('96200000-0000-0000-0000-000000000001'::uuid,2::smallint,'RETRY'::public.news_ingestion_trigger_type,'96400000-0000-0000-0000-000000000040'::uuid);
    raise exception 'FAIL: HOLD integration was acquired';
  exception when insufficient_privilege then
    if sqlerrm <> 'NEWS_INGESTION_GATE_DENIED' then raise exception 'FAIL: HOLD denial used unexpected error: %', sqlerrm; end if;
  end;
  if not exists (
    select 1 from public.news_ingestion_runs
    where integration_id = '96200000-0000-0000-0000-000000000001'
  ) then
    raise exception 'FAIL: historical run disappeared after integration disablement';
  end if;
end;
$$;

update public.news_source_integrations
set enabled = false
where id = '96200000-0000-0000-0000-000000000002';

do $$
begin
  begin
    perform private.acquire_news_ingestion_run('96200000-0000-0000-0000-000000000002'::uuid,3::smallint,'RETRY'::public.news_ingestion_trigger_type,'96400000-0000-0000-0000-000000000041'::uuid);
    raise exception 'FAIL: disabled integration was acquired';
  exception when insufficient_privilege then
    if sqlerrm <> 'NEWS_INGESTION_GATE_DENIED' then raise exception 'FAIL: disabled denial used unexpected error: %', sqlerrm; end if;
  end;
end;
$$;

set local role anon;
do $$
begin
  perform count(*) from public.news_public_items;
  if exists (
    select 1 from public.news_public_items
    where source_url in (
      'https://example.invalid/ingestion-my',
      'https://example.invalid/ingestion-id',
      'https://example.invalid/ingestion-unauthorized'
    )
  ) then
    raise exception 'FAIL: public News reader behavior changed by control-plane fixtures';
  end if;
end;
$$;
reset role;

do $$
begin
  raise notice 'PASS: News ingestion control-plane hosted RLS/authorization transaction test completed successfully';
end;
$$;

rollback;
