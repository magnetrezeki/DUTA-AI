-- LAYANAN-2G assertive, read-only post-population validation.
do $$
declare
  public_offices integer;
  public_jurisdictions integer;
  public_services integer;
  official_services integer;
  duta_services integer;
begin
  select count(*) into public_offices from public.layanan_public_offices where country_code='MY' and id::text like '75000000-%';
  select count(*) into public_jurisdictions from public.layanan_public_jurisdictions where country_code='MY' and id::text like '75100000-%';
  select count(*) into public_services from public.layanan_public_mission_services where id::text like '75400000-%';
  select count(*) into official_services from public.layanan_public_provenance where target_type='mission_service' and target_id::text like '75400000-%' and provenance_class='OFFICIAL_SOURCE_VERIFIED';
  select count(*) into duta_services from public.layanan_public_provenance where target_type='mission_service' and target_id::text like '75400000-%' and provenance_class='DUTA_REVIEWED_VERIFIED';

  if public_offices<>6 then raise exception 'LAYANAN_2G_PUBLIC_OFFICE_COUNT:%',public_offices; end if;
  if public_jurisdictions<>42 then raise exception 'LAYANAN_2G_PUBLIC_JURISDICTION_COUNT:%',public_jurisdictions; end if;
  if public_services<>28 then raise exception 'LAYANAN_2G_PUBLIC_SERVICE_COUNT:%',public_services; end if;
  if official_services<>17 then raise exception 'LAYANAN_2G_OFFICIAL_PROVENANCE_COUNT:%',official_services; end if;
  if duta_services<>11 then raise exception 'LAYANAN_2G_DUTA_PROVENANCE_COUNT:%',duta_services; end if;

  if exists (
    select 1 from public.layanan_public_provenance p
    where p.target_type='mission_service' and p.target_id::text like '75400000-%'
      and p.provenance_class not in ('OFFICIAL_SOURCE_VERIFIED','DUTA_REVIEWED_VERIFIED')
  ) then raise exception 'LAYANAN_2G_UNKNOWN_PROVENANCE'; end if;

  if exists (
    select 1 from public.layanan_public_provenance p
    where p.target_type='mission_service' and p.target_id::text like '75400000-%'
      and p.provenance_class='OFFICIAL_SOURCE_VERIFIED'
      and not private.has_approved_service_evidence('mission_service',p.target_id)
  ) then raise exception 'LAYANAN_2G_OFFICIAL_EVIDENCE_MISSING'; end if;

  if exists (
    select 1 from public.layanan_public_provenance p
    where p.target_type='mission_service' and p.target_id::text like '75400000-%'
      and p.provenance_class='DUTA_REVIEWED_VERIFIED'
      and not private.has_approved_duta_review('mission_service',p.target_id)
  ) then raise exception 'LAYANAN_2G_DUTA_REVIEW_MISSING'; end if;

  if exists (
    select 1 from public.layanan_public_mission_services visible
    join public.mission_services service on service.id=visible.id
    join public.representative_offices office on office.id=service.office_id
    join public.service_categories category on category.id=service.service_category_id
    where visible.id::text like '75400000-%' and (
      office.is_demo or category.is_demo or not office.enabled or not service.enabled
      or service.verification_status<>'verified'
      or service.publishability_status not in ('VERIFIED_CURRENT','VERIFIED_OFFICIAL')
      or (service.effective_from is not null and service.effective_from>now())
      or (service.effective_until is not null and service.effective_until<=now())
      or private.has_open_service_conflict('mission_service',service.id)
    )
  ) then raise exception 'LAYANAN_2G_NONPUBLISHABLE_SERVICE_LEAKAGE'; end if;

  if exists (
    select 1 from public.layanan_public_jurisdictions visible
    join public.office_jurisdictions j on j.id=visible.id
    join public.representative_offices o on o.id=j.office_id
    where visible.id::text like '75100000-%' and (j.is_demo or o.is_demo or not j.enabled or not o.enabled
      or j.verification_status<>'verified' or j.publishability_status not in ('VERIFIED_CURRENT','VERIFIED_OFFICIAL')
      or private.has_open_service_conflict('office_jurisdiction',j.id))
  ) then raise exception 'LAYANAN_2G_NONPUBLISHABLE_JURISDICTION_LEAKAGE'; end if;

  -- DUTA review is intentionally unavailable to fees and contacts. Every public
  -- row in these stricter readers must still satisfy target-specific evidence.
  if exists (select 1 from public.layanan_public_fees f where not private.has_approved_service_evidence('fee',f.id))
    or exists (select 1 from public.layanan_public_contact_channels c where not private.has_approved_service_evidence('contact_channel',c.id))
    or exists (select 1 from public.service_verification_events e where e.provenance_class='DUTA_REVIEWED_VERIFIED' and (e.fee_id is not null or e.contact_channel_id is not null))
  then raise exception 'LAYANAN_2G_FEE_CONTACT_PROVENANCE_BYPASS'; end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name in (
      'layanan_public_offices','layanan_public_jurisdictions','layanan_public_mission_services',
      'layanan_public_contact_channels','layanan_public_fees','layanan_public_provenance'
    ) and column_name in ('actor_id','reviewer_id','reviewer_role','reason','private_reason','manifest_reference','authorization_metadata','evidence_note')
  ) then raise exception 'LAYANAN_2G_PRIVATE_PUBLIC_COLUMN_EXPOSURE'; end if;
end $$;

select
 (select count(*) from public.layanan_public_offices where country_code='MY' and id::text like '75000000-%') public_offices_my,
 (select count(*) from public.layanan_public_jurisdictions where country_code='MY' and id::text like '75100000-%') public_jurisdictions_my,
 (select count(*) from public.layanan_public_mission_services where id::text like '75400000-%') public_mission_services_my,
 (select count(*) from public.layanan_public_provenance where target_type='mission_service' and target_id::text like '75400000-%' and provenance_class='OFFICIAL_SOURCE_VERIFIED') official_source_verified_services,
 (select count(*) from public.layanan_public_provenance where target_type='mission_service' and target_id::text like '75400000-%' and provenance_class='DUTA_REVIEWED_VERIFIED') duta_reviewed_verified_services,
 (select count(*) from public.layanan_public_contact_channels where country_code='MY') public_contacts_my,
 (select count(*) from public.layanan_public_fees) public_fees;
