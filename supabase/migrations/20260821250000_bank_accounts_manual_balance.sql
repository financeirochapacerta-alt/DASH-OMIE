-- Local, ADMIN-only balance anchor override per bank account. Omie's real
-- ListarContasCorrentes payload has saldo_inicial=0 for every real account
-- (confirmed by inspecting raw.omie_records — not assumed), so the movement
-- formula alone can never reflect the true bank balance. These columns let
-- an ADMIN who knows the real opening balance record it locally, without
-- ever touching what Omie sent.
--
-- Column-scoped grant only, mirroring the selected_for_cash migration: the
-- Omie sync always runs as service_role and never includes these columns in
-- its upsert payload (see mappers.ts bankAccountRow), so a resync can never
-- reset or overwrite a manual anchor.

alter table public.bank_accounts
  add column manual_opening_balance numeric null,
  add column manual_balance_date date null,
  add column manual_balance_enabled boolean not null default false,
  add column manual_balance_updated_at timestamptz null;

grant update (manual_opening_balance, manual_balance_date, manual_balance_enabled, manual_balance_updated_at)
  on public.bank_accounts to authenticated;
