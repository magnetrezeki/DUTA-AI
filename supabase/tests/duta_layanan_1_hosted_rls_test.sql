begin;

do $$
begin
  if (select count(*) from public.representative_offices where id::text like '75000000-0000-0000-0000-00000000000%') <> 6 then
    raise exception 'FAIL: LAYANAN-1 office baseline is incomplete';
  end if;
  if (select count(*) from public.office_jurisdictions where id::text like '75100000-0000-0000-0000-0000000000%') <> 42 then
    raise exception 'FAIL: LAYANAN-1 jurisdiction baseline is incomplete';
  end if;
  if exists (select 1 from public.representative_offices where id::text like '75000000-0000-0000-0000-00000000000%' and (enabled or is_demo)) then
    raise exception 'FAIL: evidence-incomplete office baseline became public/demo';
  end if;
  if exists (select 1 from public.office_jurisdictions where id::text like '75100000-0000-0000-0000-0000000000%' and (enabled or is_demo)) then
    raise exception 'FAIL: evidence-incomplete jurisdiction baseline became public/demo';
  end if;
end $$;

set local role anon;

do $$
begin
  if exists (select 1 from public.layanan_public_offices where id::text like '75000000-0000-0000-0000-00000000000%') then
    raise exception 'FAIL: disabled LAYANAN-1 office leaked through public reader';
  end if;
  if exists (select 1 from public.layanan_public_jurisdictions where id::text like '75100000-0000-0000-0000-0000000000%') then
    raise exception 'FAIL: disabled LAYANAN-1 jurisdiction leaked through public reader';
  end if;
  begin
    perform count(*) from public.office_jurisdictions;
    raise exception 'FAIL: anon direct jurisdiction read unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end $$;

reset role;

do $$
begin
  raise notice 'PASS: LAYANAN-1 hosted RLS transaction test completed successfully';
end $$;

rollback;

