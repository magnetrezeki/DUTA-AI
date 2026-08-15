begin;

-- LAYANAN-2H: Supabase default privileges granted client roles write ACLs on
-- the security-invoker public view. Keep the curated reader SELECT-only.
revoke insert, update, delete, truncate, references, trigger
  on public.layanan_public_provenance from anon, authenticated;

grant select on public.layanan_public_provenance to anon, authenticated;

commit;
