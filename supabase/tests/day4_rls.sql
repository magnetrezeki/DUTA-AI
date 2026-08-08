begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000000','authenticated','authenticated','day4-admin-a@example.invalid','test-only',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"display_name":"Day 4 Admin A"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000000','authenticated','authenticated','day4-member@example.invalid','test-only',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"display_name":"Day 4 Member"}'::jsonb,now(),now()),
('00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000000','authenticated','authenticated','day4-platform@example.invalid','test-only',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"display_name":"Day 4 Platform Admin"}'::jsonb,now(),now());
update public.profiles set onboarding_completed = true where id in ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000033');
update public.profiles set role = 'moderator' where id = '00000000-0000-0000-0000-000000000033';

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000033',true);
select set_config('request.jwt.claim.role','authenticated',true);
insert into public.organizations (id,country_code,slug,name,description,city,state_region,status,submitted_by,reviewed_by,reviewed_at) values
('53000000-0000-0000-0000-000000000001','MY','demo-org-a','DEMO Organization A','DEMO only organization for rolled-back RLS testing.','DEMO City','DEMO State','approved','00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000033',now()),
('53000000-0000-0000-0000-000000000002','MY','demo-org-b','DEMO Organization B','DEMO only organization for rolled-back RLS testing.','DEMO City','DEMO State','approved','00000000-0000-0000-0000-000000000033','00000000-0000-0000-0000-000000000033',now());
insert into public.organization_memberships (organization_id,user_id,role,status,approved_by,approved_at) values ('53000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000031','admin','approved','00000000-0000-0000-0000-000000000033',now());

reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000031',true);
select set_config('request.jwt.claim.role','authenticated',true);
insert into public.organization_announcements (organization_id,title,body,status,published_at,created_by) values ('53000000-0000-0000-0000-000000000001','DEMO allowed','DEMO announcement created inside a rolled-back test.','published',now(),'00000000-0000-0000-0000-000000000031');
do $$ declare changed integer; begin
  insert into public.organization_announcements (organization_id,title,body,created_by) values ('53000000-0000-0000-0000-000000000002','DEMO forbidden','This must never be retained or authorized.','00000000-0000-0000-0000-000000000031');
  raise exception 'FAIL: Organization Admin A managed Organization B';
exception when insufficient_privilege then null; end $$;

reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000032',true);
select set_config('request.jwt.claim.role','authenticated',true);
insert into public.organization_memberships (organization_id,user_id) values ('53000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000032');
do $$ begin
  if exists (select 1 from public.organization_memberships where organization_id = '53000000-0000-0000-0000-000000000001' and user_id = '00000000-0000-0000-0000-000000000031') then raise exception 'FAIL: member read private admin membership'; end if;
end $$;

reset role;
rollback;
