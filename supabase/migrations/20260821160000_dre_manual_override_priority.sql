-- Manual DRE mappings must always outrank an auto-derived Omie mapping for the same
-- category, per business decision. The previous tie-break only reached `source` after
-- type_order/group_order/account_order, which is not guaranteed to favor manual rows.
-- Make the priority explicit and independent of ordering columns.
create or replace view analytics.dre_details with (security_invoker = true) as
select fm.movement_type, fm.id, fm.omie_id, fm.due_date,
  date_trunc('month', fm.due_date)::date as month,
  fm.category_id, c.name as category_name, fm.signed_value,
  case when dm.id is null then 'unmapped' else 'mapped' end as mapping_status,
  dm.dre_type, dm.dre_group, dm.dre_account, dm.source as mapping_source,
  coalesce(dm.type_order, 0) type_order, coalesce(dm.group_order, 0) group_order,
  coalesce(dm.account_order, 0) account_order
from analytics.financial_movements fm
left join public.categories c on c.id = fm.category_id
left join lateral (
  select mapping.* from public.dre_category_mappings mapping
  where mapping.category_id = fm.category_id and mapping.active
  order by (mapping.source = 'manual') desc, mapping.type_order, mapping.group_order, mapping.account_order, mapping.id
  limit 1
) dm on true;

-- Required for the automated Omie DRE mapping sync (service-only, never touches manual rows).
grant select, insert, update on public.dre_category_mappings to service_role;
