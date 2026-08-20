create schema if not exists raw;
create schema if not exists analytics;

revoke all on schema raw from public, anon, authenticated;
revoke all on schema analytics from public, anon, authenticated;

create table raw.sync_runs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (btrim(entity_type) <> ''),
  sync_type text not null check (sync_type in ('full', 'incremental', 'webhook', 'reconciliation')),
  status text not null default 'pending' check (status in ('pending', 'running', 'succeeded', 'partial', 'failed', 'cancelled')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_read bigint not null default 0 check (records_read >= 0),
  records_inserted bigint not null default 0 check (records_inserted >= 0),
  records_updated bigint not null default 0 check (records_updated >= 0),
  error_count bigint not null default 0 check (error_count >= 0),
  cursor_value jsonb,
  summary_message text,
  created_at timestamptz not null default now(),
  constraint sync_runs_finished_after_started check (finished_at is null or finished_at >= started_at)
);

create index sync_runs_entity_started_idx on raw.sync_runs (entity_type, started_at desc);
create index sync_runs_active_idx on raw.sync_runs (started_at) where status in ('pending', 'running');

create table raw.sync_entity_state (
  entity_type text primary key check (btrim(entity_type) <> ''),
  cursor_value jsonb,
  incremental_since timestamptz,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_run_id uuid references raw.sync_runs (id) on delete restrict,
  summary_message text,
  updated_at timestamptz not null default now()
);

create index sync_entity_state_last_run_idx on raw.sync_entity_state (last_run_id) where last_run_id is not null;

create table raw.sync_errors (
  id bigint generated always as identity primary key,
  sync_run_id uuid not null references raw.sync_runs (id) on delete restrict,
  entity_type text not null check (btrim(entity_type) <> ''),
  omie_id text,
  error_code text,
  error_message text not null,
  retryable boolean not null default false,
  attempt integer not null default 1 check (attempt > 0),
  context jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index sync_errors_run_idx on raw.sync_errors (sync_run_id, occurred_at);
create index sync_errors_retryable_idx on raw.sync_errors (occurred_at) where retryable;

create table raw.omie_records (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (btrim(entity_type) <> ''),
  omie_id text,
  raw_json jsonb not null,
  payload_hash text,
  source text not null check (btrim(source) <> ''),
  fetched_at timestamptz not null default now(),
  sync_run_id uuid references raw.sync_runs (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index omie_records_entity_omie_idx on raw.omie_records (entity_type, omie_id) where omie_id is not null;
create index omie_records_sync_run_idx on raw.omie_records (sync_run_id) where sync_run_id is not null;
create index omie_records_fetched_idx on raw.omie_records (entity_type, fetched_at desc);

create table raw.omie_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  event_type text not null check (btrim(event_type) <> ''),
  raw_json jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'pending' check (processing_status in ('pending', 'processing', 'processed', 'failed', 'discarded')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  constraint webhook_processed_after_received check (processed_at is null or processed_at >= received_at)
);

create unique index omie_webhook_events_event_id_uidx on raw.omie_webhook_events (event_id) where event_id is not null;
create index omie_webhook_events_pending_idx on raw.omie_webhook_events (received_at) where processing_status in ('pending', 'failed');

alter table raw.sync_runs enable row level security;
alter table raw.sync_entity_state enable row level security;
alter table raw.sync_errors enable row level security;
alter table raw.omie_records enable row level security;
alter table raw.omie_webhook_events enable row level security;

revoke all on all tables in schema raw from public, anon, authenticated;
revoke all on all sequences in schema raw from public, anon, authenticated;
