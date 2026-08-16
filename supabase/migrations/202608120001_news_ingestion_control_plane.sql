begin;

create type public.news_ingestion_run_status as enum (
  'RUNNING', 'SUCCEEDED', 'FAILED', 'ABANDONED'
);
create type public.news_ingestion_trigger_type as enum (
  'MANUAL', 'SCHEDULED', 'RETRY'
);
create type public.news_ingestion_error_class as enum (
  'NETWORK', 'TIMEOUT', 'HTTP', 'SECURITY', 'MIME', 'PARSER',
  'PAYLOAD_LIMIT', 'INTERNAL'
);
create type public.news_terms_review_status as enum (
  'PENDING', 'PASS', 'REJECTED'
);
create type public.news_integration_operational_status as enum (
  'READY', 'DEGRADED', 'HOLD'
);

alter table public.news_source_integrations
  add column terms_review_status public.news_terms_review_status not null default 'PENDING',
  add column terms_reviewed_by uuid references auth.users(id) on delete restrict,
  add column terms_reviewed_at timestamptz,
  add column terms_reference_url text,
  add column operational_status public.news_integration_operational_status not null default 'HOLD',
  add column consecutive_failures integer not null default 0,
  add column suspended_at timestamptz,
  add column suspension_reason text,
  add constraint news_source_integrations_id_source_unique unique (id, source_id),
  add constraint news_source_integrations_terms_review_consistency check (
    terms_review_status = 'PENDING'
    or (terms_reviewed_by is not null and terms_reviewed_at is not null)
  ),
  add constraint news_source_integrations_terms_reference_url check (
    terms_reference_url is null
    or (char_length(terms_reference_url) between 1 and 2048
      and terms_reference_url ~ '^https://')
  ),
  add constraint news_source_integrations_consecutive_failures check (
    consecutive_failures >= 0
  ),
  add constraint news_source_integrations_suspension_consistency check (
    (suspended_at is null and suspension_reason is null)
    or (suspended_at is not null and suspension_reason is not null
      and char_length(suspension_reason) between 1 and 500)
  ),
  add constraint news_source_integrations_control_plane_fail_closed check (
    method = 'MANUAL_URL'
    or not enabled
    or (
      authorization_verified
      and endpoint_url is not null
      and terms_review_status = 'PASS'
      and operational_status in ('READY', 'DEGRADED')
    )
  );

create table public.news_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null,
  source_id uuid not null references public.official_sources(id)
    on delete restrict on update restrict,
  status public.news_ingestion_run_status not null default 'RUNNING',
  attempt_number smallint not null default 1,
  trigger_type public.news_ingestion_trigger_type not null,
  endpoint_snapshot text not null,
  started_at timestamptz not null default statement_timestamp(),
  finished_at timestamptz,
  http_status smallint,
  items_seen integer not null default 0,
  items_accepted integer not null default 0,
  items_duplicate integer not null default 0,
  items_rejected integer not null default 0,
  error_class public.news_ingestion_error_class,
  safe_error_message text,
  retry_after timestamptz,
  lease_owner_id uuid not null,
  lease_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_ingestion_runs_integration_source_fk
    foreign key (integration_id, source_id)
    references public.news_source_integrations(id, source_id)
    on delete restrict on update restrict,
  constraint news_ingestion_runs_attempt_number check (
    attempt_number between 1 and 4
  ),
  constraint news_ingestion_runs_endpoint_snapshot check (
    char_length(endpoint_snapshot) between 1 and 2048
    and endpoint_snapshot ~ '^https://'
  ),
  constraint news_ingestion_runs_finished_at check (
    finished_at is null or finished_at >= started_at
  ),
  constraint news_ingestion_runs_http_status check (
    http_status is null or http_status between 100 and 599
  ),
  constraint news_ingestion_runs_item_counts check (
    items_seen >= 0
    and items_accepted >= 0
    and items_duplicate >= 0
    and items_rejected >= 0
    and items_accepted + items_duplicate + items_rejected <= items_seen
  ),
  constraint news_ingestion_runs_safe_error_message check (
    safe_error_message is null or char_length(safe_error_message) <= 500
  ),
  constraint news_ingestion_runs_lifecycle check (
    (status = 'RUNNING'
      and finished_at is null
      and error_class is null
      and retry_after is null
      and lease_expires_at > started_at)
    or
    (status = 'SUCCEEDED'
      and finished_at is not null
      and error_class is null
      and retry_after is null)
    or
    (status = 'FAILED'
      and finished_at is not null
      and error_class is not null)
    or
    (status = 'ABANDONED'
      and finished_at is not null
      and error_class is not null
      and retry_after is null)
  ),
  constraint news_ingestion_runs_retry_after check (
    retry_after is null or status = 'FAILED'
  )
);

create unique index news_ingestion_runs_one_running_idx
  on public.news_ingestion_runs (integration_id)
  where status = 'RUNNING';
create index news_ingestion_runs_integration_recent_idx
  on public.news_ingestion_runs (integration_id, started_at desc);
create index news_ingestion_runs_source_recent_idx
  on public.news_ingestion_runs (source_id, started_at desc);
create index news_ingestion_runs_retry_eligible_idx
  on public.news_ingestion_runs (integration_id, retry_after)
  where status = 'FAILED' and retry_after is not null;
create index news_ingestion_runs_failure_history_idx
  on public.news_ingestion_runs (integration_id, started_at desc)
  where status in ('FAILED', 'ABANDONED');

create trigger news_ingestion_runs_set_updated_at
before update on public.news_ingestion_runs
for each row execute function private.set_updated_at();

create or replace function private.acquire_news_ingestion_run(
  target_integration_id uuid,
  requested_attempt_number smallint,
  requested_trigger_type public.news_ingestion_trigger_type,
  requested_lease_owner_id uuid
)
returns table (
  run_id uuid,
  integration_id uuid,
  source_id uuid,
  endpoint_snapshot text,
  lease_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  integration_row public.news_source_integrations%rowtype;
  active_run public.news_ingestion_runs%rowtype;
  acquired_run public.news_ingestion_runs%rowtype;
  acquired_at timestamptz := statement_timestamp();
begin
  if requested_lease_owner_id is null then
    raise exception using errcode = '22023', message = 'NEWS_INGESTION_INVALID_LEASE_OWNER';
  end if;

  select integration.* into integration_row
  from public.news_source_integrations integration
  where integration.id = target_integration_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'NEWS_INGESTION_INTEGRATION_NOT_FOUND';
  end if;

  if integration_row.method not in ('RSS', 'API')
    or not integration_row.enabled
    or not integration_row.authorization_verified
    or integration_row.endpoint_url is null
    or integration_row.terms_review_status <> 'PASS'
    or integration_row.operational_status = 'HOLD'
    or not private.is_news_integration_authorized(integration_row.source_id)
  then
    raise exception using errcode = '42501', message = 'NEWS_INGESTION_GATE_DENIED';
  end if;

  if not exists (
    select 1
    from public.official_sources source
    where source.id = integration_row.source_id
      and source.news_enabled is true
      and source.news_ingestion_authorized is true
      and source.enabled is true
      and source.registry_status = 'VERIFIED'
      and source.verification_level in ('A', 'B')
      and source.verification_status = 'verified'
      and source.last_verified_at is not null
      and source.is_active is true
      and source.is_demo is false
  ) then
    raise exception using errcode = '42501', message = 'NEWS_INGESTION_SOURCE_GATE_DENIED';
  end if;

  select run.* into active_run
  from public.news_ingestion_runs run
  where run.integration_id = integration_row.id
    and run.status = 'RUNNING'
  for update;

  if found and active_run.lease_expires_at > acquired_at then
    raise exception using errcode = '55000', message = 'NEWS_INGESTION_ACTIVE_LEASE';
  end if;

  if found then
    update public.news_ingestion_runs
    set status = 'ABANDONED',
        finished_at = acquired_at,
        error_class = 'INTERNAL',
        safe_error_message = 'Previous worker lease expired before completion.'
    where id = active_run.id;
  end if;

  insert into public.news_ingestion_runs (
    integration_id, source_id, attempt_number, trigger_type,
    endpoint_snapshot, started_at, lease_owner_id, lease_expires_at
  ) values (
    integration_row.id, integration_row.source_id, requested_attempt_number,
    requested_trigger_type, integration_row.endpoint_url, acquired_at,
    requested_lease_owner_id, acquired_at + interval '5 minutes'
  )
  returning * into acquired_run;

  return query select acquired_run.id, acquired_run.integration_id,
    acquired_run.source_id, acquired_run.endpoint_snapshot,
    acquired_run.lease_expires_at;
end;
$$;

create or replace function private.renew_news_ingestion_lease(
  target_run_id uuid,
  requested_lease_owner_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_row public.news_ingestion_runs%rowtype;
  renewed_until timestamptz;
begin
  select run.* into run_row
  from public.news_ingestion_runs run
  where run.id = target_run_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'NEWS_INGESTION_RUN_NOT_FOUND';
  end if;
  if run_row.status <> 'RUNNING'
    or run_row.lease_owner_id <> requested_lease_owner_id
    or run_row.lease_expires_at <= statement_timestamp()
  then
    raise exception using errcode = '42501', message = 'NEWS_INGESTION_LEASE_DENIED';
  end if;

  renewed_until := statement_timestamp() + interval '5 minutes';
  update public.news_ingestion_runs
  set lease_expires_at = renewed_until
  where id = run_row.id;
  return renewed_until;
end;
$$;

create or replace function private.complete_news_ingestion_run(
  target_run_id uuid,
  requested_lease_owner_id uuid,
  completion_status public.news_ingestion_run_status,
  completion_http_status smallint,
  completion_items_seen integer,
  completion_items_accepted integer,
  completion_items_duplicate integer,
  completion_items_rejected integer,
  completion_error_class public.news_ingestion_error_class default null,
  completion_safe_error_message text default null,
  completion_retry_after timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_row public.news_ingestion_runs%rowtype;
begin
  select run.* into run_row
  from public.news_ingestion_runs run
  where run.id = target_run_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'NEWS_INGESTION_RUN_NOT_FOUND';
  end if;
  if run_row.status <> 'RUNNING'
    or run_row.lease_owner_id <> requested_lease_owner_id
    or run_row.lease_expires_at <= statement_timestamp()
  then
    raise exception using errcode = '42501', message = 'NEWS_INGESTION_LEASE_DENIED';
  end if;
  if completion_status not in ('SUCCEEDED', 'FAILED') then
    raise exception using errcode = '22023', message = 'NEWS_INGESTION_INVALID_COMPLETION_STATUS';
  end if;

  update public.news_ingestion_runs
  set status = completion_status,
      finished_at = statement_timestamp(),
      http_status = completion_http_status,
      items_seen = completion_items_seen,
      items_accepted = completion_items_accepted,
      items_duplicate = completion_items_duplicate,
      items_rejected = completion_items_rejected,
      error_class = completion_error_class,
      safe_error_message = completion_safe_error_message,
      retry_after = completion_retry_after
  where id = run_row.id;
end;
$$;

revoke all on function private.acquire_news_ingestion_run(
  uuid, smallint, public.news_ingestion_trigger_type, uuid
) from public, anon, authenticated;
revoke all on function private.renew_news_ingestion_lease(uuid, uuid)
  from public, anon, authenticated;
revoke all on function private.complete_news_ingestion_run(
  uuid, uuid, public.news_ingestion_run_status, smallint,
  integer, integer, integer, integer,
  public.news_ingestion_error_class, text, timestamptz
) from public, anon, authenticated;

alter table public.news_ingestion_runs enable row level security;

create policy "News admins read ingestion runs"
on public.news_ingestion_runs
for select to authenticated
using (private.can_manage_news_source(source_id));

revoke all on public.news_ingestion_runs from public, anon, authenticated;
grant select on public.news_ingestion_runs to authenticated;

commit;
