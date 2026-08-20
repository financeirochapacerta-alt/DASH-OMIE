begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

insert into public.categories (omie_id, name) values ('stage9-revenue', 'Revenue'), ('stage9-cost', 'Cost');
insert into public.dre_category_mappings (category_id, dre_type, dre_group, dre_account, source)
select id, 'Revenue', 'Operating', 'Sales', 'manual' from public.categories where omie_id = 'stage9-revenue';
insert into public.dre_category_mappings (category_id, dre_type, dre_group, dre_account, source)
select id, 'Expense', 'Operating', 'Inputs', 'manual' from public.categories where omie_id = 'stage9-cost';

insert into public.bank_accounts (omie_id, description, initial_balance, balance_date, selected_for_cash)
values ('stage10-selected', 'Selected', 10000, current_date - 10, true),
       ('stage10-unselected', 'Unselected', 99999, current_date - 10, false);

insert into public.accounts_receivable (omie_id, category_id, bank_account_id, due_date, original_value, status, is_settled)
select 'stage9-revenue-title', c.id, b.id, current_date - 2, 1000, 'RECEBIDO', true
from public.categories c cross join public.bank_accounts b where c.omie_id = 'stage9-revenue' and b.omie_id = 'stage10-selected';
insert into public.accounts_payable (omie_id, category_id, bank_account_id, due_date, original_value, status, is_settled)
select 'stage9-cost-title', c.id, b.id, current_date - 1, 400, 'PAGO', true
from public.categories c cross join public.bank_accounts b where c.omie_id = 'stage9-cost' and b.omie_id = 'stage10-selected';
insert into public.accounts_receivable (omie_id, due_date, original_value, status, is_settled, is_cancelled)
values ('stage9-unmapped', current_date, 50, 'ABERTO', false, false),
       ('stage9-cancelled', current_date, 900, 'CANCELADO', false, true),
       ('stage10-overdue', current_date - 5, 2000, 'ABERTO', false, false);
insert into public.accounts_payable (omie_id, due_date, original_value, status, is_settled, is_cancelled)
values ('stage10-overdue-payable', current_date - 4, 1000, 'ABERTO', false, false);

select results_eq(
  $$select sum(signed_value) from analytics.dre_details where omie_id in ('stage9-revenue-title', 'stage9-cost-title')$$,
  $$values (600::numeric)$$, 'DRE preserves signed-value result 1000 - 400 = 600');
select is_empty($$select 1 from analytics.dre_details where omie_id = 'stage9-cancelled'$$, 'cancelled title is excluded from DRE');
select results_eq($$select mapping_status from analytics.dre_details where omie_id = 'stage9-unmapped'$$, $$values ('unmapped'::text)$$, 'unmapped title stays visible');
select results_eq($$select current_balance from analytics.cash_current_balance$$, $$values (10600::numeric)$$, 'selected account balance uses settled signed movements');
select is_empty($$select 1 from analytics.cash_account_balances where omie_id = 'stage10-unselected'$$, 'unselected account is excluded');
select results_eq($$select projection_date from analytics.cash_projection_movements where omie_id = 'stage10-overdue'$$, $$values (current_date)$$, 'overdue receivable moves to today');
select results_eq($$select original_due_date from analytics.cash_projection_movements where omie_id = 'stage10-overdue'$$, $$values (current_date - 5)$$, 'original overdue date is preserved');
select is_empty($$select 1 from analytics.cash_projection_movements where omie_id in ('stage9-revenue-title', 'stage9-cancelled')$$, 'settled and cancelled titles do not enter projection');
select results_eq($$select net_flow from analytics.cash_projection_daily where projection_date = current_date$$, $$values (1050::numeric)$$, 'today includes overdue open movements and the unmapped open title');

select * from finish();
rollback;
