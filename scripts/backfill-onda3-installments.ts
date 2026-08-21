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

import { normalizeSalesOrderEnrichment } from "@/services/omie/commercial/normalize";
import type { SalesOrderDto } from "@/services/omie/commercial/types";
import { SupabaseExecutor } from "@/services/supabase/executor";
import { SupabaseSalesOrderEnrichmentRepository } from "@/services/supabase/repositories";

// Backfills the 420 orders that were synced before the normalizer started reading
// infoCadastro/lista_parcelas from ListarPedidos. Replays already-stored RAW payloads
// (fetched once during the base sync) through the same normalizeSalesOrderEnrichment used
// by ConsultarPedido — no new Omie API calls, no bulk hash reset. raw.omie_records is not
// exposed via the Data API (ADR-007), so this reads through the operational_list_raw RPC.
type LooseRow = Record<string, unknown>;

async function main() {
  const db = new SupabaseExecutor();
  const rows = (await db.rpc("operational_list_raw", { entity: "sales_orders" })) as LooseRow[];

  const latestByOmieId = new Map<string, LooseRow>();
  for (const row of rows) {
    const omieId = String(row.omie_id);
    const existing = latestByOmieId.get(omieId);
    if (!existing || String(row.fetched_at) > String(existing.fetched_at)) latestByOmieId.set(omieId, row);
  }

  const repository = new SupabaseSalesOrderEnrichmentRepository(db);

  let processed = 0;
  let withInstallments = 0;
  let cancelled = 0;
  let failed = 0;
  for (const [omieId, row] of latestByOmieId) {
    try {
      const dto = row.raw_json as SalesOrderDto;
      const { enrichment, installments } = normalizeSalesOrderEnrichment(dto);
      await repository.apply(omieId, enrichment, installments);
      processed += 1;
      if (installments.length > 0) withInstallments += 1;
      if (enrichment.isCancelled) cancelled += 1;
    } catch (error) {
      failed += 1;
      console.error(`Failed to backfill ${omieId}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(JSON.stringify({ totalRawRows: latestByOmieId.size, processed, withInstallments, cancelled, failed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
