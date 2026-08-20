begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into public.accounts_receivable
  (omie_id, due_date, original_value, status, is_settled, is_cancelled)
values
  ('stage6-ar-open', current_date - 1, 1000, 'ABERTO', false, false),
  ('stage6-ar-settled', current_date - 1, 50, 'RECEBIDO', true, false),
  ('stage6-ar-cancelled', current_date - 1, 70, 'CANCELADO', false, true);

insert into public.accounts_payable
  (omie_id, due_date, original_value, status, is_settled, is_cancelled)
values
  ('stage6-ap-open', current_date - 1, 400, 'ABERTO', false, false),
  ('stage6-ap-settled', current_date - 1, 30, 'PAGO', true, false),
  ('stage6-ap-cancelled', current_date - 1, 20, 'CANCELADO', false, true);

select results_eq(
  $$select sum(signed_value) from analytics.financial_movements where omie_id in ('stage6-ar-open', 'stage6-ap-open')$$,
  $$values (600::numeric)$$,
  'receivable 1000 plus payable 400 consolidates to 600'
);

select is_empty(
  $$select 1 from analytics.financial_movements where omie_id in ('stage6-ar-cancelled', 'stage6-ap-cancelled')$$,
  'cancelled titles are excluded from financial movements'
);

select results_eq(
  $$select omie_id from analytics.open_receivables where omie_id = 'stage6-ar-open'$$,
  $$values ('stage6-ar-open'::text)$$,
  'open receivable remains open'
);

select results_eq(
  $$select omie_id from analytics.open_payables where omie_id = 'stage6-ap-open'$$,
  $$values ('stage6-ap-open'::text)$$,
  'open payable remains open'
);

select is_empty(
  $$select 1 from analytics.open_receivables where omie_id in ('stage6-ar-settled', 'stage6-ar-cancelled')$$,
  'settled and cancelled receivables are not open'
);

select is_empty(
  $$select 1 from analytics.open_payables where omie_id in ('stage6-ap-settled', 'stage6-ap-cancelled')$$,
  'settled and cancelled payables are not open'
);

select results_eq(
  $$select omie_id from analytics.overdue_receivables where omie_id = 'stage6-ar-open'$$,
  $$values ('stage6-ar-open'::text)$$,
  'overdue open receivable is overdue'
);

select results_eq(
  $$select omie_id from analytics.overdue_payables where omie_id = 'stage6-ap-open'$$,
  $$values ('stage6-ap-open'::text)$$,
  'overdue open payable is overdue'
);

select * from finish();
rollback;
