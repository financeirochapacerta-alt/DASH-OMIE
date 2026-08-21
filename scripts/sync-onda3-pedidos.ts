import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(__dirname, "..", ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (value && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvLocal();

import { createOmieClient } from "@/services/omie/client";
import { syncSalesOrders, syncServiceOrders } from "@/services/omie/commercial/sync";
import type { SalesOrderRecord, ServiceOrderRecord } from "@/services/omie/commercial/types";
import type { ReferenceEntity, SyncSummary } from "@/services/omie/reference-data/types";
import { SupabaseExecutor } from "@/services/supabase/executor";
import {
  SupabaseCommercialResolver,
  SupabaseNormalizedRepository,
  SupabaseRawRecordRepository,
  SupabaseSalesOrderNormalizedRepository,
  SupabaseSyncErrorRepository,
  SupabaseSyncLockRepository,
  SupabaseSyncRunRepository,
  SupabaseSyncStateRepository,
} from "@/services/supabase/repositories";

const salesOrderRow = (r: SalesOrderRecord) => ({
  display_number: r.displayNumber,
  customer_id: r.customerId,
  seller_id: r.sellerId,
  contract_number: r.contractNumber,
  forecast_date: r.forecastDate,
  stage_code: r.stageCode,
  stage_classification: r.stageClassification,
  total_value: r.totalValue,
  is_cancelled: r.isCancelled,
  cancelled_at: r.cancelledAt,
  invoice_date: r.invoiceDate,
  real_due_date: r.realDueDate,
  enrichment_status: r.enrichmentStatus,
  ...(r.enrichmentStatus === "enriched" ? { enriched_at: new Date().toISOString() } : {}),
});

const serviceOrderRow = (r: ServiceOrderRecord) => ({
  display_number: r.displayNumber,
  customer_id: r.customerId,
  seller_id: r.sellerId,
  contract_number: r.contractNumber,
  forecast_date: r.forecastDate,
  stage_code: r.stageCode,
  stage_classification: r.stageClassification,
  total_value: r.totalValue,
  inclusion_date: r.inclusionDate,
  invoice_date: r.invoiceDate,
  is_cancelled: r.isCancelled,
  real_due_date: r.realDueDate,
});

async function main() {
  const db = new SupabaseExecutor();
  const client = createOmieClient();
  const resolver = new SupabaseCommercialResolver(db);
  const rawRepository = new SupabaseRawRecordRepository(db);
  const errorRepository = new SupabaseSyncErrorRepository(db);
  const stateRepository = new SupabaseSyncStateRepository(db);
  const runRepository = new SupabaseSyncRunRepository(db);
  const lockRepository = new SupabaseSyncLockRepository(db);

  const jobs: { entityType: ReferenceEntity; run: (syncRunId: string) => Promise<SyncSummary> }[] = [
    {
      entityType: "sales_orders",
      run: (syncRunId) =>
        syncSalesOrders({
          client,
          resolver,
          rawRepository,
          normalizedRepository: new SupabaseSalesOrderNormalizedRepository(salesOrderRow, db),
          errorRepository,
          stateRepository,
          syncRunId,
        }),
    },
    {
      entityType: "service_orders",
      run: (syncRunId) =>
        syncServiceOrders({
          client,
          resolver,
          rawRepository,
          normalizedRepository: new SupabaseNormalizedRepository("service_orders", serviceOrderRow, db),
          errorRepository,
          stateRepository,
          syncRunId,
        }),
    },
  ];

  const results: Record<string, SyncSummary> = {};
  for (const job of jobs) {
    const syncRunId = await runRepository.start(job.entityType, "full");
    await lockRepository.acquire(job.entityType, syncRunId);
    try {
      const summary = await job.run(syncRunId);
      await runRepository.finish(syncRunId, summary);
      results[job.entityType] = summary;
    } finally {
      await lockRepository.release(job.entityType);
    }
  }

  console.table(results);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
