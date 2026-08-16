-- SELECT-only hosted validation for the LAYANAN-2H ACL boundary.
with boundary_roles(role_name, require_select) as (
  values ('public'::text,false),('anon'::text,true),('authenticated'::text,true)
), privilege_matrix as (
  select role_name, require_select,
    has_table_privilege(role_name,'public.layanan_public_provenance','SELECT') can_select,
    has_table_privilege(role_name,'public.layanan_public_provenance','INSERT') can_insert,
    has_table_privilege(role_name,'public.layanan_public_provenance','UPDATE') can_update,
    has_table_privilege(role_name,'public.layanan_public_provenance','DELETE') can_delete,
    has_table_privilege(role_name,'public.layanan_public_provenance','TRUNCATE') can_truncate,
    has_table_privilege(role_name,'public.layanan_public_provenance','REFERENCES') can_reference,
    has_table_privilege(role_name,'public.layanan_public_provenance','TRIGGER') can_trigger
  from boundary_roles
)
select role_name,
  can_select, can_insert, can_update, can_delete, can_truncate, can_reference, can_trigger,
  case when (not require_select or can_select) and not (can_insert or can_update or can_delete or can_truncate or can_reference or can_trigger)
    then 'PASS' else 'FAIL' end result
from privilege_matrix
order by case role_name when 'public' then 1 when 'anon' then 2 else 3 end;
