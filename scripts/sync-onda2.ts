import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createOmieClient } from "@/services/omie/client";
import { syncPayables, syncReceivables } from "@/services/omie/financial/sync";
import type { FinancialTitleRecord } from "@/services/omie/financial/types";
import type { ReferenceEntity, SyncSummary } from "@/services/omie/reference-data/types";
import { SupabaseExecutor } from "@/services/supabase/executor";
import {
  SupabaseFinancialRelationshipResolver,
  SupabaseNormalizedRepository,
  SupabaseRawRecordRepository,
  SupabaseSyncErrorRepository,
  SupabaseSyncLockRepository,
  SupabaseSyncRunRepository,
  SupabaseSyncStateRepository,
} from "@/services/supabase/repositories";

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

// signed_value is a generated column; never written directly.
const financialRow = (r: FinancialTitleRecord) => ({
  customer_id: r.customerId,
  seller_id: r.sellerId,
  category_id: r.categoryId,
  bank_account_id: r.bankAccountId,
  due_date: r.dueDate,
  forecast_date: r.forecastDate,
  issue_date: r.issueDate,
  original_value: r.originalValue,
  status: r.status,
  document_number: r.documentNumber,
  installment_number: r.installmentNumber,
  is_settled: r.isSettled,
  is_cancelled: r.isCancelled,
});

async function main() {
  const db = new SupabaseExecutor();
  const client = createOmieClient();
  const relationshipResolver = new SupabaseFinancialRelationshipResolver(db);
  const rawRepository = new SupabaseRawRecordRepository(db);
  const errorRepository = new SupabaseSyncErrorRepository(db);
  const stateRepository = new SupabaseSyncStateRepository(db);
  const runRepository = new SupabaseSyncRunRepository(db);
  const lockRepository = new SupabaseSyncLockRepository(db);

  const jobs: { entityType: ReferenceEntity; run: (syncRunId: string) => Promise<SyncSummary> }[] = [
    {
      entityType: "accounts_receivable",
      run: (syncRunId) =>
        syncReceivables({
          client,
          relationshipResolver,
          rawRepository,
          normalizedRepository: new SupabaseNormalizedRepository("accounts_receivable", financialRow, db),
          errorRepository,
          stateRepository,
          syncRunId,
        }),
    },
    {
      entityType: "accounts_payable",
      run: (syncRunId) =>
        syncPayables({
          client,
          relationshipResolver,
          rawRepository,
          normalizedRepository: new SupabaseNormalizedRepository("accounts_payable", financialRow, db),
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
