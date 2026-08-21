-- raw.* is intentionally outside the exposed Data API schemas (ADR-007), so the "Sincronização"
-- and "Qualidade dos dados" admin screens need a narrow, read-only, ADMIN-gated window into
-- sync_runs/sync_locks. SECURITY DEFINER + explicit private.has_role check (not service_role)
-- mirrors ADR-010: RLS/role checks stay server-side and in-depth, never trusted from the client.
create function public.admin_sync_status()
returns table (
  entity_type text,
  status text,
  started_at timestamptz,
  finished_at timestamptz,
  duration_seconds numeric,
  records_read bigint,
  records_inserted bigint,
  records_updated bigint,
  records_unchanged bigint,
  records_failed bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role(array['ADMIN', 'DIRETORIA']::public.user_role[]) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  select distinct on (r.entity_type)
    r.entity_type,
    r.status,
    r.started_at,
    r.finished_at,
    extract(epoch from (r.finished_at - r.started_at)),
    r.records_read,
    r.records_inserted,
    r.records_updated,
    r.records_unchanged,
    r.records_failed
  from raw.sync_runs r
  order by r.entity_type, r.started_at desc;
end;
$$;

create function public.admin_active_locks()
returns table (entity_type text, acquired_at timestamptz, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role(array['ADMIN', 'DIRETORIA']::public.user_role[]) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  return query
  select l.entity_type, l.acquired_at, l.expires_at
  from raw.sync_locks l
  where l.expires_at > now();
end;
$$;

revoke all on function public.admin_sync_status() from public, anon;
revoke all on function public.admin_active_locks() from public, anon;
grant execute on function public.admin_sync_status() to authenticated;
grant execute on function public.admin_active_locks() to authenticated;
