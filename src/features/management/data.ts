import "server-only";

import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, formatInteger } from "./format";
import { previousPeriod, type Period } from "./period";
import { generateManagementAlerts, type ManagementAlert } from "./rules";

export type Metric = {
  label: string;
  value: string;
  detail?: string;
  tone?: "positive" | "warning" | "negative" | "neutral";
  delta?: { current: number; previous: number | null; comparisonLabel: string };
  tooltip?: string;
};
export type ChartPoint = { label: string; primary: number; secondary?: number };
export type UpcomingBucket = { label: string; receivable: number; payable: number };
export type ConcentrationRow = { name: string; value: number; percent: number };
export type CompositionSlice = { label: string; value: number; percent: number; count: number; color: string };
export type ManagementPageData = {
  metrics: Metric[];
  chart: ChartPoint[];
  secondaryChart?: ChartPoint[];
  rows: Record<string, string | number | null>[];
  secondaryRows?: Record<string, string | number | null>[];
  alerts: { title: string; detail: string; priority: "critical" | "warning" | "info" }[];
  accounts?: { description: string; balance: number; hasKnownBalanceDate: boolean; participationPercent: number }[];
  upcoming?: UpcomingBucket[];
  concentration?: ConcentrationRow[];
  composition?: CompositionSlice[];
  cashReferenceLine?: number;
  dreHierarchy?: { tipo: string; grupo: string; conta: string; categoria: string; origem: "Manual" | "Omie" | "Unmapped"; amount: number }[];
  sellerRanking?: { sellerId: number; position: number; sellerName: string; value: number; count: number; averageTicket: number; participationPercent: number }[];
  customerRanking?: { customerId: number; customerName: string; value: number; sharePercent: number; cumulativePercent: number; abcClass: string }[];
};

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0);
const txt = (v: unknown) => (typeof v === "string" ? v : null);
const bool = (v: unknown) => v === true;

// name is resolved at each call site from a fixed set of view/function names, not user input;
// the casts only widen Supabase's generated literal-union types back to string for these
// shared helpers.
async function view(name: string, range?: { column: string; from: string; to: string }) {
  const client = await createClient();
  const base = client.schema("analytics").from(name as never).select("*");
  const query = range ? base.gte(range.column, range.from).lte(range.column, range.to) : base;
  const result = await query;
  if (result.error) throw new Error("Não foi possível consultar os dados gerenciais.");
  return (result.data ?? []) as Record<string, unknown>[];
}

// Period-aware commercial aggregates (sales_summary_period, sales_by_seller_period,
// sales_pipeline_period, customer_abc_period) — see
// supabase/migrations/20260821230000_commercial_period_functions.sql. Scoped by
// analytics.sales.forecast_date, the confirmed commercial date field.
async function periodFn(name: string, period: Period) {
  const client = await createClient();
  const result = await client.schema("analytics").rpc(name as never, { p_from: period.from, p_to: period.to } as never);
  if (result.error) throw new Error("Não foi possível consultar os dados gerenciais.");
  const data = result.data;
  return (Array.isArray(data) ? data : data ? [data] : []) as Record<string, unknown>[];
}

async function scalarFn(name: string, period: Period): Promise<number> {
  const client = await createClient();
  const result = await client.schema("analytics").rpc(name as never, { p_from: period.from, p_to: period.to } as never);
  if (result.error) throw new Error("Não foi possível consultar os dados gerenciais.");
  return num(result.data);
}

// management_settings is RLS-restricted to ADMIN/DIRETORIA (and FINANCEIRO for two cash keys).
// Other roles legitimately get zero rows back — that is not a query failure, just no threshold
// data to alert on for that role.
async function settingValue(key: string): Promise<number | null> {
  const client = await createClient();
  const result = await client.from("management_settings").select("value").eq("setting_key", key).maybeSingle();
  if (result.error || !result.data) return null;
  const value = result.data.value as unknown;
  return typeof value === "number" ? value : Number(value) || null;
}

const metric = (label: string, value: unknown, detail?: string, tone: Metric["tone"] = "neutral", tooltip?: string): Metric => ({
  label,
  value: formatBRL(num(value)),
  detail,
  tone,
  tooltip,
});
const metricWithDelta = (label: string, current: number, previousValue: number | null, comparisonLabel: string, detail?: string, tone?: Metric["tone"]): Metric => ({
  label,
  value: formatBRL(current),
  detail,
  tone: tone ?? (current >= 0 ? "positive" : "negative"),
  delta: { current, previous: previousValue, comparisonLabel },
});
const totalAbs = (rows: Record<string, unknown>[]) => rows.reduce((sum, row) => sum + Math.abs(num(row.signed_value)), 0);
function monthlyResultTotals(rows: Record<string, unknown>[]) {
  return rows
    .filter((row) => row.month)
    .reduce((acc: Record<string, number>, row) => {
      const key = String(row.month);
      acc[key] = (acc[key] ?? 0) + num(row.amount);
      return acc;
    }, {});
}

function alertsFrom(list: ManagementAlert[]) {
  return list.map((alert) => ({
    title: alert.title,
    detail: alert.value ? formatBRL(alert.value) : "Revisar antes da próxima decisão",
    priority: alert.priority,
  }));
}

// Which metrics follow the period filter, and why (see docs/06-COMMERCIAL.md /
// 07-INDICATORS.md for the underlying rules — this only decides which already-approved
// data source each KPI reads from):
//
// - Vendas/Faturado/A faturar/Melhor vendedor/Resultado gerencial: movement metrics, scoped
//   to the selected period.
// - A receber/A pagar/Vencido/Saldo atual/Projeção de caixa: stock or point-in-time metrics —
//   never disappear or change because of a period filter; a bank balance or an open title list
//   is "as of now", not "during this window".
async function executive(period: Period): Promise<ManagementPageData> {
  const prevPeriod = previousPeriod(period);
  const [
    salesSummary,
    prevSalesSummary,
    cash,
    projection,
    dreMonthly,
    receivables,
    payables,
    overdueReceivables,
    overduePayables,
    dailyProjection,
    sellers,
    highOverdueThreshold,
  ] = await Promise.all([
    periodFn("sales_summary_period", period),
    periodFn("sales_summary_period", prevPeriod),
    view("cash_current_balance"),
    view("cash_projection_summary"),
    view("dre_monthly"),
    view("open_receivables"),
    view("open_payables"),
    view("overdue_receivables"),
    view("overdue_payables"),
    view("cash_projection_daily"),
    periodFn("sales_by_seller_period", period),
    settingValue("high_overdue_amount_threshold"),
  ]);

  const s = salesSummary[0] ?? {};
  const prevS = prevSalesSummary[0] ?? null;
  const c = cash[0] ?? {};
  const p = projection[0] ?? {};
  // The trend chart below intentionally stays a fixed rolling window (it's a multi-month
  // trend by design — collapsing it to a 1-month filter selection would make it useless).
  // Only the single KPI value is scoped to the selected period.
  const periodDreRows = dreMonthly.filter((row) => {
    const month = txt(row.month);
    return month !== null && month >= period.from && month <= period.to;
  });
  const prevDreRows = dreMonthly.filter((row) => {
    const month = txt(row.month);
    return month !== null && month >= prevPeriod.from && month <= prevPeriod.to;
  });
  const resultadoPeriodo = periodDreRows.reduce((sum, row) => sum + num(row.amount), 0);
  const resultadoAnterior = prevDreRows.length ? prevDreRows.reduce((sum, row) => sum + num(row.amount), 0) : null;
  const overdueTotal = totalAbs(overdueReceivables) + totalAbs(overduePayables);
  const horizonClose = dailyProjection.at(-1);
  const topSeller = [...sellers].sort((a, b) => num(b.total_value) - num(a.total_value))[0];

  const alerts = generateManagementAlerts({
    negativeCashDate: txt(p.first_negative_cash_date),
    belowMinimumDate: txt(p.first_below_minimum_cash_date),
    overdueReceivables: totalAbs(overdueReceivables),
    highOverdueThreshold: highOverdueThreshold ?? 0,
    goalBehind: false,
    customerShare: 0,
    customerThreshold: 0,
    paymentConcentration: 0,
    paymentThreshold: 0,
    unmappedCategories: 0,
    pendingEnrichment: 0,
  });

  return {
    metrics: [
      // 1. Quanto estamos vendendo?
      { ...metricWithDelta("Vendas", num(s.total_value), prevS ? num(prevS.total_value) : null, prevPeriod.label), tone: "neutral", detail: `Pedidos e OS não cancelados — ${period.label}` },
      // 2. Quanto já faturamos?
      { ...metricWithDelta("Faturado", num(s.invoiced_value), prevS ? num(prevS.invoiced_value) : null, prevPeriod.label), tone: "positive", detail: period.label },
      // 3. Quanto ainda temos para faturar?
      metric("A faturar", s.to_invoice_value, period.label),
      // 4. Quanto temos para receber?
      metric("A receber", totalAbs(receivables), "Estoque — não muda com o filtro", "neutral", "Títulos abertos, não cancelados, independentemente do filtro histórico."),
      // 5. Quanto temos para pagar?
      metric("A pagar", totalAbs(payables), "Estoque — não muda com o filtro", "neutral", "Títulos abertos, não cancelados, independentemente do filtro histórico."),
      // 6. Quanto está vencido?
      metric("Vencido (total)", overdueTotal, "Receber + pagar", overdueTotal > 0 ? "warning" : "positive", "Abertos, não cancelados e com vencimento antes de hoje."),
      // 7. Como está o caixa?
      metric("Saldo atual", c.current_balance, undefined, num(c.current_balance) < 0 ? "negative" : "positive", "Soma das contas selecionadas, ativas e não bloqueadas — agora, não no período filtrado."),
      metric("Projeção de caixa", horizonClose?.closing_balance, `Ao fim do horizonte (${formatDate(txt(horizonClose?.projection_date))})`),
      // 8. O resultado do período é positivo ou negativo?
      metricWithDelta(`Resultado gerencial — ${period.label}`, resultadoPeriodo, resultadoAnterior, prevPeriod.label, "DRE por vencimento"),
      // 9. Quem está vendendo?
      {
        label: "Melhor vendedor",
        value: topSeller ? formatBRL(num(topSeller.total_value)) : "—",
        detail: topSeller ? (txt(topSeller.seller_name) ?? "Vendedor não identificado na Omie") : `Sem vendas no período (${period.label})`,
      },
      // 10. Principais riscos: "Caixa fica crítico em" — alerts (abaixo) cobrem o restante.
      {
        label: "Caixa fica crítico em",
        value: txt(p.first_negative_cash_date) ? formatDate(txt(p.first_negative_cash_date)) : "Sem previsão",
        detail: txt(p.first_negative_cash_date) ? "Data projetada do primeiro saldo negativo" : "Nenhum saldo negativo no horizonte atual",
        tone: txt(p.first_negative_cash_date) ? "negative" : "positive",
      },
    ],
    chart: Object.entries(monthlyResultTotals(dreMonthly))
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({ label: formatDate(month), primary: amount })),
    secondaryChart: dailyProjection.slice(0, 30).map((row) => ({
      label: formatDate(txt(row.projection_date)),
      primary: num(row.closing_balance),
    })),
    rows: [],
    alerts: alertsFrom(alerts),
    cashReferenceLine: num(p.minimum_cash),
  };
}

function upcomingBuckets(receivableRows: Record<string, unknown>[], payableRows: Record<string, unknown>[]): UpcomingBucket[] {
  const inRange = (rows: Record<string, unknown>[], lo: number, hi: number) =>
    rows.reduce((sum, row) => {
      const days = typeof row.days_to_due === "number" ? row.days_to_due : Number(row.days_to_due);
      return Number.isFinite(days) && days >= lo && days <= hi ? sum + Math.abs(num(row.signed_value)) : sum;
    }, 0);
  return [
    { label: "Hoje", receivable: inRange(receivableRows, 0, 0), payable: inRange(payableRows, 0, 0) },
    { label: "Próximos 7 dias", receivable: inRange(receivableRows, 1, 7), payable: inRange(payableRows, 1, 7) },
    { label: "Próximos 15 dias", receivable: inRange(receivableRows, 8, 15), payable: inRange(payableRows, 8, 15) },
    { label: "Próximos 30 dias", receivable: inRange(receivableRows, 16, 30), payable: inRange(payableRows, 16, 30) },
  ];
}

function topConcentration(rows: Record<string, unknown>[], take = 5): ConcentrationRow[] {
  const byCustomer = rows.reduce((acc: Record<string, number>, row) => {
    const name = txt(row.customer_name) ?? "Sem cadastro na Omie";
    acc[name] = (acc[name] ?? 0) + Math.abs(num(row.signed_value));
    return acc;
  }, {});
  const total = Object.values(byCustomer).reduce((sum, v) => sum + v, 0);
  return Object.entries(byCustomer)
    .sort(([, a], [, b]) => b - a)
    .slice(0, take)
    .map(([name, value]) => ({ name, value, percent: total > 0 ? (value / total) * 100 : 0 }));
}

async function financial(period: Period): Promise<ManagementPageData> {
  const [r, p, or, op, m, realized] = await Promise.all([
    view("open_receivables"),
    view("open_payables"),
    view("overdue_receivables"),
    view("overdue_payables"),
    view("financial_movements", { column: "due_date", from: period.from, to: period.to }),
    view("cash_realized_monthly"),
  ]);
  return {
    metrics: [
      metric("A receber", totalAbs(r), "Estoque — não muda com o filtro de período", "neutral", "Títulos abertos, não cancelados, independentemente do filtro histórico."),
      metric("A pagar", totalAbs(p), "Estoque — não muda com o filtro de período", "neutral", "Títulos abertos, não cancelados, independentemente do filtro histórico."),
      metric("Recebíveis vencidos", totalAbs(or), undefined, "warning", "Abertos, não cancelados e com vencimento antes de hoje."),
      metric("Pagáveis vencidos", totalAbs(op), undefined, "warning", "Abertos, não cancelados e com vencimento antes de hoje."),
    ],
    chart: realized
      .slice()
      .sort((a, b) => String(a.month_start).localeCompare(String(b.month_start)))
      .slice(-6)
      .map((row) => ({ label: formatDate(txt(row.month_start)), primary: num(row.inflows), secondary: Math.abs(num(row.outflows)) })),
    rows: m
      .slice()
      .sort((a, b) => String(b.due_date).localeCompare(String(a.due_date)))
      .slice(0, 50)
      .map((row) => ({
        Contraparte: txt(row.customer_name) ?? "Sem cadastro",
        Categoria: txt(row.category_name) ?? "Sem categoria",
        Documento: txt(row.document_number) ?? txt(row.omie_id),
        Vencimento: formatDate(txt(row.due_date)),
        Valor: formatBRL(Math.abs(num(row.signed_value))),
        Tipo: row.movement_type === "receivable" ? "A receber" : "A pagar",
        Status: bool(row.is_settled) ? "Quitado" : txt(row.status) ?? "—",
      })),
    alerts: [],
    upcoming: upcomingBuckets(r, p),
    concentration: topConcentration(r),
  };
}

// Fluxo de Caixa has no period-filterable KPI: "Saldo atual" is point-in-time and the
// projection is a forward horizon (days ahead, not a historical window) — see
// docs/PRODUCTION.md / the filter audit. GlobalFilters is intentionally not rendered on
// that page; this function takes no period argument.
async function cash(): Promise<ManagementPageData> {
  const [balance, summary, daily, accountBalances] = await Promise.all([
    view("cash_current_balance"),
    view("cash_projection_summary"),
    view("cash_projection_daily"),
    view("cash_account_balances"),
  ]);
  const b = balance[0] ?? {};
  const s = summary[0] ?? {};
  const totalBalance = accountBalances.reduce((sum, row) => sum + num(row.current_balance), 0);
  return {
    metrics: [
      metric("Saldo atual", b.current_balance, undefined, num(b.current_balance) < 0 ? "negative" : "positive", "Soma das contas selecionadas, ativas e não bloqueadas — agora."),
      metric("Entradas previstas", s.projected_inflows, undefined, "neutral", "Horizonte de projeção configurado em Configurações, não o filtro de período."),
      metric("Saídas previstas", Math.abs(num(s.projected_outflows)), undefined, "neutral", "Horizonte de projeção configurado em Configurações, não o filtro de período."),
      metric("Caixa mínimo", s.minimum_cash, undefined, "neutral", "Limite configurado por um ADMIN em Configurações."),
      {
        label: "Primeiro saldo negativo",
        value: txt(s.first_negative_cash_date) ? formatDate(txt(s.first_negative_cash_date)) : "Nenhum no horizonte",
        tone: txt(s.first_negative_cash_date) ? "negative" : "positive",
      },
      metric("Concentração hoje", s.overdue_concentration, "Vencidos trazidos para hoje"),
    ],
    chart: daily.map((row) => ({ label: formatDate(txt(row.projection_date)), primary: num(row.closing_balance), secondary: num(row.net_flow) })),
    rows: daily.slice(0, 60).map((row) => ({
      Data: formatDate(txt(row.projection_date)),
      Abertura: formatBRL(num(row.opening_balance)),
      Entradas: formatBRL(num(row.inflows)),
      Saídas: formatBRL(Math.abs(num(row.outflows))),
      Fechamento: formatBRL(num(row.closing_balance)),
    })),
    alerts: [],
    accounts: accountBalances.map((row) => ({
      description: txt(row.description) ?? "Conta sem nome",
      balance: num(row.current_balance),
      hasKnownBalanceDate: Boolean(row.balance_date),
      participationPercent: totalBalance !== 0 ? (num(row.current_balance) / totalBalance) * 100 : 0,
    })),
    cashReferenceLine: num(s.minimum_cash),
  };
}

async function dre(period: Period): Promise<ManagementPageData> {
  const prevPeriod = previousPeriod(period);
  const [rows, allRows] = await Promise.all([
    view("dre_monthly", { column: "month", from: period.from, to: period.to }),
    view("dre_monthly"),
  ]);
  const prevRows = allRows.filter((row) => {
    const month = txt(row.month);
    return month !== null && month >= prevPeriod.from && month <= prevPeriod.to;
  });
  const unmapped = rows.filter((row) => row.mapping_status === "unmapped");
  const total = rows.reduce((sum, row) => sum + num(row.amount), 0);
  const prevTotal = prevRows.length ? prevRows.reduce((sum, row) => sum + num(row.amount), 0) : null;

  const hierarchyKey = (row: Record<string, unknown>) => `${txt(row.dre_type) ?? "—"}|||${txt(row.dre_group) ?? "—"}|||${txt(row.dre_account) ?? "Não classificada"}|||${txt(row.category_name) ?? "Sem categoria"}`;
  const hierarchyMap = new Map<string, { tipo: string; grupo: string; conta: string; categoria: string; origem: "Manual" | "Omie" | "Unmapped"; amount: number }>();
  for (const row of rows) {
    const key = hierarchyKey(row);
    const origem = row.mapping_source === "manual" ? "Manual" : row.mapping_source === "omie" ? "Omie" : "Unmapped";
    const existing = hierarchyMap.get(key);
    if (existing) {
      existing.amount += num(row.amount);
    } else {
      hierarchyMap.set(key, { tipo: txt(row.dre_type) ?? "—", grupo: txt(row.dre_group) ?? "—", conta: txt(row.dre_account) ?? "Não classificada", categoria: txt(row.category_name) ?? "Sem categoria", origem, amount: num(row.amount) });
    }
  }

  return {
    metrics: [
      metricWithDelta(`Resultado gerencial — ${period.label}`, total, prevTotal, prevPeriod.label),
      { label: "Categorias não classificadas", value: formatInteger(unmapped.length), tone: unmapped.length ? "warning" : "positive" },
    ],
    chart: [],
    rows: rows
      .slice()
      .sort((a, b) => num(a.type_order) - num(b.type_order) || num(a.group_order) - num(b.group_order) || num(a.account_order) - num(b.account_order))
      .slice(0, 120)
      .map((row) => ({
        Tipo: txt(row.dre_type) ?? "—",
        Grupo: txt(row.dre_group) ?? "—",
        Conta: txt(row.dre_account) ?? "Não classificada",
        Categoria: txt(row.category_name) ?? "Sem categoria",
        Origem: row.mapping_source === "manual" ? "Manual" : row.mapping_source === "omie" ? "Omie" : "Unmapped",
        Valor: formatBRL(num(row.amount)),
      })),
    alerts: [],
    dreHierarchy: [...hierarchyMap.values()],
  };
}

async function commercial(period: Period): Promise<ManagementPageData> {
  const prevPeriod = previousPeriod(period);
  const [summaries, prevSummaries, bySource, pipeline, abc, sellers, orders, customersCount] = await Promise.all([
    periodFn("sales_summary_period", period),
    periodFn("sales_summary_period", prevPeriod),
    periodFn("sales_summary_by_source_period", period),
    periodFn("sales_pipeline_period", period),
    periodFn("customer_abc_period", period),
    periodFn("sales_by_seller_period", period),
    view("sales", { column: "forecast_date", from: period.from, to: period.to }),
    scalarFn("sales_customers_period", period),
  ]);
  const s = summaries[0] ?? {};
  const prevS = prevSummaries[0] ?? null;
  const mercadoria = bySource.find((row) => row.source === "sales_order") ?? {};
  const servico = bySource.find((row) => row.source === "service_order") ?? {};
  const totalValue = num(s.total_value);
  const mercadoriaValue = num(mercadoria.total_value);
  const servicoValue = num(servico.total_value);

  return {
    metrics: [
      metricWithDelta("Vendas totais", totalValue, prevS ? num(prevS.total_value) : null, prevPeriod.label, period.label),
      metric("Faturado", s.invoiced_value, period.label, "positive"),
      metric("A faturar", s.to_invoice_value, period.label),
      metric("Ticket médio", s.average_value, period.label),
      metric("Melhor vendedor", [...sellers].sort((a, b) => num(b.total_value) - num(a.total_value))[0]?.total_value ?? 0, txt([...sellers].sort((a, b) => num(b.total_value) - num(a.total_value))[0]?.seller_name) ?? undefined),
      { label: "Clientes atendidos", value: formatInteger(customersCount), detail: period.label },
      metric("Mercadorias", mercadoriaValue, `${formatInteger(num(mercadoria.sale_count))} pedidos · ${totalValue > 0 ? ((mercadoriaValue / totalValue) * 100).toFixed(1) : "0"}% do total`),
      metric("Serviços", servicoValue, `${formatInteger(num(servico.sale_count))} OS · ${totalValue > 0 ? ((servicoValue / totalValue) * 100).toFixed(1) : "0"}% do total`),
    ],
    chart: pipeline.map((row) => ({ label: txt(row.stage_classification) ?? `Etapa ${txt(row.stage_code) ?? "—"}`, primary: num(row.total_value), secondary: num(row.sale_count) })),
    secondaryChart: sellers
      .slice()
      .sort((a, b) => num(a.sales_rank) - num(b.sales_rank))
      .slice(0, 10)
      .map((row) => ({ label: txt(row.seller_name) ?? "Sem vendedor", primary: num(row.total_value) })),
    rows: abc.slice(0, 30).map((row) => ({
      Cliente: txt(row.customer_name) ?? "Sem cliente",
      Valor: formatBRL(num(row.total_value)),
      "% total": `${num(row.share_percent).toFixed(1)}%`,
      "% acumulado": `${num(row.cumulative_percent).toFixed(1)}%`,
      Classe: txt(row.abc_class),
    })),
    secondaryRows: orders
      .slice()
      .sort((a, b) => String(b.forecast_date ?? "").localeCompare(String(a.forecast_date ?? "")))
      .slice(0, 30)
      .map((row) => ({
        Registro: txt(row.display_number) ?? txt(row.omie_id) ?? "—",
        Tipo: row.source === "sales_order" ? "Mercadoria" : "Serviço",
        Cliente: txt(row.customer_name) ?? "Sem cliente",
        Vendedor: txt(row.seller_name) ?? "Sem vendedor",
        Etapa: txt(row.stage_classification) ?? txt(row.stage_code) ?? "—",
        Valor: formatBRL(num(row.total_value)),
        Situação: row.billing_status === "invoiced" ? "Faturado" : row.billing_status === "to_invoice" ? "A faturar" : "Indefinido",
      })),
    alerts: [],
    composition: [
      { label: "Mercadorias", value: mercadoriaValue, percent: totalValue > 0 ? (mercadoriaValue / totalValue) * 100 : 0, count: num(mercadoria.sale_count), color: "#176b46" },
      { label: "Serviços", value: servicoValue, percent: totalValue > 0 ? (servicoValue / totalValue) * 100 : 0, count: num(servico.sale_count), color: "#d8a33c" },
    ],
    sellerRanking: sellers
      .slice()
      .sort((a, b) => num(a.sales_rank) - num(b.sales_rank))
      .slice(0, 15)
      .map((row, index) => ({
        sellerId: num(row.seller_id),
        position: index + 1,
        sellerName: txt(row.seller_name) ?? "Sem vendedor",
        value: num(row.total_value),
        count: num(row.sale_count),
        averageTicket: num(row.average_value),
        participationPercent: totalValue > 0 ? (num(row.total_value) / totalValue) * 100 : 0,
      })),
    customerRanking: abc.slice(0, 30).map((row) => ({
      customerId: num(row.customer_id),
      customerName: txt(row.customer_name) ?? "Sem cliente",
      value: num(row.total_value),
      sharePercent: num(row.share_percent),
      cumulativePercent: num(row.cumulative_percent),
      abcClass: txt(row.abc_class) ?? "—",
    })),
  };
}

export async function getManagementPageData(page: string, period: Period) {
  if (page === "executive" || page === "alerts") return executive(period);
  if (page === "financial") return financial(period);
  if (page === "cash") return cash();
  if (page === "dre") return dre(period);
  if (page === "commercial") return commercial(period);
  return { metrics: [], chart: [], rows: [], alerts: [] } satisfies ManagementPageData;
}
