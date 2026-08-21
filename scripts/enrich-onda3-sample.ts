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
import { processNextSalesOrderEnrichment, SalesOrderEnrichmentQueue } from "@/services/omie/commercial/enrichment";
import { SupabaseExecutor } from "@/services/supabase/executor";
import { SupabaseRawRecordRepository, SupabaseSalesOrderEnrichmentRepository } from "@/services/supabase/repositories";

// Controlled batch: the 15 most recent sales orders (by forecast_date), picked in a prior
// query against public.sales_orders after the base Onda 3 sync. Not the full history.
const RECENT_OMIE_IDS = [
  "7689080252", "7689075393", "7689066514", "7688537824", "7655646704",
  "7686680430", "7686563218", "7685869621", "7685737856", "7685724867",
  "7685521017", "7681861171", "7679855278", "7668921265", "7675423565",
];

let retryCount = 0;
const loggingClient = createOmieClient({
  logger: {
    log(event) {
      if (event.event === "retry") retryCount += 1;
      console.log(JSON.stringify(event));
    },
  },
});

async function main() {
  const db = new SupabaseExecutor();
  const rawRepository = new SupabaseRawRecordRepository(db);
  const repository = new SupabaseSalesOrderEnrichmentRepository(db);
  const queue = new SalesOrderEnrichmentQueue();
  for (const id of RECENT_OMIE_IDS) queue.enqueue(id);

  const results: { omieId: string; status: string; ms: number; error?: string }[] = [];
  const startedAll = Date.now();
  for (let i = 0; i < RECENT_OMIE_IDS.length; i += 1) {
    const startedAt = Date.now();
    const job = await processNextSalesOrderEnrichment({ queue, client: loggingClient, rawRepository, repository });
    results.push({
      omieId: job!.omieId,
      status: job!.status,
      ms: Date.now() - startedAt,
      ...(job!.error ? { error: job!.error } : {}),
    });
  }

  console.table(results);
  console.log("total_ms:", Date.now() - startedAll);
  console.log("retries_observed:", retryCount);
  console.log("completed:", results.filter((r) => r.status === "completed").length);
  console.log("failed:", results.filter((r) => r.status === "failed").length);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
