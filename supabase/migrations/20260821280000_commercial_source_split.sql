-- Mercadoria vs Serviço split, using the only real distinction that exists in the domain:
-- analytics.sales.source ('sales_order' vs 'service_order'), the same field already used
-- everywhere else in Comercial. Nothing inferred from description/text.

create or replace function analytics.sales_summary_by_source_period(p_from date default null, p_to date default null)
returns table (
  source text,
  sale_count bigint,
  total_value numeric,
  invoiced_value numeric,
  to_invoice_value numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.source,
    count(*) as sale_count,
    coalesce(sum(s.total_value), 0) as total_value,
    coalesce(sum(s.total_value) filter (where s.billing_status = 'invoiced'), 0) as invoiced_value,
    coalesce(sum(s.total_value) filter (where s.billing_status = 'to_invoice'), 0) as to_invoice_value
  from analytics.sales s
  where (p_from is null and p_to is null)
     or (s.forecast_date is not null
         and (p_from is null or s.forecast_date >= p_from)
         and (p_to is null or s.forecast_date <= p_to))
  group by s.source;
$$;

grant execute on function analytics.sales_summary_by_source_period(date, date) to authenticated;

create or replace function analytics.sales_customers_period(p_from date default null, p_to date default null)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select count(distinct s.customer_id)
  from analytics.sales s
  where s.customer_id is not null
    and ((p_from is null and p_to is null)
         or (s.forecast_date is not null
             and (p_from is null or s.forecast_date >= p_from)
             and (p_to is null or s.forecast_date <= p_to)));
$$;

grant execute on function analytics.sales_customers_period(date, date) to authenticated;
