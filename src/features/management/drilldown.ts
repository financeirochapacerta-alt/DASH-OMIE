"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireManagementAccess } from "./access";
import type { Period } from "./period";

const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0);
const txt = (v: unknown) => (typeof v === "string" ? v : null);

export type FinancialDrilldownRow = {
  id: number;
  customerName: string | null;
  documentNumber: string | null;
  dueDate: string | null;
  value: number;
  status: string | null;
  categoryName: string | null;
  bankAccountDescription: string | null;
  sellerName: string | null;
  daysToDue: number | null;
};

export type FinancialDrilldownKind = "receivable" | "payable" | "overdue_receivable" | "overdue_payable";

const FINANCIAL_VIEW: Record<FinancialDrilldownKind, string> = {
  receivable: "open_receivables",
  payable: "open_payables",
  overdue_receivable: "overdue_receivables",
  overdue_payable: "overdue_payables",
};

// Reads the exact same view the corresponding KPI sums (open_receivables/open_payables/
// overdue_receivables/overdue_payables) — nothing here is a separately-written query with
// different semantics, so sum(rows) always equals the KPI by construction.
export async function getFinancialDrilldown(kind: FinancialDrilldownKind) {
  await requireManagementAccess("financial");
  const supabase = await createClient();
  const result = await supabase.schema("analytics").from(FINANCIAL_VIEW[kind] as never).select("*");
  if (result.error) throw new Error("Não foi possível consultar o detalhamento.");
  const rows: FinancialDrilldownRow[] = (result.data ?? []).map((row: Record<string, unknown>) => ({
    id: num(row.id),
    customerName: txt(row.customer_name),
    documentNumber: txt(row.document_number) ?? txt(row.omie_id),
    dueDate: txt(row.due_date),
    value: Math.abs(num(row.signed_value)),
    status: txt(row.status),
    categoryName: txt(row.category_name),
    bankAccountDescription: txt(row.bank_account_description),
    sellerName: txt(row.seller_name),
    daysToDue: typeof row.days_to_due === "number" ? row.days_to_due : row.days_to_due !== null && row.days_to_due !== undefined ? Number(row.days_to_due) : null,
  }));
  // Vencidos mais antigos primeiro (menor days_to_due = mais negativo = mais atrasado),
  // depois próximos vencimentos.
  rows.sort((a, b) => (a.daysToDue ?? 0) - (b.daysToDue ?? 0));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return { rows, total, count: rows.length, average: rows.length ? total / rows.length : 0 };
}

export type AgingBucket = { bucket: string; bucketOrder: number; titleCount: number; totalValue: number };

export async function getReceivablesAging(): Promise<AgingBucket[]> {
  await requireManagementAccess("financial");
  const supabase = await createClient();
  const result = await supabase.schema("analytics").rpc("receivables_aging" as never);
  if (result.error) throw new Error("Não foi possível consultar o aging de recebíveis.");
  return ((result.data ?? []) as Record<string, unknown>[])
    .map((row) => ({ bucket: String(row.bucket), bucketOrder: num(row.bucket_order), titleCount: num(row.title_count), totalValue: num(row.total_value) }))
    .sort((a, b) => a.bucketOrder - b.bucketOrder);
}

export async function getPayablesAging(): Promise<AgingBucket[]> {
  await requireManagementAccess("financial");
  const supabase = await createClient();
  const result = await supabase.schema("analytics").rpc("payables_aging" as never);
  if (result.error) throw new Error("Não foi possível consultar o aging de pagáveis.");
  return ((result.data ?? []) as Record<string, unknown>[])
    .map((row) => ({ bucket: String(row.bucket), bucketOrder: num(row.bucket_order), titleCount: num(row.title_count), totalValue: num(row.total_value) }))
    .sort((a, b) => a.bucketOrder - b.bucketOrder);
}

export type CommercialDrilldownKind = "total" | "mercadoria" | "servico" | "faturado" | "a_faturar";

export type CommercialDrilldownRow = {
  registro: string;
  tipo: "Mercadoria" | "Serviço";
  cliente: string | null;
  vendedor: string | null;
  data: string | null;
  etapa: string | null;
  faturado: boolean;
  valor: number;
  contrato: string | null;
};

// Reads analytics.sales filtered by period + the same source/billing_status distinction the
// KPI cards use — the real domain distinction (sales_orders vs service_orders), nothing
// inferred from text.
export async function getCommercialDrilldown(kind: CommercialDrilldownKind, period: Period) {
  await requireManagementAccess("analytics_commercial");
  const supabase = await createClient();
  let query = supabase.schema("analytics").from("sales" as never).select("*").gte("forecast_date", period.from).lte("forecast_date", period.to);
  if (kind === "mercadoria") query = query.eq("source", "sales_order");
  if (kind === "servico") query = query.eq("source", "service_order");
  if (kind === "faturado") query = query.eq("billing_status", "invoiced");
  if (kind === "a_faturar") query = query.eq("billing_status", "to_invoice");
  const result = await query;
  if (result.error) throw new Error("Não foi possível consultar o detalhamento comercial.");
  const rows: CommercialDrilldownRow[] = (result.data ?? []).map((row: Record<string, unknown>) => ({
    registro: txt(row.display_number) ?? txt(row.omie_id) ?? "—",
    tipo: row.source === "sales_order" ? "Mercadoria" : "Serviço",
    cliente: txt(row.customer_name),
    vendedor: txt(row.seller_name),
    data: txt(row.forecast_date),
    etapa: txt(row.stage_classification) ?? txt(row.stage_code),
    faturado: row.billing_status === "invoiced",
    valor: num(row.total_value),
    contrato: txt(row.contract_number),
  }));
  rows.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
  const total = rows.reduce((sum, row) => sum + row.valor, 0);
  return { rows, total, count: rows.length };
}

// Same analytics.sales source, filtered by a specific seller or customer instead of
// mercadoria/serviço/faturamento — powers the vendedor/cliente drill-down (click a row in the
// ranking or Curva ABC to see exactly which pedidos/OS make up their total).
export async function getCommercialDrilldownByParty(party: "seller" | "customer", id: number, period: Period) {
  await requireManagementAccess("analytics_commercial");
  const supabase = await createClient();
  const column = party === "seller" ? "seller_id" : "customer_id";
  const result = await supabase
    .schema("analytics")
    .from("sales" as never)
    .select("*")
    .eq(column, id)
    .gte("forecast_date", period.from)
    .lte("forecast_date", period.to);
  if (result.error) throw new Error("Não foi possível consultar o detalhamento comercial.");
  const rows: CommercialDrilldownRow[] = (result.data ?? []).map((row: Record<string, unknown>) => ({
    registro: txt(row.display_number) ?? txt(row.omie_id) ?? "—",
    tipo: row.source === "sales_order" ? "Mercadoria" : "Serviço",
    cliente: txt(row.customer_name),
    vendedor: txt(row.seller_name),
    data: txt(row.forecast_date),
    etapa: txt(row.stage_classification) ?? txt(row.stage_code),
    faturado: row.billing_status === "invoiced",
    valor: num(row.total_value),
    contrato: txt(row.contract_number),
  }));
  rows.sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""));
  const total = rows.reduce((sum, row) => sum + row.valor, 0);
  return { rows, total, count: rows.length };
}
