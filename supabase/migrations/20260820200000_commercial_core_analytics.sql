alter table public.sales_orders alter column customer_id drop not null;
alter table public.service_orders alter column customer_id drop not null;

create index sales_orders_stage_classification_idx on public.sales_orders (stage_classification) where stage_classification is not null;
create index service_orders_stage_classification_idx on public.service_orders (stage_classification) where stage_classification is not null;
create index service_orders_invoice_idx on public.service_orders (invoice_date) where invoice_date is not null;

create view analytics.sales with (security_invoker = true) as
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
  os.invoice_date, os.stage_code, coalesce(sm.classification, os.stage_classification), os.total_value, null::boolean,
  case when os.invoice_date is not null or lower(coalesce(sm.classification, os.stage_classification, '')) = 'faturado' then 'invoiced'
       when lower(coalesce(sm.classification, os.stage_classification, '')) in ('ordem de serviço','em execução','executado','faturar') then 'to_invoice'
       else 'unknown' end
from public.service_orders os
left join public.customers c on c.id = os.customer_id
left join public.sellers s on s.id = os.seller_id
left join public.stage_mappings sm on sm.entity_type = 'service_order' and sm.stage_code = os.stage_code and sm.active;

create view analytics.sales_by_seller with (security_invoker = true) as
select seller_id, seller_name, count(*) sale_count, sum(total_value) total_value, avg(total_value) average_value,
  sum(total_value) filter (where billing_status = 'invoiced') invoiced_value,
  sum(total_value) filter (where billing_status = 'to_invoice') to_invoice_value,
  dense_rank() over (order by sum(total_value) desc) sales_rank
from analytics.sales group by seller_id, seller_name;

create view analytics.sales_by_customer with (security_invoker = true) as
select customer_id, customer_name, count(*) sale_count, sum(total_value) total_value, avg(total_value) average_value,
  max(invoice_date) last_invoice_date, dense_rank() over (order by sum(total_value) desc) sales_rank
from analytics.sales group by customer_id, customer_name;

create view analytics.sales_pipeline with (security_invoker = true) as
select source, stage_code, stage_classification, billing_status, count(*) sale_count, sum(total_value) total_value
from analytics.sales group by source, stage_code, stage_classification, billing_status;

create view analytics.sales_summary with (security_invoker = true) as
select count(*) sale_count, coalesce(sum(total_value), 0) total_value, coalesce(avg(total_value), 0) average_value,
  coalesce(sum(total_value) filter (where billing_status = 'invoiced'), 0) invoiced_value,
  coalesce(sum(total_value) filter (where billing_status = 'to_invoice'), 0) to_invoice_value
from analytics.sales;

create view analytics.customer_abc with (security_invoker = true) as
with totals as (
  select customer_id, customer_name, sum(total_value) total_value from analytics.sales
  where customer_id is not null group by customer_id, customer_name
), shares as (
  select *, total_value / nullif(sum(total_value) over (), 0) * 100 share_percent,
    sum(total_value) over (order by total_value desc, customer_id rows unbounded preceding)
      / nullif(sum(total_value) over (), 0) * 100 cumulative_percent
  from totals
)
select *, case when coalesce(cumulative_percent, 0) <= 80 then 'A'
               when cumulative_percent <= 95 then 'B' else 'C' end abc_class
from shares;

revoke all on analytics.sales, analytics.sales_by_seller, analytics.sales_by_customer,
  analytics.sales_pipeline, analytics.sales_summary, analytics.customer_abc from public, anon;
grant select on analytics.sales, analytics.sales_by_seller, analytics.sales_by_customer,
  analytics.sales_pipeline, analytics.sales_summary, analytics.customer_abc to authenticated;
