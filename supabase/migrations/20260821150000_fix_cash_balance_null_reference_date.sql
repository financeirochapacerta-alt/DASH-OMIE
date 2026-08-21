-- With real synced data, several bank accounts have no known balance_date (Omie never
-- reported a saldo_data for them). The due_date >= balance_date filter evaluated to NULL
-- for every row in that case, silently discarding all settled movements and showing a
-- balance of 0 even for accounts with real activity. When balance_date is unknown, fall
-- back to counting every known settled movement instead of guessing a reference date.
create or replace view analytics.cash_account_balances with (security_invoker = true) as
select ba.id bank_account_id, ba.omie_id, ba.description, ba.balance_date, ba.initial_balance,
  ba.initial_balance + coalesce(sum(fm.signed_value) filter (
    where fm.is_settled and not fm.is_cancelled
      and (ba.balance_date is null or fm.due_date >= ba.balance_date)
  ), 0) current_balance
from public.bank_accounts ba
left join analytics.financial_movements fm on fm.bank_account_id = ba.id
where ba.selected_for_cash and not ba.blocked and not ba.inactive
group by ba.id, ba.omie_id, ba.description, ba.balance_date, ba.initial_balance;
