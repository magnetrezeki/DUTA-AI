begin;

revoke execute
  on function private.official_source_categories_valid(jsonb)
  from public, anon;

grant execute
  on function private.official_source_categories_valid(jsonb)
  to authenticated;

commit;
