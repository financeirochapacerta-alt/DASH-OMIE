-- Authentication, canonical profiles, and fail-closed authorization policies.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.user_role as enum (
  'ADMIN',
  'DIRETORIA',
  'FINANCEIRO',
  'COMERCIAL',
  'PRODUCAO',
  'VIEWER'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'VIEWER',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.is_active
    );
$$;

create or replace function private.has_role(allowed_roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles profile
      where profile.id = (select auth.uid())
        and profile.is_active
        and profile.role = any (allowed_roles)
    );
$$;

revoke all on function private.is_active_user() from public, anon;
revoke all on function private.has_role(public.user_role[]) from public, anon;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.has_role(public.user_role[]) to authenticated;
grant usage on type public.user_role to authenticated;

grant select, update on table public.profiles to authenticated;
revoke all on table public.profiles from anon;

create policy profiles_select_own
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_select_admin
on public.profiles for select
to authenticated
using (private.has_role(array['ADMIN']::public.user_role[]));

create policy profiles_update_admin
on public.profiles for update
to authenticated
using (private.has_role(array['ADMIN']::public.user_role[]))
with check (private.has_role(array['ADMIN']::public.user_role[]));

grant select on table
  public.customers,
  public.sellers,
  public.categories,
  public.bank_accounts,
  public.sales_orders,
  public.sales_order_installments,
  public.service_orders,
  public.accounts_receivable,
  public.accounts_payable,
  public.stage_mappings,
  public.dre_category_mappings,
  public.management_settings
to authenticated;

create policy customers_select_by_role
on public.customers for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'FINANCEIRO', 'COMERCIAL', 'PRODUCAO']::public.user_role[]));

create policy sellers_select_by_role
on public.sellers for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'FINANCEIRO', 'COMERCIAL', 'PRODUCAO']::public.user_role[]));

create policy categories_select_by_role
on public.categories for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'FINANCEIRO']::public.user_role[]));

create policy bank_accounts_select_by_role
on public.bank_accounts for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'FINANCEIRO']::public.user_role[]));

create policy sales_orders_select_by_role
on public.sales_orders for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'COMERCIAL', 'PRODUCAO']::public.user_role[]));

create policy sales_order_installments_select_by_role
on public.sales_order_installments for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'COMERCIAL', 'PRODUCAO']::public.user_role[]));

create policy service_orders_select_by_role
on public.service_orders for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'COMERCIAL', 'PRODUCAO']::public.user_role[]));

create policy accounts_receivable_select_by_role
on public.accounts_receivable for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'FINANCEIRO']::public.user_role[]));

create policy accounts_payable_select_by_role
on public.accounts_payable for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'FINANCEIRO']::public.user_role[]));

create policy stage_mappings_select_by_role
on public.stage_mappings for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'COMERCIAL', 'PRODUCAO']::public.user_role[]));

create policy dre_category_mappings_select_by_role
on public.dre_category_mappings for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA', 'FINANCEIRO']::public.user_role[]));

create policy management_settings_select_by_role
on public.management_settings for select
to authenticated
using (private.has_role(array['ADMIN', 'DIRETORIA']::public.user_role[]));

grant insert, update, delete on table
  public.stage_mappings,
  public.dre_category_mappings,
  public.management_settings
to authenticated;

grant usage, select on sequence
  public.stage_mappings_id_seq,
  public.dre_category_mappings_id_seq
to authenticated;

create policy stage_mappings_insert_admin
on public.stage_mappings for insert
to authenticated
with check (private.has_role(array['ADMIN']::public.user_role[]));

create policy stage_mappings_update_admin
on public.stage_mappings for update
to authenticated
using (private.has_role(array['ADMIN']::public.user_role[]))
with check (private.has_role(array['ADMIN']::public.user_role[]));

create policy stage_mappings_delete_admin
on public.stage_mappings for delete
to authenticated
using (private.has_role(array['ADMIN']::public.user_role[]));

create policy dre_category_mappings_insert_admin
on public.dre_category_mappings for insert
to authenticated
with check (private.has_role(array['ADMIN']::public.user_role[]));

create policy dre_category_mappings_update_admin
on public.dre_category_mappings for update
to authenticated
using (private.has_role(array['ADMIN']::public.user_role[]))
with check (private.has_role(array['ADMIN']::public.user_role[]));

create policy dre_category_mappings_delete_admin
on public.dre_category_mappings for delete
to authenticated
using (private.has_role(array['ADMIN']::public.user_role[]));

create policy management_settings_insert_admin
on public.management_settings for insert
to authenticated
with check (private.has_role(array['ADMIN']::public.user_role[]));

create policy management_settings_update_admin
on public.management_settings for update
to authenticated
using (private.has_role(array['ADMIN']::public.user_role[]))
with check (private.has_role(array['ADMIN']::public.user_role[]));

create policy management_settings_delete_admin
on public.management_settings for delete
to authenticated
using (private.has_role(array['ADMIN']::public.user_role[]));

grant usage on schema analytics to authenticated;
grant select on all tables in schema analytics to authenticated;

revoke all on all tables in schema raw from anon, authenticated;
revoke all on all sequences in schema raw from anon, authenticated;
