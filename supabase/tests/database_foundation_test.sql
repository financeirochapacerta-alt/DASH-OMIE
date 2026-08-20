begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

select has_schema('raw', 'raw schema exists');
select has_schema('analytics', 'analytics schema exists');
select has_table('raw', 'omie_records', 'raw Omie records table exists');
select has_table('public', 'accounts_receivable', 'receivables table exists');
select has_table('public', 'accounts_payable', 'payables table exists');
select has_view('analytics', 'financial_movements', 'financial movements view exists');

insert into public.accounts_receivable (omie_id, due_date, original_value, status)
values ('test-receivable', current_date, 100, 'open');

insert into public.accounts_payable (omie_id, due_date, original_value, status)
values ('test-payable', current_date, 100, 'open');

select results_eq(
  $$select signed_value from public.accounts_receivable where omie_id = 'test-receivable'$$,
  $$values (100::numeric)$$,
  'receivable signed value is positive'
);

select results_eq(
  $$select signed_value from public.accounts_payable where omie_id = 'test-payable'$$,
  $$values ((-100)::numeric)$$,
  'payable signed value is negative'
);

select throws_like(
  $$insert into public.accounts_receivable (omie_id, due_date, original_value, status) values ('invalid-receivable', current_date, -1, 'open')$$,
  '%violates check constraint%',
  'receivables reject negative original values'
);

select throws_like(
  $$insert into public.accounts_payable (omie_id, due_date, original_value, status) values ('invalid-payable', current_date, -1, 'open')$$,
  '%violates check constraint%',
  'payables reject negative original values'
);

select * from finish();
rollback;
