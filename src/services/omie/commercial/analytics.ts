import "server-only";

import { sumDecimals } from "../financial/decimal";

export type CommercialSale = {
  source: "sales_order" | "service_order"; id: string; customerId: string | null; sellerId: string | null;
  totalValue: string; isCancelled: boolean | null; invoiceDate: string | null; stageClassification: string | null;
};
export type BillingStatus = "invoiced" | "to_invoice" | "unknown";

const PRE_INVOICE: Record<CommercialSale["source"], ReadonlySet<string>> = {
  sales_order: new Set(["pedido de venda", "em produção", "faturar"]),
  service_order: new Set(["ordem de serviço", "em execução", "executado", "faturar"]),
};
export function billingStatus(sale: CommercialSale): BillingStatus {
  const stage = sale.stageClassification?.trim().toLocaleLowerCase("pt-BR") ?? "";
  if (sale.invoiceDate || stage === "faturado") return "invoiced";
  return PRE_INVOICE[sale.source].has(stage) ? "to_invoice" : "unknown";
}
export function eligibleCommercialSales(sales: readonly CommercialSale[]) {
  return sales.filter((sale) => sale.source === "service_order" || sale.isCancelled === false);
}
export function commercialSummary(sales: readonly CommercialSale[]) {
  const eligible = eligibleCommercialSales(sales);
  const total = sumDecimals(eligible.map((sale) => sale.totalValue));
  return { count: eligible.length, total, average: eligible.length ? Number(total) / eligible.length : 0,
    invoiced: sumDecimals(eligible.filter((s) => billingStatus(s) === "invoiced").map((s) => s.totalValue)),
    toInvoice: sumDecimals(eligible.filter((s) => billingStatus(s) === "to_invoice").map((s) => s.totalValue)) };
}
export function rankBy(sales: readonly CommercialSale[], key: "sellerId" | "customerId") {
  const totals = new Map<string, string[]>();
  for (const sale of eligibleCommercialSales(sales)) {
    const id = sale[key]; if (id) totals.set(id, [...(totals.get(id) ?? []), sale.totalValue]);
  }
  return [...totals].map(([id, values]) => ({ id, total: sumDecimals(values) }))
    .sort((a, b) => Number(b.total) - Number(a.total) || a.id.localeCompare(b.id))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
export function customerAbc(sales: readonly CommercialSale[]) {
  const ranked = rankBy(sales, "customerId"); const grand = ranked.reduce((sum, item) => sum + Number(item.total), 0); let cumulative = 0;
  return ranked.map((item) => { const share = grand ? Number(item.total) / grand * 100 : 0; cumulative += share;
    return { ...item, share, cumulative, class: cumulative <= 80 ? "A" : cumulative <= 95 ? "B" : "C" }; });
}
