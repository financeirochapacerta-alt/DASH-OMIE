import "server-only";

import { hashPayload } from "../reference-data/hash";
import type { RawRecordRepository } from "../reference-data/sync";
import type { OmieRequester } from "../reference-data/types";
import { normalizeSalesOrderEnrichment } from "./normalize";
import type { SalesOrderDto, SalesOrderEnrichment, SalesOrderInstallmentRecord } from "./types";

export type EnrichmentJob = { omieId: string; status: "pending" | "processing" | "completed" | "failed"; error?: string };

export class SalesOrderEnrichmentQueue {
  private readonly jobs = new Map<string, EnrichmentJob>();
  enqueue(omieId: string) {
    const current = this.jobs.get(omieId);
    if (!current || current.status === "failed") this.jobs.set(omieId, { omieId, status: "pending" });
    return this.jobs.get(omieId)!;
  }
  claim() {
    const job = [...this.jobs.values()].find((item) => item.status === "pending");
    if (job) job.status = "processing";
    return job;
  }
  complete(omieId: string) { const job = this.jobs.get(omieId); if (job) job.status = "completed"; }
  fail(omieId: string, error: unknown) { const job = this.jobs.get(omieId); if (job) { job.status = "failed"; job.error = error instanceof Error ? error.message : "Unknown enrichment error"; } }
  get(omieId: string) { return this.jobs.get(omieId); }
}

export type SalesOrderEnrichmentRepository = {
  apply(omieId: string, enrichment: SalesOrderEnrichment, installments: readonly SalesOrderInstallmentRecord[]): Promise<void>;
};

export async function processNextSalesOrderEnrichment(options: {
  queue: SalesOrderEnrichmentQueue; client: OmieRequester; rawRepository: RawRecordRepository;
  repository: SalesOrderEnrichmentRepository; now?: () => Date;
}) {
  const job = options.queue.claim();
  if (!job) return null;
  try {
    // Confirmed with real payloads (Onda 3, 2026-08-21): ConsultarPedido wraps the order
    // under pedido_venda_produto, unlike ListarPedidos which returns order objects directly.
    const response = await options.client.request<{ pedido_venda_produto: SalesOrderDto }, { codigo_pedido: string }>({
      endpoint: "produtos/pedido", call: "ConsultarPedido", param: [{ codigo_pedido: job.omieId }],
    });
    await options.rawRepository.store({ entityType: "sales_order_details", omieId: job.omieId,
      rawJson: response, payloadHash: hashPayload(response), source: "omie_api",
      fetchedAt: (options.now ?? (() => new Date()))().toISOString() });
    const detail = response.pedido_venda_produto;
    const normalized = normalizeSalesOrderEnrichment(detail);
    await options.repository.apply(job.omieId, normalized.enrichment, normalized.installments);
    options.queue.complete(job.omieId);
  } catch (error) { options.queue.fail(job.omieId, error); }
  return options.queue.get(job.omieId)!;
}
