create view analytics.financial_movements
with (security_invoker = true)
as
select
  'receivable'::text as movement_type,
  ar.id,
  ar.omie_id,
  ar.customer_id,
  ar.seller_id,
  ar.category_id,
  ar.bank_account_id,
  ar.due_date,
  ar.forecast_date,
  ar.issue_date,
  ar.original_value,
  ar.signed_value,
  ar.status,
  ar.is_settled,
  ar.is_cancelled
from public.accounts_receivable ar
where not ar.is_cancelled
union all
select
  'payable'::text as movement_type,
  ap.id,
  ap.omie_id,
  ap.customer_id,
  ap.seller_id,
  ap.category_id,
  ap.bank_account_id,
  ap.due_date,
  ap.forecast_date,
  ap.issue_date,
  ap.original_value,
  ap.signed_value,
  ap.status,
  ap.is_settled,
  ap.is_cancelled
from public.accounts_payable ap
where not ap.is_cancelled;

create view analytics.open_receivables
with (security_invoker = true)
as
select * from public.accounts_receivable
where not is_settled and not is_cancelled;

create view analytics.open_payables
with (security_invoker = true)
as
select * from public.accounts_payable
where not is_settled and not is_cancelled;

create view analytics.overdue_receivables
with (security_invoker = true)
as
select * from public.accounts_receivable
where not is_settled and not is_cancelled and due_date < current_date;

create view analytics.overdue_payables
with (security_invoker = true)
as
select * from public.accounts_payable
where not is_settled and not is_cancelled and due_date < current_date;

revoke all on all tables in schema analytics from public, anon, authenticated;
