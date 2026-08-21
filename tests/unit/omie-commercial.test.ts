import { describe, expect, it, vi } from "vitest";
import { billingStatus, commercialSummary, customerAbc, normalizeInstallments,
  normalizeSalesOrder, normalizeSalesOrderEnrichment, normalizeServiceOrder,
  processNextSalesOrderEnrichment, SalesOrderEnrichmentQueue } from "@/services/omie/commercial";

const relations = { customerId: null, sellerId: null };
const order = (overrides = {}) => ({ cabecalho: { codigo_pedido: 123, numero_pedido: "PV-9", data_previsao: "09/07/2026", etapa: "10" },
  informacoes_adicionais: {}, det: [{ produto: { valor_mercadoria: "10.10" } }, { produto: { valor_mercadoria: "20.20" } }], ...overrides });

describe("Omie commercial core", () => {
  it("uses internal order id, sums item totals exactly and tolerates missing relations", () => {
    expect(normalizeSalesOrder(order(), relations, "Pedido de Venda")).toMatchObject({ omieId: "123", displayNumber: "PV-9", totalValue: "30.3", customerId: null, sellerId: null, isCancelled: null, enrichmentStatus: "pending" });
  });
  it("sorts and deduplicates installments and separates forecast from real due date", () => {
    const detail = order({ infoCadastro: { cancelado: "N" }, lista_parcelas: { parcela: [
      { numero_parcela: "2", data_vencimento: "06/09/2026", valor: "15.15" },
      { numero_parcela: "1", data_vencimento: "06/08/2026", valor: "15.15" },
      { numero_parcela: "1", data_vencimento: "06/08/2026", valor: "15.15" }] } });
    const result = normalizeSalesOrderEnrichment(detail);
    expect(result.installments).toHaveLength(2); expect(result.enrichment.realDueDate).toBe("2026-08-06");
    expect(normalizeSalesOrder(detail, relations, null).forecastDate).toBe("2026-07-09");
  });
  it("resolves cancellation, installments, real due date and invoice date directly from ListarPedidos, without ConsultarPedido", () => {
    const normal = order({ infoCadastro: { cancelado: "N" }, lista_parcelas: { parcela: [{ numero_parcela: "1", data_vencimento: "10/08/2026", valor: "30.30" }] } });
    expect(normalizeSalesOrder(normal, relations, null)).toMatchObject({
      isCancelled: false, cancelledAt: null, realDueDate: "2026-08-10", invoiceDate: null, enrichmentStatus: "enriched",
      installments: [{ installmentNumber: "1", dueDate: "2026-08-10", amount: "30.30", omieReference: null }],
    });

    const faturado = order({ infoCadastro: { cancelado: "N", faturado: "S", dFat: "11/08/2026" }, lista_parcelas: { parcela: [] } });
    expect(normalizeSalesOrder(faturado, relations, null)).toMatchObject({ invoiceDate: "2026-08-11", isCancelled: false });

    const cancelled = order({ infoCadastro: { cancelado: "S", dCan: "12/08/2026", hCan: "09:00:00" }, lista_parcelas: { parcela: [] } });
    expect(normalizeSalesOrder(cancelled, relations, null)).toMatchObject({ isCancelled: true, cancelledAt: "2026-08-12T09:00:00", realDueDate: null });

    const noInfoCadastro = order();
    expect(normalizeSalesOrder(noInfoCadastro, relations, null)).toMatchObject({ isCancelled: null, enrichmentStatus: "pending", installments: [] });
  });
  it("rejects invalid and conflicting installments", () => {
    expect(() => normalizeInstallments([{ numero_parcela: 1 }])).toThrow("due date");
    expect(() => normalizeInstallments([{ numero_parcela: 1, data_vencimento: "01/01/2026" }, { numero_parcela: 1, data_vencimento: "02/01/2026" }])).toThrow("Conflicting");
  });
  it("reads OS cancellation from InfoCadastro.cCancelada but keeps real due date unknown", () => {
    expect(normalizeServiceOrder({ Cabecalho: { nCodOS: 77, cNumOS: "OS-7", nValorTotal: "50" }, InfoCadastro: { cCancelada: "S" } }, relations, null)).toMatchObject({ omieId: "77", displayNumber: "OS-7", isCancelled: true, realDueDate: null });
    expect(normalizeServiceOrder({ Cabecalho: { nCodOS: 78, cNumOS: "OS-8", nValorTotal: "50" }, InfoCadastro: { cCancelada: "N" } }, relations, null)).toMatchObject({ isCancelled: false });
    expect(normalizeServiceOrder({ Cabecalho: { nCodOS: 79, cNumOS: "OS-9", nValorTotal: "50" } }, relations, null)).toMatchObject({ isCancelled: null });
  });
  it("excludes cancelled and unknown-cancellation orders from both sources", () => {
    const sales = [
      { source: "sales_order" as const, id: "1", customerId: "c", sellerId: "s", totalValue: "100", isCancelled: false, invoiceDate: "2026-01-01", stageClassification: null },
      { source: "sales_order" as const, id: "2", customerId: "c", sellerId: "s", totalValue: "999", isCancelled: true, invoiceDate: "2026-01-01", stageClassification: "Faturado" },
      { source: "sales_order" as const, id: "3", customerId: null, sellerId: null, totalValue: "888", isCancelled: null, invoiceDate: null, stageClassification: null },
      { source: "service_order" as const, id: "4", customerId: "d", sellerId: null, totalValue: "50", isCancelled: false, invoiceDate: null, stageClassification: "Faturar" },
      { source: "service_order" as const, id: "5", customerId: "d", sellerId: null, totalValue: "777", isCancelled: true, invoiceDate: null, stageClassification: "Faturar" }];
    expect(commercialSummary(sales)).toMatchObject({ count: 2, total: "150", invoiced: "100", toInvoice: "50" });
    expect(billingStatus(sales[3]!)).toBe("to_invoice"); expect(customerAbc(sales).map((x) => x.id)).toEqual(["c", "d"]);
  });
  it("enriches one queued order, preserves detailed RAW, and does not duplicate completed jobs", async () => {
    const queue = new SalesOrderEnrichmentQueue(); queue.enqueue("123"); queue.enqueue("123");
    const client = { request: vi.fn().mockResolvedValue({ pedido_venda_produto: order({ infoCadastro: { cancelado: "N", dFat: "10/08/2026" } }) }) };
    const rawRepository = { store: vi.fn() }; const repository = { apply: vi.fn() };
    expect((await processNextSalesOrderEnrichment({ queue, client, rawRepository, repository }))?.status).toBe("completed");
    expect(client.request).toHaveBeenCalledTimes(1); expect(rawRepository.store).toHaveBeenCalledWith(expect.objectContaining({ entityType: "sales_order_details" }));
    queue.enqueue("123"); expect(await processNextSalesOrderEnrichment({ queue, client, rawRepository, repository })).toBeNull();
  });
});
