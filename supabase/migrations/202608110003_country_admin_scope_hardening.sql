begin;

create or replace function private.protect_profile_authorization_scope()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) = old.id then
    if new.role is distinct from old.role then
      raise exception 'Users cannot change their own authorization role'
        using errcode = '42501';
    end if;

    if old.role = 'country_admin'
      and new.current_country_code is distinct from old.current_country_code then
      raise exception 'Country administrators cannot change their own administrative country scope'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_profile_authorization_scope() from public;
revoke all on function private.protect_profile_authorization_scope() from anon, authenticated;

create trigger profiles_protect_authorization_scope
before update on public.profiles
for each row execute function private.protect_profile_authorization_scope();

commit;
