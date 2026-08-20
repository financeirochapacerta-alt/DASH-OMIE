alter table public.customers add column source_payload_hash text;
alter table public.sellers add column source_payload_hash text;
alter table public.categories add column source_payload_hash text;
alter table public.bank_accounts add column source_payload_hash text;
alter table public.accounts_receivable add column source_payload_hash text;
alter table public.accounts_payable add column source_payload_hash text;
alter table public.sales_orders add column source_payload_hash text;
alter table public.service_orders add column source_payload_hash text;

alter table raw.sync_runs
  add column records_unchanged bigint not null default 0 check (records_unchanged >= 0),
  add column records_failed bigint not null default 0 check (records_failed >= 0);

create table raw.sync_locks (
  entity_type text primary key check (btrim(entity_type) <> ''),
  sync_run_id uuid not null references raw.sync_runs (id) on delete restrict,
  acquired_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint sync_locks_expiry check (expires_at > acquired_at)
);

create index sync_locks_expiry_idx on raw.sync_locks (expires_at);
alter table raw.sync_locks enable row level security;
revoke all on table raw.sync_locks from public, anon, authenticated;

insert into public.management_settings (setting_key, value, value_type, description)
values
  ('monthly_revenue_goal', '0'::jsonb, 'number', 'Monthly managerial revenue target'),
  ('customer_concentration_threshold', '30'::jsonb, 'number', 'Customer concentration alert percentage'),
  ('high_overdue_amount_threshold', '0'::jsonb, 'number', 'High overdue receivables alert threshold'),
  ('payment_concentration_threshold', '0'::jsonb, 'number', 'Daily payment concentration alert threshold')
on conflict (setting_key) do nothing;

create function public.operational_store_raw(payload jsonb) returns void language sql security definer set search_path = '' as $$
  insert into raw.omie_records(entity_type,omie_id,raw_json,payload_hash,source,fetched_at,sync_run_id)
  values(payload->>'entity_type',payload->>'omie_id',payload->'raw_json',payload->>'payload_hash',payload->>'source',(payload->>'fetched_at')::timestamptz,(payload->>'sync_run_id')::uuid);
$$;
create function public.operational_start_sync(entity text,sync_kind text) returns uuid language plpgsql security definer set search_path = '' as $$ declare run_id uuid; begin
  insert into raw.sync_runs(entity_type,sync_type,status) values(entity,sync_kind,'running') returning id into run_id; return run_id; end $$;
create function public.operational_finish_sync(run_id uuid,summary jsonb) returns void language sql security definer set search_path = '' as $$
  update raw.sync_runs set status=case when (summary->>'failed')::bigint>0 then 'partial' else 'succeeded' end,finished_at=now(),records_read=(summary->>'fetched')::bigint,records_inserted=(summary->>'inserted')::bigint,records_updated=(summary->>'updated')::bigint,records_unchanged=(summary->>'unchanged')::bigint,records_failed=(summary->>'failed')::bigint,error_count=(summary->>'failed')::bigint,summary_message=summary::text where id=run_id;
$$;
create function public.operational_complete_sync_state(entity text,run_id uuid,summary jsonb) returns void language sql security definer set search_path = '' as $$
  insert into raw.sync_entity_state(entity_type,last_attempt_at,last_success_at,last_run_id,summary_message,updated_at) values(entity,now(),case when (summary->>'failed')::integer=0 then now() else null end,run_id,summary::text,now()) on conflict(entity_type) do update set last_attempt_at=excluded.last_attempt_at,last_success_at=coalesce(excluded.last_success_at,raw.sync_entity_state.last_success_at),last_run_id=excluded.last_run_id,summary_message=excluded.summary_message,updated_at=excluded.updated_at;
$$;
create function public.operational_log_sync_error(payload jsonb) returns void language sql security definer set search_path = '' as $$
  insert into raw.sync_errors(sync_run_id,entity_type,omie_id,error_message,retryable) values((payload->>'sync_run_id')::uuid,payload->>'entity_type',payload->>'omie_id',payload->>'error_message',false);
$$;
create function public.operational_acquire_sync_lock(entity text,run_id uuid,ttl_minutes integer default 30) returns void language plpgsql security definer set search_path = '' as $$ begin
  delete from raw.sync_locks where expires_at<now(); insert into raw.sync_locks(entity_type,sync_run_id,expires_at) values(entity,run_id,now()+make_interval(mins=>ttl_minutes)); end $$;
create function public.operational_release_sync_lock(entity text) returns void language sql security definer set search_path = '' as $$ delete from raw.sync_locks where entity_type=entity; $$;

revoke all on function public.operational_store_raw(jsonb),public.operational_start_sync(text,text),public.operational_finish_sync(uuid,jsonb),public.operational_complete_sync_state(text,uuid,jsonb),public.operational_log_sync_error(jsonb),public.operational_acquire_sync_lock(text,uuid,integer),public.operational_release_sync_lock(text) from public,anon,authenticated;
grant execute on function public.operational_store_raw(jsonb),public.operational_start_sync(text,text),public.operational_finish_sync(uuid,jsonb),public.operational_complete_sync_state(text,uuid,jsonb),public.operational_log_sync_error(jsonb),public.operational_acquire_sync_lock(text,uuid,integer),public.operational_release_sync_lock(text) to service_role;
grant select,insert,update,delete on public.customers,public.sellers,public.categories,public.bank_accounts,public.accounts_receivable,public.accounts_payable,public.sales_orders,public.sales_order_installments,public.service_orders to service_role;
grant usage,select on all sequences in schema public to service_role;
