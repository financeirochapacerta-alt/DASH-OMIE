create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create table public.customers (
  id bigint generated always as identity primary key,
  omie_id text not null unique,
  legal_name text not null,
  trade_name text,
  document_number text,
  is_active boolean not null default true,
  raw_last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sellers (
  id bigint generated always as identity primary key,
  omie_id text not null unique,
  name text not null,
  email text,
  is_active boolean not null default true,
  raw_last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id bigint generated always as identity primary key,
  omie_id text not null unique,
  name text not null,
  codigo_dre text,
  dre_metadata jsonb,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bank_accounts (
  id bigint generated always as identity primary key,
  omie_id text not null unique,
  description text not null,
  initial_balance numeric(18, 2) not null default 0,
  balance_date date,
  blocked boolean not null default false,
  inactive boolean not null default false,
  account_type text,
  selected_for_cash boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();
create trigger sellers_set_updated_at before update on public.sellers
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger bank_accounts_set_updated_at before update on public.bank_accounts
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.sellers enable row level security;
alter table public.categories enable row level security;
alter table public.bank_accounts enable row level security;

revoke all on table public.customers, public.sellers, public.categories, public.bank_accounts from anon, authenticated;
revoke all on sequence public.customers_id_seq, public.sellers_id_seq, public.categories_id_seq, public.bank_accounts_id_seq from anon, authenticated;
