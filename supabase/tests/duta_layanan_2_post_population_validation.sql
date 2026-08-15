-- DUTA Layanan WNI LAYANAN-2 post-population validation.
-- Read-only: expected only after a separately reviewed population package is approved and run.

with mission_codes(mission_code) as (
  values ('KBRI-KUL'), ('KJRI-JHB'), ('KJRI-PEN'),
    ('KJRI-KCH'), ('KJRI-BKI'), ('KRI-TWU')
),
public_offices as (
  select office.*
  from public.layanan_public_offices office
  join mission_codes expected using (mission_code)
  where office.country_code = 'MY'
),
mission_readiness as (
  select office.mission_code,
    count(distinct jurisdiction.id) as public_jurisdictions,
    count(distinct service.id) as public_services,
    count(distinct contact.id) as public_contacts
  from public_offices office
  left join public.layanan_public_jurisdictions jurisdiction on jurisdiction.office_id = office.id
  left join public.layanan_public_mission_services service on service.office_id = office.id
  left join public.layanan_public_contact_channels contact on contact.office_id = office.id
  group by office.mission_code
)
select expected.mission_code,
  (office.id is not null) as public_office_present,
  coalesce(readiness.public_jurisdictions, 0) as public_jurisdictions,
  coalesce(readiness.public_services, 0) as public_services,
  coalesce(readiness.public_contacts, 0) as public_contacts,
  (
    office.id is not null
    and coalesce(readiness.public_jurisdictions, 0) > 0
    and coalesce(readiness.public_services, 0) > 0
    and coalesce(readiness.public_contacts, 0) > 0
  ) as complete_minimum_public_chain
from mission_codes expected
left join public_offices office using (mission_code)
left join mission_readiness readiness using (mission_code)
order by expected.mission_code;

select 'public_offices_my' as stage, count(*)::bigint as row_count
from public.layanan_public_offices where country_code = 'MY'
union all
select 'public_jurisdictions_my', count(*)::bigint
from public.layanan_public_jurisdictions where country_code = 'MY'
union all
select 'public_mission_services_my', count(*)::bigint
from public.layanan_public_mission_services service
join public.layanan_public_offices office on office.id = service.office_id
where office.country_code = 'MY'
union all
select 'public_contact_channels_my', count(*)::bigint
from public.layanan_public_contact_channels contact
join public.layanan_public_offices office on office.id = contact.office_id
where office.country_code = 'MY'
union all
select 'public_fees_my', count(*)::bigint
from public.layanan_public_fees fee
join public.layanan_public_mission_services service on service.id = fee.mission_service_id
join public.layanan_public_offices office on office.id = service.office_id
where office.country_code = 'MY'
union all
select 'public_requirements_my', count(*)::bigint
from public.layanan_public_requirements requirement
join public.layanan_public_mission_services service on service.id = requirement.mission_service_id
join public.layanan_public_offices office on office.id = service.office_id
where office.country_code = 'MY'
union all
select 'public_appointments_my', count(*)::bigint
from public.layanan_public_appointments appointment
join public.layanan_public_offices office on office.id = appointment.office_id
where office.country_code = 'MY'
union all
select 'public_hours_my', count(*)::bigint
from public.layanan_public_hours hours
join public.layanan_public_offices office on office.id = hours.office_id
where office.country_code = 'MY'
order by stage;
