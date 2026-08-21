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

import { createAdminClient } from "@/lib/supabase/admin";
import {
  syncDreMappingsFromOmie,
  type DreMappingCategory,
  type DreMappingRepository,
  type StoredDreMapping,
} from "@/services/omie/reference-data/dre-mapping-sync";
import type { DreMappingDerivation } from "@/services/omie/reference-data/dre-mapping";

// src/types/database.ts only declares profiles/management_settings today, so the
// Database-typed client rejects other tables. Same structural-cast workaround already
// used in src/services/supabase/executor.ts for the same reason.
type Row = Record<string, unknown>;
type Result<T> = { data: T; error: { message: string } | null };
type Filter = PromiseLike<Result<Row[]>> & {
  eq(column: string, value: unknown): Filter;
  maybeSingle(): Promise<Result<Row | null>>;
};
type Table = {
  select(columns: string): Filter;
  insert(value: Row): PromiseLike<Result<unknown>>;
  update(value: Row): { eq(column: string, value: unknown): { eq(column: string, value: unknown): PromiseLike<Result<unknown>> } };
};
type LooseClient = { from(table: string): Table };

function fail<T>(result: Result<T>, action: string): T {
  if (result.error) throw new Error(`Failed to ${action}: ${result.error.message}`);
  return result.data;
}

function supabaseRepository(): DreMappingRepository {
  const client = createAdminClient() as unknown as LooseClient;
  return {
    async listCategories(): Promise<readonly DreMappingCategory[]> {
      const data = fail(
        await client.from("categories").select("id, codigo_dre, dre_metadata"),
        "list categories",
      );
      return (data ?? []).map((row) => ({
        id: String(row.id),
        codigoDre: row.codigo_dre as string | null,
        dreMetadata: row.dre_metadata,
      }));
    },
    async findMapping(categoryId, source): Promise<StoredDreMapping | null> {
      const data = fail(
        await client
          .from("dre_category_mappings")
          .select("dre_type, dre_group, dre_account, sign_behavior")
          .eq("category_id", categoryId)
          .eq("source", source)
          .maybeSingle(),
        "read mapping",
      );
      if (!data) return null;
      return {
        dreType: data.dre_type as string,
        dreGroup: data.dre_group as string,
        dreAccount: data.dre_account as string,
        signBehavior: data.sign_behavior as string | null,
      };
    },
    async insertMapping(categoryId, derivation: DreMappingDerivation) {
      fail(
        await client.from("dre_category_mappings").insert({
          category_id: categoryId,
          source: "omie",
          dre_type: derivation.dreType,
          dre_group: derivation.dreGroup,
          dre_account: derivation.dreAccount,
          sign_behavior: derivation.signBehavior,
          type_order: derivation.typeOrder,
          group_order: derivation.groupOrder,
          account_order: derivation.accountOrder,
          active: true,
        }),
        "insert mapping",
      );
    },
    async updateMapping(categoryId, derivation: DreMappingDerivation) {
      fail(
        await client
          .from("dre_category_mappings")
          .update({
            dre_type: derivation.dreType,
            dre_group: derivation.dreGroup,
            dre_account: derivation.dreAccount,
            sign_behavior: derivation.signBehavior,
            type_order: derivation.typeOrder,
            group_order: derivation.groupOrder,
            account_order: derivation.accountOrder,
          })
          .eq("category_id", categoryId)
          .eq("source", "omie"),
        "update mapping",
      );
    },
  };
}

async function main() {
  const summary = await syncDreMappingsFromOmie(supabaseRepository());
  console.table(summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
