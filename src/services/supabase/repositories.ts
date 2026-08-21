import "server-only";

import type { NormalizedRepository, RawRecordRepository, SyncErrorRecord, SyncErrorRepository, SyncStateRepository } from "@/services/omie/reference-data/sync";
import type { RawOmieRecord, ReferenceEntity, SyncSummary, UpsertResult } from "@/services/omie/reference-data/types";
import type { SalesOrderEnrichmentRepository } from "@/services/omie/commercial/enrichment";
import type { SalesOrderEnrichment, SalesOrderInstallmentRecord } from "@/services/omie/commercial/types";
import type {
  FinancialRelationIds,
  FinancialRelationshipResolver,
  FinancialTitleDto,
} from "@/services/omie/financial/types";
import { SupabaseExecutor, type OperationalExecutor } from "./executor";

type NormalizedRecord = { omieId: string } & Record<string, unknown>;
export class SupabaseRawRecordRepository implements RawRecordRepository {
  constructor(private readonly db:OperationalExecutor = new SupabaseExecutor()) {}
  async store(record: RawOmieRecord) { await this.db.rpc("operational_store_raw",{payload:{ entity_type: record.entityType, omie_id: record.omieId, raw_json: record.rawJson, payload_hash: record.payloadHash, source: record.source, fetched_at: record.fetchedAt, sync_run_id: record.syncRunId ?? null }}); }
}

export class SupabaseNormalizedRepository<T extends NormalizedRecord> implements NormalizedRepository<T> {
  constructor(private readonly table: string, private readonly toRow: (record: T) => Record<string, unknown>, private readonly db:OperationalExecutor = new SupabaseExecutor()) {}
  async upsert(record: T, payloadHash: string): Promise<UpsertResult> {
    const current = await this.db.find("public", this.table, "omie_id", record.omieId);
    if (current?.source_payload_hash === payloadHash) return "unchanged";
    await this.db.upsert("public", this.table, { ...this.toRow(record), omie_id: record.omieId, source_payload_hash: payloadHash, last_synced_at: new Date().toISOString() }, "omie_id");
    return current ? "updated" : "inserted";
  }
}

export class SupabaseSyncErrorRepository implements SyncErrorRepository {
  constructor(private readonly db:OperationalExecutor = new SupabaseExecutor()) {}
  async store(error: SyncErrorRecord) { if (!error.syncRunId) throw new Error("syncRunId is required for operational error logging"); await this.db.rpc("operational_log_sync_error",{payload:{ sync_run_id: error.syncRunId, entity_type: error.entityType, omie_id: error.omieId, error_message: error.message }}); }
}
export class SupabaseSyncStateRepository implements SyncStateRepository {
  constructor(private readonly db:OperationalExecutor = new SupabaseExecutor()) {}
  async complete(entityType: ReferenceEntity, summary: SyncSummary, syncRunId?: string) { if(!syncRunId)throw new Error("syncRunId is required for operational state");await this.db.rpc("operational_complete_sync_state",{entity:entityType,run_id:syncRunId,summary}); }
}

export class SupabaseSyncRunRepository {
  constructor(private readonly db:OperationalExecutor = new SupabaseExecutor()) {}
  async start(entityType: ReferenceEntity, syncType: "full" | "incremental" | "reconciliation" = "full") { return String(await this.db.rpc("operational_start_sync",{entity:entityType,sync_kind:syncType})); }
  async finish(runId: string, summary: SyncSummary) { await this.db.rpc("operational_finish_sync",{run_id:runId,summary}); }
}
export class SupabaseSyncLockRepository {
  constructor(private readonly db:OperationalExecutor = new SupabaseExecutor()) {}
  async acquire(entityType: ReferenceEntity, runId: string, ttlMinutes = 30) { await this.db.rpc("operational_acquire_sync_lock",{entity:entityType,run_id:runId,ttl_minutes:ttlMinutes}); }
  async release(entityType: ReferenceEntity) { await this.db.rpc("operational_release_sync_lock",{entity:entityType}); }
}

export class SupabaseFinancialRelationshipResolver implements FinancialRelationshipResolver {
  constructor(private readonly db: OperationalExecutor = new SupabaseExecutor()) {}
  private async lookupId(table: string, omieCode: unknown): Promise<string | null> {
    if (omieCode === undefined || omieCode === null || omieCode === "") return null;
    const row = await this.db.find("public", table, "omie_id", String(omieCode));
    return row ? String(row.id) : null;
  }
  async resolve(dto: FinancialTitleDto): Promise<FinancialRelationIds> {
    const [customerId, sellerId, categoryId, bankAccountId] = await Promise.all([
      this.lookupId("customers", dto.codigo_cliente_fornecedor),
      this.lookupId("sellers", dto.codigo_vendedor),
      this.lookupId("categories", dto.codigo_categoria),
      this.lookupId("bank_accounts", dto.id_conta_corrente),
    ]);
    return { customerId, sellerId, categoryId, bankAccountId };
  }
}

export class SupabaseSalesOrderEnrichmentRepository implements SalesOrderEnrichmentRepository {
  constructor(private readonly db:OperationalExecutor = new SupabaseExecutor()) {}
  async apply(omieId: string, enrichment: SalesOrderEnrichment, installments: readonly SalesOrderInstallmentRecord[]) {
    const order = await this.db.find("public", "sales_orders", "omie_id", omieId); if (!order?.id) throw new Error("Sales order not found for enrichment");
    await this.db.update("public", "sales_orders", "omie_id", omieId, { is_cancelled: enrichment.isCancelled, cancelled_at: enrichment.cancelledAt, invoice_date: enrichment.invoiceDate, real_due_date: enrichment.realDueDate, enrichment_status: "enriched", enriched_at: new Date().toISOString() });
    await this.db.delete("public", "sales_order_installments", "sales_order_id", order.id);
    for (const item of installments) await this.db.insert("public", "sales_order_installments", { sales_order_id: order.id, installment_number: item.installmentNumber, due_date: item.dueDate, amount: item.amount, omie_reference: item.omieReference });
  }
}
