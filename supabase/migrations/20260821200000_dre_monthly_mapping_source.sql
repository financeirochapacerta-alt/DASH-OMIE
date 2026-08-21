-- The homologated DRE screen needs to distinguish Omie classification, manual override and
-- unmapped explicitly (not just "mapped"/"unmapped"). dre_details already carries
-- mapping_source; expose it through dre_monthly too. Appended at the end, so
-- create or replace view keeps every existing column name/position intact.
create or replace view analytics.dre_monthly with (security_invoker = true) as
select month, mapping_status, dre_type, dre_group, dre_account, category_id, category_name,
  type_order, group_order, account_order, count(*) title_count, sum(signed_value) amount,
  mapping_source
from analytics.dre_details
group by month, mapping_status, dre_type, dre_group, dre_account, category_id, category_name,
  type_order, group_order, account_order, mapping_source;
