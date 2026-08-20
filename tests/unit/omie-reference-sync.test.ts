import { describe, expect, it, vi } from "vitest";

import { syncReferenceEntity } from "@/services/omie/reference-data";
import type {
  RawOmieRecord,
  UpsertResult,
} from "@/services/omie/reference-data/types";
import { customers } from "../fixtures/omie-reference-data";

type Record = { omieId: string; name: string };

describe("reference-data synchronization", () => {
  it("counts insert, update and unchanged outcomes", async () => {
    const rawRecords: RawOmieRecord[] = [];
    const outcomes: UpsertResult[] = ["inserted", "updated", "unchanged"];
    const complete = vi.fn().mockResolvedValue(undefined);
    const result = await syncReferenceEntity({
      entityType: "customers",
      fetch: async () => ({ records: [{ id: 1 }, { id: 2 }, { id: 3 }] }),
      identify: (dto) => String(dto.id),
      normalize: (dto): Record => ({ omieId: String(dto.id), name: `Customer ${dto.id}` }),
      rawRepository: { store: async (record) => void rawRecords.push(record) },
      normalizedRepository: { upsert: async () => outcomes.shift() ?? "unchanged" },
      stateRepository: { complete },
      now: () => new Date("2026-08-20T12:00:00.000Z"),
    });

    expect(result).toEqual({ fetched: 3, inserted: 1, updated: 1, unchanged: 1, failed: 0 });
    expect(rawRecords).toHaveLength(3);
    expect(rawRecords[0].payloadHash).toMatch(/^[a-f0-9]{64}$/);
    expect(complete).toHaveBeenCalledWith("customers", result, undefined);
  });

  it("stores RAW before normalization and isolates a bad record", async () => {
    const rawStore = vi.fn().mockResolvedValue(undefined);
    const upsert = vi.fn().mockResolvedValue("inserted");
    const errors: unknown[] = [];
    const result = await syncReferenceEntity({
      entityType: "customers",
      fetch: async () => ({ records: customers }),
      identify: (dto) => String(dto.codigo_cliente_omie),
      normalize: (dto): Record => {
        if (dto.codigo_cliente_omie === 1001) throw new Error("invalid fixture record");
        return { omieId: String(dto.codigo_cliente_omie), name: dto.razao_social };
      },
      rawRepository: { store: rawStore },
      normalizedRepository: { upsert },
      errorRepository: { store: async (error) => void errors.push(error) },
    });

    expect(result).toEqual({ fetched: 2, inserted: 1, updated: 0, unchanged: 0, failed: 1 });
    expect(rawStore).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(errors).toHaveLength(1);
  });

  it("preserves local bank-account fields because sync records never contain them", async () => {
    const existing = { omieId: "3001", description: "Old", selectedForCash: false };
    const incoming = { omieId: "3001", description: "New" };
    const merged = { ...existing, ...incoming };
    expect(merged).toEqual({ omieId: "3001", description: "New", selectedForCash: false });
  });
});
