create table public.accounts_receivable (
  id bigint generated always as identity primary key,
  omie_id text not null unique,
  customer_id bigint references public.customers (id) on delete set null,
  seller_id bigint references public.sellers (id) on delete set null,
  category_id bigint references public.categories (id) on delete set null,
  bank_account_id bigint references public.bank_accounts (id) on delete set null,
  due_date date not null,
  forecast_date date,
  issue_date date,
  original_value numeric(18, 2) not null check (original_value >= 0),
  signed_value numeric(18, 2) generated always as (original_value) stored,
  status text not null,
  document_number text,
  installment_number text,
  is_settled boolean not null default false,
  is_cancelled boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts_payable (
  id bigint generated always as identity primary key,
  omie_id text not null unique,
  customer_id bigint references public.customers (id) on delete set null,
  seller_id bigint references public.sellers (id) on delete set null,
  category_id bigint references public.categories (id) on delete set null,
  bank_account_id bigint references public.bank_accounts (id) on delete set null,
  due_date date not null,
  forecast_date date,
  issue_date date,
  original_value numeric(18, 2) not null check (original_value >= 0),
  signed_value numeric(18, 2) generated always as (-original_value) stored,
  status text not null,
  document_number text,
  installment_number text,
  is_settled boolean not null default false,
  is_cancelled boolean not null default false,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_receivable_customer_idx on public.accounts_receivable (customer_id) where customer_id is not null;
create index accounts_receivable_seller_idx on public.accounts_receivable (seller_id) where seller_id is not null;
create index accounts_receivable_category_idx on public.accounts_receivable (category_id) where category_id is not null;
create index accounts_receivable_bank_account_idx on public.accounts_receivable (bank_account_id) where bank_account_id is not null;
create index accounts_receivable_open_due_idx on public.accounts_receivable (due_date) where not is_settled and not is_cancelled;

create index accounts_payable_customer_idx on public.accounts_payable (customer_id) where customer_id is not null;
create index accounts_payable_seller_idx on public.accounts_payable (seller_id) where seller_id is not null;
create index accounts_payable_category_idx on public.accounts_payable (category_id) where category_id is not null;
create index accounts_payable_bank_account_idx on public.accounts_payable (bank_account_id) where bank_account_id is not null;
create index accounts_payable_open_due_idx on public.accounts_payable (due_date) where not is_settled and not is_cancelled;

create trigger accounts_receivable_set_updated_at before update on public.accounts_receivable
for each row execute function public.set_updated_at();
create trigger accounts_payable_set_updated_at before update on public.accounts_payable
for each row execute function public.set_updated_at();

alter table public.accounts_receivable enable row level security;
alter table public.accounts_payable enable row level security;

revoke all on table public.accounts_receivable, public.accounts_payable from anon, authenticated;
revoke all on sequence public.accounts_receivable_id_seq, public.accounts_payable_id_seq from anon, authenticated;
