alter table public.dre_category_mappings
  add column type_order integer not null default 0,
  add column group_order integer not null default 0,
  add column account_order integer not null default 0;

insert into public.management_settings (setting_key, value, value_type, description)
values
  ('minimum_cash', '0'::jsonb, 'number', 'Minimum consolidated cash threshold'),
  ('cash_projection_days', '30'::jsonb, 'number', 'Default cash projection horizon in days')
on conflict (setting_key) do nothing;

create policy management_settings_cash_select_finance
on public.management_settings for select to authenticated
using (
  setting_key in ('minimum_cash', 'cash_projection_days')
  and private.has_role(array['FINANCEIRO']::public.user_role[])
);

create view analytics.dre_details with (security_invoker = true) as
select fm.movement_type, fm.id, fm.omie_id, fm.due_date,
  date_trunc('month', fm.due_date)::date as month,
  fm.category_id, c.name as category_name, fm.signed_value,
  case when dm.id is null then 'unmapped' else 'mapped' end as mapping_status,
  dm.dre_type, dm.dre_group, dm.dre_account, dm.source as mapping_source,
  coalesce(dm.type_order, 0) type_order, coalesce(dm.group_order, 0) group_order,
  coalesce(dm.account_order, 0) account_order
from analytics.financial_movements fm
left join public.categories c on c.id = fm.category_id
left join lateral (
  select mapping.* from public.dre_category_mappings mapping
  where mapping.category_id = fm.category_id and mapping.active
  order by mapping.type_order, mapping.group_order, mapping.account_order, mapping.source, mapping.id
  limit 1
) dm on true;

create view analytics.dre_monthly with (security_invoker = true) as
select month, mapping_status, dre_type, dre_group, dre_account, category_id, category_name,
  type_order, group_order, account_order, count(*) title_count, sum(signed_value) amount
from analytics.dre_details
group by month, mapping_status, dre_type, dre_group, dre_account, category_id, category_name,
  type_order, group_order, account_order;

create view analytics.dre_cumulative with (security_invoker = true) as
select *, sum(amount) over (
  partition by mapping_status, dre_type, dre_group, dre_account, category_id
  order by month rows unbounded preceding
) cumulative_amount
from analytics.dre_monthly;

create view analytics.cash_account_balances with (security_invoker = true) as
select ba.id bank_account_id, ba.omie_id, ba.description, ba.balance_date, ba.initial_balance,
  ba.initial_balance + coalesce(sum(fm.signed_value) filter (
    where fm.is_settled and not fm.is_cancelled and fm.due_date >= ba.balance_date
  ), 0) current_balance
from public.bank_accounts ba
left join analytics.financial_movements fm on fm.bank_account_id = ba.id
where ba.selected_for_cash and not ba.blocked and not ba.inactive
group by ba.id, ba.omie_id, ba.description, ba.balance_date, ba.initial_balance;

create view analytics.cash_current_balance with (security_invoker = true) as
select coalesce(sum(current_balance), 0) current_balance from analytics.cash_account_balances;

create view analytics.cash_realized_daily with (security_invoker = true) as
select due_date as movement_date,
  coalesce(sum(signed_value) filter (where signed_value > 0), 0) inflows,
  coalesce(sum(signed_value) filter (where signed_value < 0), 0) outflows,
  coalesce(sum(signed_value), 0) net_flow
from analytics.financial_movements where is_settled and not is_cancelled group by due_date;

create view analytics.cash_realized_monthly with (security_invoker = true) as
select date_trunc('month', movement_date)::date as month_start, sum(inflows) inflows, sum(outflows) outflows, sum(net_flow) net_flow
from analytics.cash_realized_daily group by date_trunc('month', movement_date)::date;

create view analytics.cash_projection_movements with (security_invoker = true) as
select greatest(due_date, current_date) projection_date, due_date original_due_date,
  movement_type, id, omie_id, signed_value, due_date < current_date is_overdue
from analytics.financial_movements where not is_settled and not is_cancelled;

create view analytics.cash_projection_daily with (security_invoker = true) as
with settings as (
  select coalesce(max((value #>> '{}')::integer) filter (where setting_key = 'cash_projection_days'), 30) horizon
  from public.management_settings
), days as (
  select generate_series(current_date, current_date + (select horizon from settings), interval '1 day')::date projection_date
), movements as (
  select projection_date,
    coalesce(sum(signed_value) filter (where signed_value > 0), 0) inflows,
    coalesce(sum(signed_value) filter (where signed_value < 0), 0) outflows
  from analytics.cash_projection_movements
  where projection_date <= current_date + (select horizon from settings)
  group by projection_date
), opening as (select current_balance from analytics.cash_current_balance)
select d.projection_date, o.current_balance
    + coalesce(sum(coalesce(m.inflows, 0) + coalesce(m.outflows, 0)) over (order by d.projection_date rows between unbounded preceding and 1 preceding), 0) opening_balance,
  coalesce(m.inflows, 0) inflows, coalesce(m.outflows, 0) outflows,
  coalesce(m.inflows, 0) + coalesce(m.outflows, 0) net_flow,
  o.current_balance + sum(coalesce(m.inflows, 0) + coalesce(m.outflows, 0)) over (order by d.projection_date) closing_balance
from days d cross join opening o left join movements m using (projection_date);

create view analytics.cash_projection_summary with (security_invoker = true) as
with settings as (
  select coalesce(max((value #>> '{}')::numeric) filter (where setting_key = 'minimum_cash'), 0) minimum_cash
  from public.management_settings
)
select min(projection_date) filter (where closing_balance < 0) first_negative_cash_date,
  min(projection_date) filter (where closing_balance < settings.minimum_cash) first_below_minimum_cash_date,
  sum(inflows) projected_inflows, sum(outflows) projected_outflows,
  sum(case when projection_date = current_date then inflows - outflows else 0 end) overdue_concentration,
  settings.minimum_cash
from analytics.cash_projection_daily cross join settings group by settings.minimum_cash;

create view analytics.cash_projection_monthly with (security_invoker = true) as
select date_trunc('month', projection_date)::date as month_start,
  sum(inflows) inflows, sum(outflows) outflows, sum(net_flow) net_flow,
  (array_agg(closing_balance order by projection_date desc))[1] closing_balance
from analytics.cash_projection_daily
group by date_trunc('month', projection_date)::date;

create view analytics.payables_heatmap with (security_invoker = true) as
select projection_date, count(*) payment_count, abs(sum(signed_value)) payment_value,
  count(*) filter (where is_overdue) overdue_count, abs(sum(signed_value) filter (where is_overdue)) overdue_value
from analytics.cash_projection_movements where movement_type = 'payable' group by projection_date;

revoke all on analytics.dre_details, analytics.dre_monthly, analytics.dre_cumulative,
  analytics.cash_account_balances, analytics.cash_current_balance, analytics.cash_realized_daily,
  analytics.cash_realized_monthly, analytics.cash_projection_movements, analytics.cash_projection_daily,
  analytics.cash_projection_summary, analytics.cash_projection_monthly, analytics.payables_heatmap from public, anon;
grant select on analytics.dre_details, analytics.dre_monthly, analytics.dre_cumulative,
  analytics.cash_account_balances, analytics.cash_current_balance, analytics.cash_realized_daily,
  analytics.cash_realized_monthly, analytics.cash_projection_movements, analytics.cash_projection_daily,
  analytics.cash_projection_summary, analytics.cash_projection_monthly, analytics.payables_heatmap to authenticated;

