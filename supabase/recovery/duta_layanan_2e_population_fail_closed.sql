begin;

-- Fail-closed recovery only. Preserve deterministic records, evidence, and
-- verification history for audit; remove them from every curated public path.
do $$
begin
  if exists (
    select 1 from public.representative_offices
    where id::text like '75000000-%' and (country_code <> 'MY' or is_demo)
  ) or exists (
    select 1 from public.office_jurisdictions
    where id::text like '75100000-%' and (country_code <> 'MY' or is_demo)
  ) or exists (
    select 1 from public.mission_services service
    join public.representative_offices office on office.id = service.office_id
    where service.id::text like '75400000-%' and (office.country_code <> 'MY' or office.is_demo)
  ) then
    raise exception 'LAYANAN_2E_RECOVERY_IDENTITY_MISMATCH';
  end if;
end $$;

update public.mission_services
set enabled = false, publishability_status = 'UNVERIFIED', updated_at = now()
where id::text like '75400000-%';

update public.office_jurisdictions
set enabled = false, publishability_status = 'UNVERIFIED', updated_at = now()
where id::text like '75100000-%';

update public.representative_offices
set enabled = false, publishability_status = 'UNVERIFIED', updated_at = now()
where id::text like '75000000-%';

do $$
begin
  if exists (select 1 from public.layanan_public_offices where id::text like '75000000-%')
    or exists (select 1 from public.layanan_public_jurisdictions where id::text like '75100000-%')
    or exists (select 1 from public.layanan_public_mission_services where id::text like '75400000-%')
  then
    raise exception 'LAYANAN_2E_RECOVERY_PUBLIC_ROWS_REMAIN';
  end if;
end $$;

commit;
