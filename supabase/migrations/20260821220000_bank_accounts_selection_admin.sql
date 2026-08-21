-- Lets ADMIN choose which bank accounts feed the consolidated cash reports
-- (public.bank_accounts.selected_for_cash already existed and is already
-- respected by analytics.cash_account_balances — this migration only adds
-- the write path so it can be changed from the app instead of SQL).
--
-- Column-scoped grant: authenticated can only ever update selected_for_cash,
-- never description/initial_balance/balance_date/blocked/inactive/etc. The
-- Omie sync always runs as service_role (bypasses RLS) and never includes
-- selected_for_cash in its upsert payload (see mappers.ts bankAccountRow),
-- so a resync can never reset an ADMIN's selection.

create policy bank_accounts_update_admin on public.bank_accounts
  for update
  using (private.has_role(array['ADMIN'::user_role]))
  with check (private.has_role(array['ADMIN'::user_role]));

grant update (selected_for_cash) on public.bank_accounts to authenticated;
