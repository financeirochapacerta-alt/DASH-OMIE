create table public.sales_orders (
  id bigint generated always as identity primary key,
  omie_id text not null unique,
  display_number text,
  customer_id bigint not null references public.customers (id) on delete restrict,
  seller_id bigint references public.sellers (id) on delete set null,
  contract_number text,
  forecast_date date,
  stage_code text,
  stage_classification text,
  total_value numeric(18, 2) not null check (total_value >= 0),
  is_cancelled boolean,
  cancelled_at timestamptz,
  invoice_date date,
  real_due_date date,
  enrichment_status text not null default 'pending' check (enrichment_status in ('pending', 'enriched', 'failed')),
  enriched_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_orders_cancelled_consistency check (is_cancelled is not false or cancelled_at is null),
  constraint sales_orders_enrichment_consistency check ((enrichment_status = 'enriched') = (enriched_at is not null))
);

create table public.sales_order_installments (
  id bigint generated always as identity primary key,
  sales_order_id bigint not null references public.sales_orders (id) on delete restrict,
  installment_number text,
  due_date date not null,
  amount numeric(18, 2) check (amount is null or amount >= 0),
  omie_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_orders (
  id bigint generated always as identity primary key,
  omie_id text not null unique,
  display_number text,
  customer_id bigint not null references public.customers (id) on delete restrict,
  seller_id bigint references public.sellers (id) on delete set null,
  contract_number text,
  forecast_date date,
  stage_code text,
  stage_classification text,
  total_value numeric(18, 2) not null check (total_value >= 0),
  inclusion_date date,
  invoice_date date,
  is_cancelled boolean,
  real_due_date date,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sales_orders_customer_idx on public.sales_orders (customer_id);
create index sales_orders_seller_idx on public.sales_orders (seller_id) where seller_id is not null;
create index sales_orders_stage_idx on public.sales_orders (stage_code) where stage_code is not null;
create index sales_orders_active_invoice_idx on public.sales_orders (invoice_date) where is_cancelled is false;
create index sales_order_installments_order_idx on public.sales_order_installments (sales_order_id);
create unique index sales_order_installments_number_uidx on public.sales_order_installments (sales_order_id, installment_number) where installment_number is not null;
create unique index sales_order_installments_reference_uidx on public.sales_order_installments (sales_order_id, omie_reference) where omie_reference is not null;
create index service_orders_customer_idx on public.service_orders (customer_id);
create index service_orders_seller_idx on public.service_orders (seller_id) where seller_id is not null;
create index service_orders_stage_idx on public.service_orders (stage_code) where stage_code is not null;

create trigger sales_orders_set_updated_at before update on public.sales_orders
for each row execute function public.set_updated_at();
create trigger sales_order_installments_set_updated_at before update on public.sales_order_installments
for each row execute function public.set_updated_at();
create trigger service_orders_set_updated_at before update on public.service_orders
for each row execute function public.set_updated_at();

alter table public.sales_orders enable row level security;
alter table public.sales_order_installments enable row level security;
alter table public.service_orders enable row level security;

revoke all on table public.sales_orders, public.sales_order_installments, public.service_orders from anon, authenticated;
revoke all on sequence public.sales_orders_id_seq, public.sales_order_installments_id_seq, public.service_orders_id_seq from anon, authenticated;
