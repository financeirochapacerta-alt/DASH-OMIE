-- Read-only counterpart to operational_store_raw, following the same service_role-only,
-- SECURITY DEFINER pattern (raw stays outside the exposed Data API schemas per ADR-007).
-- Needed to replay already-fetched RAW payloads through an updated normalizer without a new
-- Omie API call (used by the Onda 3 installments backfill).
create function public.operational_list_raw(entity text)
returns setof raw.omie_records
language sql
security definer
set search_path = ''
as $$
  select * from raw.omie_records where entity_type = entity order by fetched_at desc;
$$;

revoke all on function public.operational_list_raw(text) from public, anon, authenticated;
grant execute on function public.operational_list_raw(text) to service_role;
