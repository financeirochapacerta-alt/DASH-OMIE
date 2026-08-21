-- Wires manual_opening_balance/manual_balance_date into the balance formula:
-- when manual_balance_enabled and both fields are filled, they replace
-- Omie's initial_balance/balance_date as the anchor; otherwise the existing
-- Omie-derived fallback is unchanged. Same movement-sum logic either way —
-- only the anchor changes. signed_value, DRE and Comercial are untouched:
-- neither reads bank_accounts at all.
--
-- create or replace view only allows appending columns at the end of the
-- select list — existing columns/order are preserved exactly; the new
-- manual/effective columns are appended after the pre-existing ones.

create or replace view analytics.cash_account_balances
with (security_invoker = true) as
with effective as (
  select
    ba.*,
    case
      when ba.manual_balance_enabled and ba.manual_opening_balance is not null and ba.manual_balance_date is not null
        then ba.manual_opening_balance
      else ba.initial_balance
    end as effective_opening_balance,
    case
      when ba.manual_balance_enabled and ba.manual_opening_balance is not null and ba.manual_balance_date is not null
        then ba.manual_balance_date
      else ba.balance_date
    end as effective_balance_date
  from bank_accounts ba
  where ba.selected_for_cash and not ba.blocked and not ba.inactive
)
select
  e.id as bank_account_id,
  e.omie_id,
  e.description,
  e.balance_date,
  e.initial_balance,
  e.effective_opening_balance + coalesce(
    sum(fm.signed_value) filter (
      where fm.is_settled and not fm.is_cancelled
        and (e.effective_balance_date is null or fm.due_date >= e.effective_balance_date)
    ), 0
  ) as current_balance,
  e.manual_balance_enabled,
  e.manual_opening_balance,
  e.manual_balance_date,
  e.effective_opening_balance,
  e.effective_balance_date
from effective e
left join analytics.financial_movements fm on fm.bank_account_id = e.id
group by e.id, e.omie_id, e.description, e.balance_date, e.initial_balance,
  e.manual_balance_enabled, e.manual_opening_balance, e.manual_balance_date,
  e.effective_opening_balance, e.effective_balance_date;

grant select on analytics.cash_account_balances to authenticated;

create or replace view analytics.bank_account_reconciliation
with (security_invoker = true) as
with effective as (
  select
    ba.*,
    case
      when ba.manual_balance_enabled and ba.manual_opening_balance is not null and ba.manual_balance_date is not null
        then ba.manual_opening_balance
      else ba.initial_balance
    end as effective_opening_balance,
    case
      when ba.manual_balance_enabled and ba.manual_opening_balance is not null and ba.manual_balance_date is not null
        then ba.manual_balance_date
      else ba.balance_date
    end as effective_balance_date
  from bank_accounts ba
)
select
  e.id as bank_account_id,
  e.omie_id,
  e.description,
  e.selected_for_cash,
  e.blocked,
  e.inactive,
  e.balance_date,
  e.initial_balance,
  e.effective_opening_balance + coalesce(
    sum(fm.signed_value) filter (
      where fm.is_settled and not fm.is_cancelled
        and (e.effective_balance_date is null or fm.due_date >= e.effective_balance_date)
    ), 0
  ) as computed_balance,
  e.manual_balance_enabled,
  e.manual_opening_balance,
  e.manual_balance_date,
  e.manual_balance_updated_at,
  e.effective_opening_balance,
  e.effective_balance_date
from effective e
left join analytics.financial_movements fm on fm.bank_account_id = e.id
group by e.id, e.omie_id, e.description, e.selected_for_cash, e.blocked, e.inactive,
  e.balance_date, e.initial_balance, e.manual_balance_enabled, e.manual_opening_balance,
  e.manual_balance_date, e.manual_balance_updated_at, e.effective_opening_balance, e.effective_balance_date;

grant select on analytics.bank_account_reconciliation to authenticated;
