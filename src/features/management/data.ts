import "server-only";

import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, formatInteger } from "./format";
import { generateManagementAlerts, type ManagementAlert } from "./rules";

export type Metric = { label: string; value: string; detail?: string; tone?: "positive" | "warning" | "negative" | "neutral" };
export type ChartPoint = { label: string; primary: number; secondary?: number };
export type ManagementPageData = {
  metrics: Metric[];
  chart: ChartPoint[];
  secondaryChart?: ChartPoint[];
  rows: Record<string, string | number | null>[];
  secondaryRows?: Record<string, string | number | null>[];
  alerts: { title: string; detail: string; priority: "critical" | "warning" | "info" }[];
  accounts?: { description: string; balance: number; hasKnownBalanceDate: boolean }[];
};

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0);
const txt = (v: unknown) => (typeof v === "string" ? v : null);
const bool = (v: unknown) => v === true;

// name is resolved at each call site from a fixed set of view names, not user input; the cast
// only widens Supabase's generated literal-union type back to string for this shared helper.
async function view(name: string) {
  const client = await createClient();
  const result = await client.schema("analytics").from(name as never).select("*");
  if (result.error) throw new Error("Não foi possível consultar os dados gerenciais.");
  return (result.data ?? []) as Record<string, unknown>[];
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

const metric = (label: string, value: unknown, detail?: string, tone: Metric["tone"] = "neutral"): Metric => ({
  label,
  value: formatBRL(num(value)),
  detail,
  tone,
});
const totalAbs = (rows: Record<string, unknown>[]) => rows.reduce((sum, row) => sum + Math.abs(num(row.signed_value)), 0);
const currentMonthStart = () => `${new Date().toISOString().slice(0, 7)}-01`;
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

async function executive(): Promise<ManagementPageData> {
  const [
    sales,
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
    view("sales_summary"),
    view("cash_current_balance"),
    view("cash_projection_summary"),
    view("dre_monthly"),
    view("open_receivables"),
    view("open_payables"),
    view("overdue_receivables"),
    view("overdue_payables"),
    view("cash_projection_daily"),
    view("sales_by_seller"),
    settingValue("high_overdue_amount_threshold"),
  ]);

  const s = sales[0] ?? {};
  const c = cash[0] ?? {};
  const p = projection[0] ?? {};
  const monthRows = dreMonthly.filter((row) => row.month === currentMonthStart());
  const resultadoMes = monthRows.reduce((sum, row) => sum + num(row.amount), 0);
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
      metric("Vendas (comercial)", s.total_value, "Pedidos e OS não cancelados"),
      metric("Faturado", s.invoiced_value, undefined, "positive"),
      metric("A faturar", s.to_invoice_value),
      metric("A receber", totalAbs(receivables)),
      metric("Vencido (total)", overdueTotal, "Receber + pagar", overdueTotal > 0 ? "warning" : "positive"),
      metric("A pagar", totalAbs(payables)),
      metric("Saldo atual", c.current_balance, undefined, num(c.current_balance) < 0 ? "negative" : "positive"),
      metric("Projeção de caixa", horizonClose?.closing_balance, `Ao fim do horizonte (${formatDate(txt(horizonClose?.projection_date))})`),
      {
        label: "Caixa fica crítico em",
        value: txt(p.first_negative_cash_date) ? formatDate(txt(p.first_negative_cash_date)) : "Sem previsão",
        detail: txt(p.first_negative_cash_date) ? "Data projetada do primeiro saldo negativo" : "Nenhum saldo negativo no horizonte atual",
        tone: txt(p.first_negative_cash_date) ? "negative" : "positive",
      },
      metric("Resultado gerencial (mês)", resultadoMes, "DRE por vencimento", resultadoMes >= 0 ? "positive" : "negative"),
      {
        label: "Melhor vendedor",
        value: topSeller ? formatBRL(num(topSeller.total_value)) : "—",
        detail: txt(topSeller?.seller_name) ?? "Sem dados no período",
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
  };
}

async function financial(): Promise<ManagementPageData> {
  const [r, p, or, op, m, realized] = await Promise.all([
    view("open_receivables"),
    view("open_payables"),
    view("overdue_receivables"),
    view("overdue_payables"),
    view("financial_movements"),
    view("cash_realized_monthly"),
  ]);
  return {
    metrics: [
      metric("A receber", totalAbs(r)),
      metric("A pagar", totalAbs(p)),
      metric("Recebíveis vencidos", totalAbs(or), undefined, "warning"),
      metric("Pagáveis vencidos", totalAbs(op), undefined, "warning"),
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
  };
}

async function cash(): Promise<ManagementPageData> {
  const [balance, summary, daily, accountBalances] = await Promise.all([
    view("cash_current_balance"),
    view("cash_projection_summary"),
    view("cash_projection_daily"),
    view("cash_account_balances"),
  ]);
  const b = balance[0] ?? {};
  const s = summary[0] ?? {};
  return {
    metrics: [
      metric("Saldo atual", b.current_balance, undefined, num(b.current_balance) < 0 ? "negative" : "positive"),
      metric("Entradas previstas", s.projected_inflows),
      metric("Saídas previstas", Math.abs(num(s.projected_outflows))),
      metric("Caixa mínimo", s.minimum_cash),
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
    })),
  };
}

async function dre(): Promise<ManagementPageData> {
  const rows = await view("dre_monthly");
  const unmapped = rows.filter((row) => row.mapping_status === "unmapped");
  const total = rows.reduce((sum, row) => sum + num(row.amount), 0);
  return {
    metrics: [
      metric("Resultado gerencial (todo o período)", total, undefined, total >= 0 ? "positive" : "negative"),
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
  };
}

async function commercial(): Promise<ManagementPageData> {
  const [summaries, pipeline, abc, sellers, orders] = await Promise.all([
    view("sales_summary"),
    view("sales_pipeline"),
    view("customer_abc"),
    view("sales_by_seller"),
    view("sales"),
  ]);
  const s = summaries[0] ?? {};
  return {
    metrics: [
      metric("Vendas", s.total_value),
      metric("Faturado", s.invoiced_value, undefined, "positive"),
      metric("A faturar", s.to_invoice_value),
      metric("Ticket médio", s.average_value),
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
        Tipo: row.source === "sales_order" ? "Pedido" : "OS",
        Cliente: txt(row.customer_name) ?? "Sem cliente",
        Vendedor: txt(row.seller_name) ?? "Sem vendedor",
        Etapa: txt(row.stage_classification) ?? txt(row.stage_code) ?? "—",
        Valor: formatBRL(num(row.total_value)),
        Situação: row.billing_status === "invoiced" ? "Faturado" : row.billing_status === "to_invoice" ? "A faturar" : "Indefinido",
      })),
    alerts: [],
  };
}

export async function getManagementPageData(page: string) {
  if (page === "executive" || page === "alerts") return executive();
  if (page === "financial") return financial();
  if (page === "cash") return cash();
  if (page === "dre") return dre();
  if (page === "commercial") return commercial();
  return { metrics: [], chart: [], rows: [], alerts: [] } satisfies ManagementPageData;
}
