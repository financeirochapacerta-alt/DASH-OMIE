import { describe, expect, it, vi } from "vitest";

import { syncPayables, syncReceivables } from "@/services/omie/financial";
import type { FinancialTitleRecord } from "@/services/omie/financial/types";
import type { NormalizedRepository } from "@/services/omie/reference-data/sync";
import type { OmieRequester, UpsertResult } from "@/services/omie/reference-data/types";
import { payables, receivables } from "../fixtures/omie-financial";

const nullRelations = {
  customerId: null,
  sellerId: null,
  categoryId: null,
  bankAccountId: null,
};

function clientFor(collection: "receivable" | "payable", records: readonly unknown[]) {
  return {
    request: vi.fn().mockResolvedValue({
      pagina: 1,
      total_de_paginas: 1,
      [collection === "receivable" ? "conta_receber_cadastro" : "conta_pagar_cadastro"]: records,
    }),
  } as OmieRequester;
}

describe("financial synchronization", () => {
  it("tracks new, changed, unchanged and isolated receivable failures", async () => {
    const outcomes: UpsertResult[] = ["inserted", "updated", "unchanged"];
    const upsert = vi.fn().mockImplementation(async () => outcomes.shift() ?? "unchanged");
    const rawStore = vi.fn().mockResolvedValue(undefined);
    const errorStore = vi.fn().mockResolvedValue(undefined);
    const complete = vi.fn().mockResolvedValue(undefined);
    const records = [
      ...receivables.slice(0, 3),
      { ...receivables[3], data_vencimento: "31/02/2026" },
    ];

    const result = await syncReceivables({
      client: clientFor("receivable", records),
      relationshipResolver: {
        resolve: async () => nullRelations,
      },
      rawRepository: { store: rawStore },
      normalizedRepository: { upsert } as NormalizedRepository<FinancialTitleRecord>,
      errorRepository: { store: errorStore },
      stateRepository: { complete },
      today: new Date("2026-08-20T12:00:00.000Z"),
    });

    expect(result).toEqual({ fetched: 4, inserted: 1, updated: 1, unchanged: 1, failed: 1 });
    expect(rawStore).toHaveBeenCalledTimes(4);
    expect(upsert).toHaveBeenCalledTimes(3);
    expect(errorStore).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith("accounts_receivable", result, undefined);
  });

  it("runs payables independently with negative signed values", async () => {
    const persisted: FinancialTitleRecord[] = [];
    const result = await syncPayables({
      client: clientFor("payable", [payables[0]]),
      relationshipResolver: { resolve: async () => nullRelations },
      rawRepository: { store: async () => undefined },
      normalizedRepository: {
        upsert: async (record) => {
          persisted.push(record);
          return "inserted";
        },
      },
      today: new Date("2026-08-20T12:00:00.000Z"),
    });

    expect(result).toEqual({ fetched: 1, inserted: 1, updated: 0, unchanged: 0, failed: 0 });
    expect(persisted[0].signedValue).toBe("-400.00");
  });
});
