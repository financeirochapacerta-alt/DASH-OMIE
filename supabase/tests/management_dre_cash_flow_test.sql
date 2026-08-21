begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

insert into public.categories (omie_id, name) values ('stage9-revenue', 'Revenue'), ('stage9-cost', 'Cost');
insert into public.dre_category_mappings (category_id, dre_type, dre_group, dre_account, source)
select id, 'Revenue', 'Operating', 'Sales', 'manual' from public.categories where omie_id = 'stage9-revenue';
insert into public.dre_category_mappings (category_id, dre_type, dre_group, dre_account, source)
select id, 'Expense', 'Operating', 'Inputs', 'manual' from public.categories where omie_id = 'stage9-cost';

insert into public.bank_accounts (omie_id, description, initial_balance, balance_date, selected_for_cash)
values ('stage10-selected', 'Selected', 10000, current_date - 10, true),
       ('stage10-unselected', 'Unselected', 99999, current_date - 10, false),
       ('stage10-no-balance-date', 'No reference date', 0, null, true);

insert into public.accounts_receivable (omie_id, bank_account_id, due_date, original_value, status, is_settled)
select 'stage10-no-balance-date-title', b.id, current_date - 3, 250, 'RECEBIDO', true
from public.bank_accounts b where b.omie_id = 'stage10-no-balance-date';

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

-- sign_behavior is descriptive-only metadata; it must never alter signed_value.
insert into public.categories (omie_id, name, codigo_dre) values ('stage18-expense', 'Aluguel', '2.11.02');
insert into public.dre_category_mappings (category_id, dre_type, dre_group, dre_account, sign_behavior, source)
select id, '2', '2.11', 'Despesas Administrativas', '-', 'omie' from public.categories where omie_id = 'stage18-expense';
insert into public.accounts_payable (omie_id, category_id, due_date, original_value, status, is_settled)
select 'stage18-expense-title', id, current_date, 500, 'PAGO', true from public.categories where omie_id = 'stage18-expense';

-- manual mapping must win over an omie-derived mapping for the same category.
insert into public.categories (omie_id, name, codigo_dre) values ('stage18-override', 'Marketing', '2.01.01');
insert into public.dre_category_mappings (category_id, dre_type, dre_group, dre_account, source)
select id, '2', '2.01', 'Auto label', 'omie' from public.categories where omie_id = 'stage18-override';
insert into public.dre_category_mappings (category_id, dre_type, dre_group, dre_account, source)
select id, 'custom', 'custom', 'Curated label', 'manual' from public.categories where omie_id = 'stage18-override';
insert into public.accounts_payable (omie_id, category_id, due_date, original_value, status, is_settled)
select 'stage18-override-title', id, current_date, 300, 'PAGO', true from public.categories where omie_id = 'stage18-override';

select results_eq(
  $$select sum(signed_value) from analytics.dre_details where omie_id in ('stage9-revenue-title', 'stage9-cost-title')$$,
  $$values (600::numeric)$$, 'DRE preserves signed-value result 1000 - 400 = 600');
select is_empty($$select 1 from analytics.dre_details where omie_id = 'stage9-cancelled'$$, 'cancelled title is excluded from DRE');
select results_eq($$select mapping_status from analytics.dre_details where omie_id = 'stage9-unmapped'$$, $$values ('unmapped'::text)$$, 'unmapped title stays visible');
select results_eq($$select current_balance from analytics.cash_current_balance$$, $$values (10600::numeric)$$, 'selected account balance uses settled signed movements');
select is_empty($$select 1 from analytics.cash_account_balances where omie_id = 'stage10-unselected'$$, 'unselected account is excluded');
select results_eq($$select current_balance from analytics.cash_account_balances where omie_id = 'stage10-no-balance-date'$$, $$values (250::numeric)$$, 'settled movements count even without a known balance_date');
select results_eq($$select projection_date from analytics.cash_projection_movements where omie_id = 'stage10-overdue'$$, $$values (current_date)$$, 'overdue receivable moves to today');
select results_eq($$select original_due_date from analytics.cash_projection_movements where omie_id = 'stage10-overdue'$$, $$values (current_date - 5)$$, 'original overdue date is preserved');
select is_empty($$select 1 from analytics.cash_projection_movements where omie_id in ('stage9-revenue-title', 'stage9-cancelled')$$, 'settled and cancelled titles do not enter projection');
select results_eq($$select net_flow from analytics.cash_projection_daily where projection_date = current_date$$, $$values (1050::numeric)$$, 'today includes overdue open movements and the unmapped open title');
select results_eq($$select signed_value from analytics.dre_details where omie_id = 'stage18-expense-title'$$, $$values (-500::numeric)$$, 'sign_behavior metadata never doubles or flips signed_value');
select results_eq($$select dre_account from analytics.dre_details where omie_id = 'stage18-override-title'$$, $$values ('Curated label'::text)$$, 'manual mapping outranks an omie mapping for the same category');

select * from finish();
rollback;
