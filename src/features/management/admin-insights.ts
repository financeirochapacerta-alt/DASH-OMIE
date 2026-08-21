import "server-only";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "./format";

// Statuses this app already knows how to classify (matches
// src/services/omie/financial/status.ts SETTLED_TERMS/OPEN_TERMS/"cancelado"). A financial
// title whose status isn't recognized here is a genuine data-quality gap, not a UI concern.
const KNOWN_STATUSES = [
  "pago",
  "recebido",
  "liquidado",
  "baixado",
  "quitado",
  "aberto",
  "a vencer",
  "vencido",
  "atrasado",
  "vence hoje",
  "pendente",
  "cancelado",
];

function normalize(status: string) {
  return status
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLocaleLowerCase("pt-BR");
}

export type DataQualitySummary = {
  unmappedDreCategories: { name: string; amount: string }[];
  ordersWithoutInstallments: number;
  ordersWithoutRealDueDate: number;
  ordersWithoutSeller: number;
  osWithoutSeller: number;
  unknownFinancialStatuses: { status: string; count: number }[];
};

export async function getDataQualitySummary(): Promise<DataQualitySummary> {
  const client = await createClient();

  const [dre, salesOrders, serviceOrders, installments, receivableStatuses, payableStatuses] = await Promise.all([
    client.schema("analytics").from("dre_monthly").select("category_name,amount,mapping_status"),
    client.from("sales_orders").select("id,seller_id,real_due_date"),
    client.from("service_orders").select("id,seller_id"),
    client.from("sales_order_installments").select("sales_order_id"),
    client.from("accounts_receivable").select("status"),
    client.from("accounts_payable").select("status"),
  ]);

  const ordersWithInstallments = new Set((installments.data ?? []).map((row) => row.sales_order_id));
  const salesOrderRows = salesOrders.data ?? [];

  const unmappedByCategory = new Map<string, number>();
  for (const row of dre.data ?? []) {
    if (row.mapping_status !== "unmapped") continue;
    const key = row.category_name ?? "Sem categoria";
    unmappedByCategory.set(key, (unmappedByCategory.get(key) ?? 0) + Number(row.amount ?? 0));
  }

  const statusCounts = new Map<string, number>();
  for (const row of [...(receivableStatuses.data ?? []), ...(payableStatuses.data ?? [])]) {
    const status = row.status;
    if (typeof status !== "string" || KNOWN_STATUSES.some((known) => normalize(status).includes(known))) continue;
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }

  return {
    unmappedDreCategories: [...unmappedByCategory.entries()].map(([name, amount]) => ({ name, amount: amount.toFixed(2) })),
    ordersWithoutInstallments: salesOrderRows.filter((row) => !ordersWithInstallments.has(row.id)).length,
    ordersWithoutRealDueDate: salesOrderRows.filter((row) => !row.real_due_date).length,
    ordersWithoutSeller: salesOrderRows.filter((row) => !row.seller_id).length,
    osWithoutSeller: (serviceOrders.data ?? []).filter((row) => !row.seller_id).length,
    unknownFinancialStatuses: [...statusCounts.entries()].map(([status, count]) => ({ status, count })),
  };
}

export type SyncStatusRow = {
  entityType: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationSeconds: number | null;
  fetched: number;
  inserted: number;
  updated: number;
  unchanged: number;
  failed: number;
};

export type SyncOverview = {
  runs: SyncStatusRow[];
  activeLocks: { entityType: string; expiresAt: string }[];
};

// admin_sync_status/admin_active_locks are SECURITY DEFINER RPCs that fail closed for
// non-ADMIN/DIRETORIA roles (raw.* has no Data API exposure at all — see ADR-007).
export async function getSyncOverview(): Promise<SyncOverview> {
  const client = await createClient();
  const [runs, locks] = await Promise.all([
    client.rpc("admin_sync_status"),
    client.rpc("admin_active_locks"),
  ]);
  if (runs.error || locks.error) return { runs: [], activeLocks: [] };

  return {
    runs: (runs.data ?? []).map((row: Record<string, unknown>) => ({
      entityType: String(row.entity_type),
      status: String(row.status),
      startedAt: row.started_at ? formatDate(String(row.started_at).slice(0, 10)) : null,
      finishedAt: row.finished_at ? formatDate(String(row.finished_at).slice(0, 10)) : null,
      durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
      fetched: Number(row.records_read ?? 0),
      inserted: Number(row.records_inserted ?? 0),
      updated: Number(row.records_updated ?? 0),
      unchanged: Number(row.records_unchanged ?? 0),
      failed: Number(row.records_failed ?? 0),
    })),
    activeLocks: (locks.data ?? []).map((row: Record<string, unknown>) => ({
      entityType: String(row.entity_type),
      expiresAt: String(row.expires_at),
    })),
  };
}
