-- Confirmed with real ListarOS payloads (Onda 3, 2026-08-21) that InfoCadastro.cCancelada
-- is populated the same way infoCadastro.cancelado is for pedidos, so service_orders.is_cancelled
-- is no longer hardcoded null in normalize.ts. This view previously always showed null and never
-- excluded cancelled service orders from analytics.sales, so cancelled OS would have inflated
-- managerial sales figures once real values started flowing in. Mirror the sales_order branch.
create or replace view analytics.sales with (security_invoker = true) as
select 'sales_order'::text source, so.id, so.omie_id, so.display_number, so.customer_id,
  coalesce(nullif(c.trade_name, ''), c.legal_name) customer_name,
  so.seller_id, s.name seller_name, so.contract_number, so.forecast_date, null::date inclusion_date,
  so.invoice_date, so.stage_code, coalesce(sm.classification, so.stage_classification) stage_classification,
  so.total_value, so.is_cancelled,
  case when so.invoice_date is not null or lower(coalesce(sm.classification, so.stage_classification, '')) = 'faturado' then 'invoiced'
       when lower(coalesce(sm.classification, so.stage_classification, '')) in ('pedido de venda','em produção','faturar') then 'to_invoice'
       else 'unknown' end billing_status
from public.sales_orders so
left join public.customers c on c.id = so.customer_id
left join public.sellers s on s.id = so.seller_id
left join public.stage_mappings sm on sm.entity_type = 'sales_order' and sm.stage_code = so.stage_code and sm.active
where so.is_cancelled is false
union all
select 'service_order', os.id, os.omie_id, os.display_number, os.customer_id,
  coalesce(nullif(c.trade_name, ''), c.legal_name),
  os.seller_id, s.name, os.contract_number, os.forecast_date, os.inclusion_date,
  os.invoice_date, os.stage_code, coalesce(sm.classification, os.stage_classification), os.total_value, os.is_cancelled,
  case when os.invoice_date is not null or lower(coalesce(sm.classification, os.stage_classification, '')) = 'faturado' then 'invoiced'
       when lower(coalesce(sm.classification, os.stage_classification, '')) in ('ordem de serviço','em execução','executado','faturar') then 'to_invoice'
       else 'unknown' end
from public.service_orders os
left join public.customers c on c.id = os.customer_id
left join public.sellers s on s.id = os.seller_id
left join public.stage_mappings sm on sm.entity_type = 'service_order' and sm.stage_code = os.stage_code and sm.active
where os.is_cancelled is false;
