-- The Financeiro table showed "Contraparte: —" for every row: financial_movements never
-- joined a display name. Add customer_name/category_name/document_number (presentation only,
-- no signed_value change) so the homologated UI can show who each title belongs to.
-- create or replace view only allows appending columns at the end, so the original 15-column
-- order (movement_type..is_cancelled) is preserved exactly; new columns are appended after it.
create or replace view analytics.financial_movements
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
  ar.is_cancelled,
  coalesce(nullif(c.trade_name, ''), c.legal_name) as customer_name,
  cat.name as category_name,
  ar.document_number
from public.accounts_receivable ar
left join public.customers c on c.id = ar.customer_id
left join public.categories cat on cat.id = ar.category_id
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
  ap.is_cancelled,
  coalesce(nullif(c.trade_name, ''), c.legal_name) as customer_name,
  cat.name as category_name,
  ap.document_number
from public.accounts_payable ap
left join public.customers c on c.id = ap.customer_id
left join public.categories cat on cat.id = ap.category_id
where not ap.is_cancelled;
