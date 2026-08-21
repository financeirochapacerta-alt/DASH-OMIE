-- Unfiltered counterpart of analytics.cash_account_balances (which only shows
-- accounts where selected_for_cash/not blocked/not inactive), so ADMIN can see
-- every real bank account with its computed balance, status and the exact same
-- formula used in the consolidated saldo — for manual reconciliation against
-- Omie/the bank, and for the account-selection screen. Same math, same
-- source, nothing recomputed differently.

create view analytics.bank_account_reconciliation
with (security_invoker = true) as
select
  ba.id as bank_account_id,
  ba.omie_id,
  ba.description,
  ba.selected_for_cash,
  ba.blocked,
  ba.inactive,
  ba.balance_date,
  ba.initial_balance,
  ba.initial_balance + coalesce(
    sum(fm.signed_value) filter (
      where fm.is_settled and not fm.is_cancelled
        and (ba.balance_date is null or fm.due_date >= ba.balance_date)
    ), 0
  ) as computed_balance
from bank_accounts ba
left join analytics.financial_movements fm on fm.bank_account_id = ba.id
group by ba.id, ba.omie_id, ba.description, ba.selected_for_cash, ba.blocked, ba.inactive, ba.balance_date, ba.initial_balance;

grant select on analytics.bank_account_reconciliation to authenticated;
