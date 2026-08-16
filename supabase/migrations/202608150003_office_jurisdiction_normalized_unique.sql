begin;

do $$
begin
  if exists (
    select 1
    from public.office_jurisdictions
    group by office_id, country_code, state_normalized,
      district_normalized, jurisdiction_type
    having count(*) > 1
  ) then
    raise exception using
      errcode = '23505',
      message = 'LAYANAN_2K_NORMALIZED_JURISDICTION_COLLISION';
  end if;
end $$;

alter table public.office_jurisdictions
  drop constraint if exists office_jurisdictions_country_code_state_name_office_id_key;

alter table public.office_jurisdictions
  add constraint office_jurisdictions_normalized_natural_key
  unique nulls not distinct (
    office_id,
    country_code,
    state_normalized,
    district_normalized,
    jurisdiction_type
  );

commit;
