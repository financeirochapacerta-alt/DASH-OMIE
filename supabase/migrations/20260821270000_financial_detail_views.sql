-- Drill-down support for the 4 financial stock KPIs (A Receber, A Pagar,
-- Recebíveis Vencidos, Pagáveis Vencidos). Same row set and same WHERE
-- clause as before (nothing added/removed) — only display columns are
-- appended, so sum(drill-down rows) always equals the KPI total by
-- construction, not by a separately-written query that could drift.
--
-- create or replace view only allows appending columns at the end of the
-- select list — the original 18 columns keep their exact names/order.

create or replace view analytics.open_receivables
with (security_invoker = true) as
select
  ar.id, ar.omie_id, ar.customer_id, ar.seller_id, ar.category_id, ar.bank_account_id,
  ar.due_date, ar.forecast_date, ar.issue_date, ar.original_value, ar.signed_value, ar.status,
  ar.document_number, ar.installment_number, ar.is_settled, ar.is_cancelled,
  ar.last_synced_at, ar.created_at, ar.updated_at,
  coalesce(nullif(c.trade_name, ''), c.legal_name) as customer_name,
  cat.name as category_name,
  s.name as seller_name,
  ba.description as bank_account_description,
  (ar.due_date - current_date) as days_to_due
from accounts_receivable ar
left join customers c on c.id = ar.customer_id
left join categories cat on cat.id = ar.category_id
left join sellers s on s.id = ar.seller_id
left join bank_accounts ba on ba.id = ar.bank_account_id
where not ar.is_settled and not ar.is_cancelled;

grant select on analytics.open_receivables to authenticated;

create or replace view analytics.open_payables
with (security_invoker = true) as
select
  ap.id, ap.omie_id, ap.customer_id, ap.seller_id, ap.category_id, ap.bank_account_id,
  ap.due_date, ap.forecast_date, ap.issue_date, ap.original_value, ap.signed_value, ap.status,
  ap.document_number, ap.installment_number, ap.is_settled, ap.is_cancelled,
  ap.last_synced_at, ap.created_at, ap.updated_at,
  coalesce(nullif(c.trade_name, ''), c.legal_name) as customer_name,
  cat.name as category_name,
  s.name as seller_name,
  ba.description as bank_account_description,
  (ap.due_date - current_date) as days_to_due
from accounts_payable ap
left join customers c on c.id = ap.customer_id
left join categories cat on cat.id = ap.category_id
left join sellers s on s.id = ap.seller_id
left join bank_accounts ba on ba.id = ap.bank_account_id
where not ap.is_settled and not ap.is_cancelled;

grant select on analytics.open_payables to authenticated;

create or replace view analytics.overdue_receivables
with (security_invoker = true) as
select
  ar.id, ar.omie_id, ar.customer_id, ar.seller_id, ar.category_id, ar.bank_account_id,
  ar.due_date, ar.forecast_date, ar.issue_date, ar.original_value, ar.signed_value, ar.status,
  ar.document_number, ar.installment_number, ar.is_settled, ar.is_cancelled,
  ar.last_synced_at, ar.created_at, ar.updated_at,
  coalesce(nullif(c.trade_name, ''), c.legal_name) as customer_name,
  cat.name as category_name,
  s.name as seller_name,
  ba.description as bank_account_description,
  (ar.due_date - current_date) as days_to_due
from accounts_receivable ar
left join customers c on c.id = ar.customer_id
left join categories cat on cat.id = ar.category_id
left join sellers s on s.id = ar.seller_id
left join bank_accounts ba on ba.id = ar.bank_account_id
where not ar.is_settled and not ar.is_cancelled and ar.due_date < current_date;

grant select on analytics.overdue_receivables to authenticated;

create or replace view analytics.overdue_payables
with (security_invoker = true) as
select
  ap.id, ap.omie_id, ap.customer_id, ap.seller_id, ap.category_id, ap.bank_account_id,
  ap.due_date, ap.forecast_date, ap.issue_date, ap.original_value, ap.signed_value, ap.status,
  ap.document_number, ap.installment_number, ap.is_settled, ap.is_cancelled,
  ap.last_synced_at, ap.created_at, ap.updated_at,
  coalesce(nullif(c.trade_name, ''), c.legal_name) as customer_name,
  cat.name as category_name,
  s.name as seller_name,
  ba.description as bank_account_description,
  (ap.due_date - current_date) as days_to_due
from accounts_payable ap
left join customers c on c.id = ap.customer_id
left join categories cat on cat.id = ap.category_id
left join sellers s on s.id = ap.seller_id
left join bank_accounts ba on ba.id = ap.bank_account_id
where not ap.is_settled and not ap.is_cancelled and ap.due_date < current_date;

grant select on analytics.overdue_payables to authenticated;

-- Aging buckets over the exact same overdue_* row sets above (abertos, não cancelados,
-- due_date < current_date) — nothing recomputed with different filters.
create or replace function analytics.receivables_aging()
returns table (bucket text, bucket_order int, title_count bigint, total_value numeric)
language sql stable security invoker set search_path = ''
as $$
  select
    case
      when current_date - due_date <= 7 then '1-7 dias'
      when current_date - due_date <= 15 then '8-15 dias'
      when current_date - due_date <= 30 then '16-30 dias'
      when current_date - due_date <= 60 then '31-60 dias'
      when current_date - due_date <= 90 then '61-90 dias'
      else '>90 dias'
    end as bucket,
    case
      when current_date - due_date <= 7 then 1
      when current_date - due_date <= 15 then 2
      when current_date - due_date <= 30 then 3
      when current_date - due_date <= 60 then 4
      when current_date - due_date <= 90 then 5
      else 6
    end as bucket_order,
    count(*) as title_count,
    sum(abs(signed_value)) as total_value
  from analytics.overdue_receivables
  group by 1, 2
  order by 2;
$$;

grant execute on function analytics.receivables_aging() to authenticated;

create or replace function analytics.payables_aging()
returns table (bucket text, bucket_order int, title_count bigint, total_value numeric)
language sql stable security invoker set search_path = ''
as $$
  select
    case
      when current_date - due_date <= 7 then '1-7 dias'
      when current_date - due_date <= 15 then '8-15 dias'
      when current_date - due_date <= 30 then '16-30 dias'
      when current_date - due_date <= 60 then '31-60 dias'
      when current_date - due_date <= 90 then '61-90 dias'
      else '>90 dias'
    end as bucket,
    case
      when current_date - due_date <= 7 then 1
      when current_date - due_date <= 15 then 2
      when current_date - due_date <= 30 then 3
      when current_date - due_date <= 60 then 4
      when current_date - due_date <= 90 then 5
      else 6
    end as bucket_order,
    count(*) as title_count,
    sum(abs(signed_value)) as total_value
  from analytics.overdue_payables
  group by 1, 2
  order by 2;
$$;

grant execute on function analytics.payables_aging() to authenticated;
