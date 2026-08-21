-- Period-aware equivalents of the commercial aggregate views. The existing
-- views (sales_summary, sales_by_seller, sales_pipeline, customer_abc) have
-- no date column of their own to filter post-aggregation — they are
-- pre-grouped totals over the whole history. These functions replicate the
-- exact same aggregation logic (nothing recomputed differently) but scope
-- analytics.sales by forecast_date first — the same commercial date field
-- already confirmed and used elsewhere (real_due_date/forecast_date, see
-- 13-OPEN-QUESTIONS.md) — before grouping.
--
-- p_from/p_to are inclusive and both optional; leaving both null reproduces
-- the original unfiltered views exactly (kept as-is, not touched here).
-- When a period is given, rows with forecast_date is null are excluded —
-- there is no evidence-based way to place them inside a specific window.

create or replace function analytics.sales_summary_period(p_from date default null, p_to date default null)
returns table (
  sale_count bigint,
  total_value numeric,
  average_value numeric,
  invoiced_value numeric,
  to_invoice_value numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*) as sale_count,
    coalesce(sum(s.total_value), 0) as total_value,
    coalesce(avg(s.total_value), 0) as average_value,
    coalesce(sum(s.total_value) filter (where s.billing_status = 'invoiced'), 0) as invoiced_value,
    coalesce(sum(s.total_value) filter (where s.billing_status = 'to_invoice'), 0) as to_invoice_value
  from analytics.sales s
  where (p_from is null and p_to is null)
     or (s.forecast_date is not null
         and (p_from is null or s.forecast_date >= p_from)
         and (p_to is null or s.forecast_date <= p_to));
$$;

create or replace function analytics.sales_by_seller_period(p_from date default null, p_to date default null)
returns table (
  seller_id bigint,
  seller_name text,
  sale_count bigint,
  total_value numeric,
  average_value numeric,
  invoiced_value numeric,
  to_invoice_value numeric,
  sales_rank bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.seller_id,
    s.seller_name,
    count(*) as sale_count,
    sum(s.total_value) as total_value,
    avg(s.total_value) as average_value,
    sum(s.total_value) filter (where s.billing_status = 'invoiced') as invoiced_value,
    sum(s.total_value) filter (where s.billing_status = 'to_invoice') as to_invoice_value,
    dense_rank() over (order by sum(s.total_value) desc) as sales_rank
  from analytics.sales s
  where (p_from is null and p_to is null)
     or (s.forecast_date is not null
         and (p_from is null or s.forecast_date >= p_from)
         and (p_to is null or s.forecast_date <= p_to))
  group by s.seller_id, s.seller_name;
$$;

create or replace function analytics.sales_pipeline_period(p_from date default null, p_to date default null)
returns table (
  source text,
  stage_code text,
  stage_classification text,
  billing_status text,
  sale_count bigint,
  total_value numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.source,
    s.stage_code,
    s.stage_classification,
    s.billing_status,
    count(*) as sale_count,
    sum(s.total_value) as total_value
  from analytics.sales s
  where (p_from is null and p_to is null)
     or (s.forecast_date is not null
         and (p_from is null or s.forecast_date >= p_from)
         and (p_to is null or s.forecast_date <= p_to))
  group by s.source, s.stage_code, s.stage_classification, s.billing_status;
$$;

create or replace function analytics.customer_abc_period(p_from date default null, p_to date default null)
returns table (
  customer_id bigint,
  customer_name text,
  total_value numeric,
  share_percent numeric,
  cumulative_percent numeric,
  abc_class text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with totals as (
    select s.customer_id, s.customer_name, sum(s.total_value) as total_value
    from analytics.sales s
    where s.customer_id is not null
      and ((p_from is null and p_to is null)
           or (s.forecast_date is not null
               and (p_from is null or s.forecast_date >= p_from)
               and (p_to is null or s.forecast_date <= p_to)))
    group by s.customer_id, s.customer_name
  ), shares as (
    select
      totals.customer_id,
      totals.customer_name,
      totals.total_value,
      (totals.total_value / nullif(sum(totals.total_value) over (), 0)) * 100 as share_percent,
      (sum(totals.total_value) over (order by totals.total_value desc, totals.customer_id rows unbounded preceding)
        / nullif(sum(totals.total_value) over (), 0)) * 100 as cumulative_percent
    from totals
  )
  select
    customer_id,
    customer_name,
    total_value,
    share_percent,
    cumulative_percent,
    case
      when coalesce(cumulative_percent, 0) <= 80 then 'A'
      when cumulative_percent <= 95 then 'B'
      else 'C'
    end as abc_class
  from shares;
$$;

grant execute on function analytics.sales_summary_period(date, date) to authenticated;
grant execute on function analytics.sales_by_seller_period(date, date) to authenticated;
grant execute on function analytics.sales_pipeline_period(date, date) to authenticated;
grant execute on function analytics.customer_abc_period(date, date) to authenticated;
