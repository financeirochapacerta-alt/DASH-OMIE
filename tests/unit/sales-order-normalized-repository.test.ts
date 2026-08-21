import { describe, expect, it } from "vitest";

import { SupabaseSalesOrderNormalizedRepository } from "@/services/supabase";
import type { OperationalExecutor } from "@/services/supabase/executor";
import type { SalesOrderRecord } from "@/services/omie/commercial/types";

type Row = Record<string, unknown>;

// Minimal fake mirroring real Postgres behavior the real repository depends on: rows get a
// generated id on insert, and a later find() by omie_id returns that id (unlike the plain
// MemoryExecutor used elsewhere, which never attaches one).
function fakeExecutor() {
  const salesOrders = new Map<string, Row>();
  const installments: Row[] = [];
  let nextId = 1;
  const executor: OperationalExecutor = {
    async find(_schema, table, _column, value) {
      if (table === "sales_orders") return salesOrders.get(String(value)) ?? null;
      return null;
    },
    async insert(_schema, table, value) {
      if (table === "sales_order_installments") installments.push(value);
    },
    async insertReturning(_schema, _table, value) {
      return { id: String(nextId++), ...value };
    },
    async upsert(_schema, table, value) {
      if (table !== "sales_orders") return;
      const omieId = String(value.omie_id);
      const existing = salesOrders.get(omieId);
      salesOrders.set(omieId, { id: existing?.id ?? String(nextId++), ...value });
    },
    async update() {},
    async delete(_schema, table, column, key) {
      if (table === "sales_order_installments" && column === "sales_order_id") {
        for (let i = installments.length - 1; i >= 0; i -= 1) {
          if (installments[i]!.sales_order_id === key) installments.splice(i, 1);
        }
      }
    },
    async deleteExpiredLocks() {},
    async rpc() {
      return null;
    },
  };
  return { executor, salesOrders, installments };
}

const record = (overrides: Partial<SalesOrderRecord> = {}): SalesOrderRecord => ({
  omieId: "500",
  customerId: null,
  sellerId: null,
  displayNumber: "PV-1",
  contractNumber: null,
  forecastDate: null,
  stageCode: null,
  stageClassification: null,
  totalValue: "100",
  isCancelled: false,
  cancelledAt: null,
  invoiceDate: null,
  realDueDate: "2026-08-10",
  enrichmentStatus: "enriched",
  installments: [{ installmentNumber: "1", dueDate: "2026-08-10", amount: "100", omieReference: null }],
  ...overrides,
});

const toRow = (r: SalesOrderRecord) => ({ display_number: r.displayNumber, total_value: r.totalValue, is_cancelled: r.isCancelled, real_due_date: r.realDueDate, enrichment_status: r.enrichmentStatus });

describe("SupabaseSalesOrderNormalizedRepository", () => {
  it("persists installments alongside the order on insert", async () => {
    const { executor, installments } = fakeExecutor();
    const repo = new SupabaseSalesOrderNormalizedRepository(toRow, executor);
    expect(await repo.upsert(record(), "hash-1")).toBe("inserted");
    expect(installments).toHaveLength(1);
    expect(installments[0]).toMatchObject({ due_date: "2026-08-10", amount: "100" });
  });

  it("replaces installments (delete + reinsert) when the order changes", async () => {
    const { executor, installments } = fakeExecutor();
    const repo = new SupabaseSalesOrderNormalizedRepository(toRow, executor);
    await repo.upsert(record(), "hash-1");
    const updated = record({
      installments: [
        { installmentNumber: "1", dueDate: "2026-08-10", amount: "50", omieReference: null },
        { installmentNumber: "2", dueDate: "2026-09-10", amount: "50", omieReference: null },
      ],
    });
    expect(await repo.upsert(updated, "hash-2")).toBe("updated");
    expect(installments).toHaveLength(2);
  });

  it("is idempotent: unchanged hash skips both the order write and installment resync", async () => {
    const { executor, installments } = fakeExecutor();
    const repo = new SupabaseSalesOrderNormalizedRepository(toRow, executor);
    await repo.upsert(record(), "hash-1");
    const before = installments.length;
    expect(await repo.upsert(record(), "hash-1")).toBe("unchanged");
    expect(installments).toHaveLength(before);
  });

  it("persists an order with zero installments without error", async () => {
    const { executor, installments } = fakeExecutor();
    const repo = new SupabaseSalesOrderNormalizedRepository(toRow, executor);
    expect(await repo.upsert(record({ omieId: "501", installments: [] }), "hash-3")).toBe("inserted");
    expect(installments).toHaveLength(0);
  });
});
