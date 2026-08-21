import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createOmieClient } from "@/services/omie/client";
import {
  syncBankAccounts,
  syncCategories,
  syncCustomers,
  syncSellers,
} from "@/services/omie/reference-data/sync-modules";
import type {
  BankAccountRecord,
  CategoryRecord,
  CustomerRecord,
  ReferenceEntity,
  SellerRecord,
  SyncSummary,
} from "@/services/omie/reference-data/types";
import { SupabaseExecutor } from "@/services/supabase/executor";
import {
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

const customerRow = (r: CustomerRecord) => ({
  legal_name: r.legalName,
  trade_name: r.tradeName,
  document_number: r.documentNumber,
  ...(r.isActive === undefined ? {} : { is_active: r.isActive }),
});

const sellerRow = (r: SellerRecord) => ({
  name: r.name,
  email: r.email,
  ...(r.isActive === undefined ? {} : { is_active: r.isActive }),
});

const categoryRow = (r: CategoryRecord) => ({
  name: r.name,
  codigo_dre: r.codigoDre,
  dre_metadata: r.dreMetadata,
  ...(r.isActive === undefined ? {} : { is_active: r.isActive }),
});

// selected_for_cash is a local managerial setting (ADR-012) and is never written here.
const bankAccountRow = (r: BankAccountRecord) => ({
  description: r.description,
  initial_balance: r.initialBalance,
  balance_date: r.balanceDate,
  account_type: r.accountType,
  ...(r.blocked === undefined ? {} : { blocked: r.blocked }),
  ...(r.inactive === undefined ? {} : { inactive: r.inactive }),
});

async function main() {
  const db = new SupabaseExecutor();
  const client = createOmieClient();
  const rawRepository = new SupabaseRawRecordRepository(db);
  const errorRepository = new SupabaseSyncErrorRepository(db);
  const stateRepository = new SupabaseSyncStateRepository(db);
  const runRepository = new SupabaseSyncRunRepository(db);
  const lockRepository = new SupabaseSyncLockRepository(db);

  const jobs: { entityType: ReferenceEntity; run: (syncRunId: string) => Promise<SyncSummary> }[] = [
    {
      entityType: "customers",
      run: (syncRunId) =>
        syncCustomers({
          client,
          rawRepository,
          normalizedRepository: new SupabaseNormalizedRepository("customers", customerRow, db),
          errorRepository,
          stateRepository,
          syncRunId,
        }),
    },
    {
      entityType: "sellers",
      run: (syncRunId) =>
        syncSellers({
          client,
          rawRepository,
          normalizedRepository: new SupabaseNormalizedRepository("sellers", sellerRow, db),
          errorRepository,
          stateRepository,
          syncRunId,
        }),
    },
    {
      entityType: "categories",
      run: (syncRunId) =>
        syncCategories({
          client,
          rawRepository,
          normalizedRepository: new SupabaseNormalizedRepository("categories", categoryRow, db),
          errorRepository,
          stateRepository,
          syncRunId,
        }),
    },
    {
      entityType: "bank_accounts",
      run: (syncRunId) =>
        syncBankAccounts({
          client,
          rawRepository,
          normalizedRepository: new SupabaseNormalizedRepository("bank_accounts", bankAccountRow, db),
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
