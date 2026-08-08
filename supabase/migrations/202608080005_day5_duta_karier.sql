begin;

create type public.employer_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type public.employer_member_role as enum ('admin', 'recruiter');
create type public.job_status as enum ('draft', 'pending', 'published', 'rejected', 'closed');
create type public.job_source_type as enum ('internal', 'external');
create type public.application_status as enum ('submitted', 'reviewing', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn');
create type public.external_source_authorization as enum ('pending', 'authorized', 'disabled');

create table public.employers (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code),
  name text not null check (char_length(trim(name)) between 2 and 180),
  registration_number text,
  description text not null check (char_length(trim(description)) between 20 and 3000),
  website_url text check (website_url is null or website_url ~ '^https://'),
  contact_email text not null check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  status public.employer_status not null default 'pending',
  verification_source_url text check (verification_source_url is null or verification_source_url ~ '^https://'),
  last_verified_at timestamptz,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employers_verification_metadata check (
    status <> 'verified' or (
      verification_source_url is not null and
      last_verified_at is not null and
      reviewed_by is not null and
      reviewed_at is not null
    )
  )
);

create table public.employer_members (
  employer_id uuid not null references public.employers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.employer_member_role not null default 'recruiter',
  created_at timestamptz not null default now(),
  primary key (employer_id, user_id)
);

create table public.external_job_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_]+$'),
  name text not null check (char_length(trim(name)) between 2 and 180),
  official_url text not null check (official_url ~ '^https://'),
  authorization_status public.external_source_authorization not null default 'pending',
  adapter_key text not null unique,
  is_active boolean not null default false,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_source_activation check (
    not is_active or authorization_status = 'authorized'
  )
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid references public.employers(id) on delete cascade,
  country_code text not null references public.countries(code),
  title text not null check (char_length(trim(title)) between 3 and 180),
  description text not null check (char_length(trim(description)) between 30 and 10000),
  location_text text not null check (char_length(trim(location_text)) between 2 and 300),
  employment_type text not null check (employment_type in ('full_time', 'part_time', 'contract', 'temporary', 'internship')),
  salary_text text,
  application_url text check (application_url is null or application_url ~ '^https://'),
  status public.job_status not null default 'pending',
  source_type public.job_source_type not null default 'internal',
  external_source_id uuid references public.external_job_sources(id) on delete restrict,
  external_id text,
  original_url text check (original_url is null or original_url ~ '^https://'),
  last_checked_at timestamptz,
  deadline timestamptz,
  posted_by uuid references auth.users(id) on delete restrict,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_source_integrity check (
    (source_type = 'internal' and employer_id is not null and external_source_id is null and external_id is null and original_url is null)
    or
    (source_type = 'external' and external_source_id is not null and external_id is not null and original_url is not null and last_checked_at is not null)
  ),
  constraint jobs_publisher_integrity check (
    source_type = 'external' or posted_by is not null
  ),
  constraint jobs_moderation_audit check (
    status in ('draft', 'pending') or (moderated_by is not null and moderated_at is not null)
  ),
  unique (external_source_id, external_id)
);

create table public.career_passports (
  user_id uuid primary key references auth.users(id) on delete cascade,
  headline text not null default '' check (char_length(headline) <= 180),
  summary text not null default '' check (char_length(summary) <= 3000),
  skills text[] not null default '{}',
  experience_summary text not null default '' check (char_length(experience_summary) <= 5000),
  education_summary text not null default '' check (char_length(education_summary) <= 3000),
  languages text[] not null default '{}',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_passports_private_only check (is_public = false)
);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  cover_note text not null default '' check (char_length(cover_note) <= 3000),
  share_career_passport boolean not null default false,
  status public.application_status not null default 'submitted',
  status_note text check (status_note is null or char_length(status_note) <= 1000),
  status_changed_by uuid references auth.users(id) on delete set null,
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create table public.saved_jobs (
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (job_id, user_id)
);

create table public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  keywords text,
  country_code text not null references public.countries(code),
  location_text text,
  employment_type text check (employment_type is null or employment_type in ('full_time', 'part_time', 'contract', 'temporary', 'internship')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index employers_status_country_idx on public.employers (country_code, status, name);
create index employer_members_user_idx on public.employer_members (user_id, employer_id);
create index jobs_search_idx on public.jobs (country_code, status, deadline, created_at desc);
create index jobs_employer_idx on public.jobs (employer_id, status, created_at desc);
create index applications_job_idx on public.job_applications (job_id, status, created_at);
create index applications_applicant_idx on public.job_applications (applicant_id, created_at desc);
create index alerts_user_idx on public.job_alerts (user_id, is_active);

create or replace function private.is_employer_member(target_employer_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.employer_members membership
    join public.employers employer on employer.id = membership.employer_id
    where membership.employer_id = target_employer_id
      and membership.user_id = (select auth.uid())
      and employer.status = 'verified'
  );
$$;
revoke all on function private.is_employer_member(uuid) from public;
grant execute on function private.is_employer_member(uuid) to authenticated;

create or replace function private.can_manage_job(target_job_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.jobs job
    where job.id = target_job_id
      and job.employer_id is not null
      and private.is_employer_member(job.employer_id)
  );
$$;
revoke all on function private.can_manage_job(uuid) from public;
grant execute on function private.can_manage_job(uuid) to authenticated;

create or replace function private.protect_employer_review_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not private.can_manage_country(old.country_code) and (
    new.country_code is distinct from old.country_code or
    new.status is distinct from old.status or
    new.verification_source_url is distinct from old.verification_source_url or
    new.last_verified_at is distinct from old.last_verified_at or
    new.submitted_by is distinct from old.submitted_by or
    new.reviewed_by is distinct from old.reviewed_by or
    new.reviewed_at is distinct from old.reviewed_at
  ) then
    raise exception 'Only platform moderators may change employer review fields';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_employer_review_fields() from public;

create or replace function private.protect_job_control_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not private.can_manage_country(old.country_code) and (
    new.employer_id is distinct from old.employer_id or
    new.country_code is distinct from old.country_code or
    new.status is distinct from old.status or
    new.source_type is distinct from old.source_type or
    new.external_source_id is distinct from old.external_source_id or
    new.external_id is distinct from old.external_id or
    new.original_url is distinct from old.original_url or
    new.last_checked_at is distinct from old.last_checked_at or
    new.posted_by is distinct from old.posted_by or
    new.moderated_by is distinct from old.moderated_by or
    new.moderated_at is distinct from old.moderated_at
  ) then
    raise exception 'Only platform moderators may change job control fields';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_job_control_fields() from public;

create or replace function private.protect_application_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.job_id is distinct from old.job_id or new.applicant_id is distinct from old.applicant_id then
    raise exception 'Application identity cannot be changed';
  end if;
  if auth.uid() = old.applicant_id and (
    new.status is distinct from old.status and new.status <> 'withdrawn'
  ) then
    raise exception 'Applicants may only withdraw their applications';
  end if;
  if auth.uid() <> old.applicant_id and private.can_manage_job(old.job_id) and (
    new.cover_note is distinct from old.cover_note or
    new.share_career_passport is distinct from old.share_career_passport
  ) then
    raise exception 'Employers cannot change applicant-provided information';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_application_identity() from public;

create trigger employers_set_updated_at before update on public.employers for each row execute function private.set_updated_at();
create trigger employers_protect_review before update on public.employers for each row execute function private.protect_employer_review_fields();
create trigger external_sources_set_updated_at before update on public.external_job_sources for each row execute function private.set_updated_at();
create trigger jobs_set_updated_at before update on public.jobs for each row execute function private.set_updated_at();
create trigger jobs_protect_control before update on public.jobs for each row execute function private.protect_job_control_fields();
create trigger career_passports_set_updated_at before update on public.career_passports for each row execute function private.set_updated_at();
create trigger applications_set_updated_at before update on public.job_applications for each row execute function private.set_updated_at();
create trigger applications_protect_identity before update on public.job_applications for each row execute function private.protect_application_identity();
create trigger job_alerts_set_updated_at before update on public.job_alerts for each row execute function private.set_updated_at();

alter table public.employers enable row level security;
alter table public.employer_members enable row level security;
alter table public.external_job_sources enable row level security;
alter table public.jobs enable row level security;
alter table public.career_passports enable row level security;
alter table public.job_applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_alerts enable row level security;

create policy "Public reads verified employers" on public.employers for select to anon, authenticated using (status = 'verified');
create policy "Submitters read own employers" on public.employers for select to authenticated using (submitted_by = (select auth.uid()));
create policy "Members register pending employers" on public.employers for insert to authenticated with check (submitted_by = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null and verification_source_url is null and last_verified_at is null);
create policy "Employer members update own employer" on public.employers for update to authenticated using ((select private.is_employer_member(id))) with check ((select private.is_employer_member(id)) and status = 'verified');
create policy "Platform admins manage employers" on public.employers for all to authenticated using ((select private.can_manage_country(country_code))) with check ((select private.can_manage_country(country_code)));

create policy "Members read own employer memberships" on public.employer_members for select to authenticated using (user_id = (select auth.uid()));
create policy "Employer members read own team" on public.employer_members for select to authenticated using ((select private.is_employer_member(employer_id)));
create policy "Platform admins manage employer memberships" on public.employer_members for all to authenticated using (exists (select 1 from public.employers employer where employer.id = employer_id and private.can_manage_country(employer.country_code))) with check (exists (select 1 from public.employers employer where employer.id = employer_id and private.can_manage_country(employer.country_code)));

create policy "Public reads active authorized job sources" on public.external_job_sources for select to anon, authenticated using (is_active and authorization_status = 'authorized');
create policy "Platform admins manage external job sources" on public.external_job_sources for all to authenticated using ((select private.can_manage_country(null))) with check ((select private.can_manage_country(null)));

create policy "Public reads published jobs" on public.jobs for select to anon, authenticated using (
  status = 'published' and (deadline is null or deadline > now()) and (
    (source_type = 'internal' and exists (
      select 1 from public.employers employer
      where employer.id = employer_id and employer.status = 'verified'
    )) or
    (source_type = 'external' and exists (
      select 1 from public.external_job_sources source
      where source.id = external_source_id
        and source.is_active
        and source.authorization_status = 'authorized'
    ))
  )
);
create policy "Employer members read own jobs" on public.jobs for select to authenticated using (employer_id is not null and (select private.is_employer_member(employer_id)));
create policy "Employer members submit pending jobs" on public.jobs for insert to authenticated with check (source_type = 'internal' and employer_id is not null and (select private.is_employer_member(employer_id)) and posted_by = (select auth.uid()) and status = 'pending' and moderated_by is null and moderated_at is null);
create policy "Employer members edit own pending jobs" on public.jobs for update to authenticated using (employer_id is not null and (select private.is_employer_member(employer_id)) and status in ('draft', 'pending', 'rejected')) with check (employer_id is not null and (select private.is_employer_member(employer_id)));
create policy "Platform admins moderate jobs" on public.jobs for all to authenticated using ((select private.can_manage_country(country_code))) with check ((select private.can_manage_country(country_code)));

create policy "Users manage own career passport" on public.career_passports for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and is_public = false);
create policy "Authorized employers read shared applicant passports" on public.career_passports for select to authenticated using (exists (select 1 from public.job_applications application where application.applicant_id = user_id and application.share_career_passport and private.can_manage_job(application.job_id)));

create policy "Applicants read own applications" on public.job_applications for select to authenticated using (applicant_id = (select auth.uid()));
create policy "Applicants apply to published jobs" on public.job_applications for insert to authenticated with check (applicant_id = (select auth.uid()) and status = 'submitted' and status_changed_by is null and exists (select 1 from public.jobs job join public.employers employer on employer.id = job.employer_id where job.id = job_id and job.source_type = 'internal' and job.status = 'published' and employer.status = 'verified' and (job.deadline is null or job.deadline > now())));
create policy "Applicants withdraw own applications" on public.job_applications for update to authenticated using (applicant_id = (select auth.uid())) with check (applicant_id = (select auth.uid()) and status = 'withdrawn');
create policy "Authorized employers read applicants" on public.job_applications for select to authenticated using ((select private.can_manage_job(job_id)));
create policy "Authorized employers track applications" on public.job_applications for update to authenticated using ((select private.can_manage_job(job_id))) with check ((select private.can_manage_job(job_id)) and status <> 'withdrawn');

create policy "Users manage own saved jobs" on public.saved_jobs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and exists (select 1 from public.jobs job where job.id = job_id and job.status = 'published' and (job.deadline is null or job.deadline > now())));
create policy "Users manage own job alerts" on public.job_alerts for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.verify_employer(target_employer_id uuid, source_url text)
returns void language plpgsql security definer set search_path = '' as $$
declare selected_employer public.employers%rowtype;
begin
  select * into selected_employer from public.employers where id = target_employer_id and status = 'pending' for update;
  if selected_employer.id is null then raise exception 'Employer is unavailable'; end if;
  if not private.can_manage_country(selected_employer.country_code) then raise exception 'Forbidden'; end if;
  if source_url is null or source_url !~ '^https://' then raise exception 'A verified HTTPS source is required'; end if;
  update public.employers set status = 'verified', verification_source_url = source_url, last_verified_at = now(), reviewed_by = auth.uid(), reviewed_at = now() where id = target_employer_id;
  insert into public.employer_members (employer_id, user_id, role) values (selected_employer.id, selected_employer.submitted_by, 'admin') on conflict (employer_id, user_id) do update set role = 'admin';
end;
$$;
revoke all on function public.verify_employer(uuid, text) from public;
grant execute on function public.verify_employer(uuid, text) to authenticated;

revoke all on public.employers, public.employer_members, public.external_job_sources, public.jobs, public.career_passports, public.job_applications, public.saved_jobs, public.job_alerts from anon, authenticated;
grant select (id, country_code, name, description, website_url, status, verification_source_url, last_verified_at, created_at, updated_at) on public.employers to anon, authenticated;
grant select (id, code, name, official_url, authorization_status, adapter_key, is_active, last_checked_at) on public.external_job_sources to anon, authenticated;
grant select (id, employer_id, country_code, title, description, location_text, employment_type, salary_text, application_url, status, source_type, external_source_id, external_id, original_url, last_checked_at, deadline, created_at, updated_at) on public.jobs to anon, authenticated;
grant insert, update on public.employers to authenticated;
grant select, insert, update on public.employer_members to authenticated;
grant insert, update on public.external_job_sources to authenticated;
grant insert, update on public.jobs to authenticated;
grant select, insert, update on public.career_passports to authenticated;
grant select, insert, update on public.job_applications to authenticated;
grant select, insert, update, delete on public.saved_jobs to authenticated;
grant select, insert, update, delete on public.job_alerts to authenticated;

commit;
