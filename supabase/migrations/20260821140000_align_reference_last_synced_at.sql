-- customers/sellers were created with raw_last_synced_at while every other normalized
-- table (categories, bank_accounts, sales_orders, service_orders, accounts_receivable,
-- accounts_payable) uses last_synced_at. The sync repository writes last_synced_at
-- uniformly, so this isolated naming inconsistency broke every customers/sellers upsert.
alter table public.customers rename column raw_last_synced_at to last_synced_at;
alter table public.sellers rename column raw_last_synced_at to last_synced_at;
