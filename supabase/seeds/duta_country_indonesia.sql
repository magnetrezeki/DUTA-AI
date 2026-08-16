begin;

do $$
declare
  code_collision text;
  name_collision text;
begin
  select format(
    'code=%s, name=%s, source_url=%s, is_active=%s, verification_status=%s, verified_at=%s',
    code, name, source_url, is_active, verification_status, verified_at
  )
  into code_collision
  from public.countries
  where code = 'ID'
    and (
      name is distinct from 'Indonesia'
      or is_active is distinct from false
      or source_url is distinct from 'https://www.iso.org/obp/ui/#iso:code:3166:ID'
      or verification_status is distinct from 'verified'
      or verified_at is distinct from '2026-08-11 00:00:00+08'::timestamptz
    );

  select string_agg(format('%s (%s)', name, code), ', ' order by code)
  into name_collision
  from public.countries
  where lower(trim(name)) = 'indonesia'
    and code <> 'ID';

  if code_collision is not null then
    raise exception 'Indonesia country seed stopped: ID collision: %', code_collision;
  end if;

  if name_collision is not null then
    raise exception 'Indonesia country seed stopped: normalized name collision: %', name_collision;
  end if;
end;
$$;

insert into public.countries (
  code,
  name,
  is_active,
  source_url,
  verification_status,
  verified_at
)
values (
  'ID',
  'Indonesia',
  false,
  'https://www.iso.org/obp/ui/#iso:code:3166:ID',
  'verified',
  '2026-08-11 00:00:00+08'::timestamptz
)
on conflict (code) do nothing;

do $$
declare
  indonesia_count integer;
  malaysia_count integer;
begin
  select count(*)
  into indonesia_count
  from public.countries
  where code = 'ID'
    and name = 'Indonesia'
    and not is_active
    and source_url = 'https://www.iso.org/obp/ui/#iso:code:3166:ID'
    and verification_status = 'verified'
    and verified_at = '2026-08-11 00:00:00+08'::timestamptz;

  select count(*)
  into malaysia_count
  from public.countries
  where code = 'MY'
    and name = 'Malaysia';

  if indonesia_count <> 1 then
    raise exception 'Indonesia country seed stopped: expected one exact inactive ID row, found %', indonesia_count;
  end if;

  if malaysia_count <> 1 then
    raise exception 'Indonesia country seed stopped: Malaysia master row is missing or changed';
  end if;
end;
$$;

commit;
