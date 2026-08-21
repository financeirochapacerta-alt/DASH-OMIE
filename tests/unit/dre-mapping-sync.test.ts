import { describe, expect, it } from "vitest";

import {
  syncDreMappingsFromOmie,
  type DreMappingCategory,
  type DreMappingRepository,
  type StoredDreMapping,
} from "@/services/omie/reference-data/dre-mapping-sync";
import type { DreMappingDerivation } from "@/services/omie/reference-data/dre-mapping";

function fakeRepository(
  categories: readonly DreMappingCategory[],
  seed: Record<string, Partial<Record<"omie" | "manual", StoredDreMapping>>> = {},
) {
  const store = new Map(Object.entries(seed).map(([id, value]) => [id, { ...value }]));
  const inserts: { categoryId: string; derivation: DreMappingDerivation }[] = [];
  const updates: { categoryId: string; derivation: DreMappingDerivation }[] = [];

  const repository: DreMappingRepository = {
    listCategories: async () => categories,
    findMapping: async (categoryId, source) => store.get(categoryId)?.[source] ?? null,
    insertMapping: async (categoryId, derivation) => {
      inserts.push({ categoryId, derivation });
      const entry = store.get(categoryId) ?? {};
      entry.omie = {
        dreType: derivation.dreType,
        dreGroup: derivation.dreGroup,
        dreAccount: derivation.dreAccount,
        signBehavior: derivation.signBehavior,
      };
      store.set(categoryId, entry);
    },
    updateMapping: async (categoryId, derivation) => {
      updates.push({ categoryId, derivation });
      const entry = store.get(categoryId) ?? {};
      entry.omie = {
        dreType: derivation.dreType,
        dreGroup: derivation.dreGroup,
        dreAccount: derivation.dreAccount,
        signBehavior: derivation.signBehavior,
      };
      store.set(categoryId, entry);
    },
  };

  return { repository, store, inserts, updates };
}

const pessoal: DreMappingCategory = {
  id: "1",
  codigoDre: "2.11.01",
  dreMetadata: { descricaoDRE: "Despesas com Pessoal", sinalDRE: "-" },
};
const semMetadata: DreMappingCategory = { id: "2", codigoDre: null, dreMetadata: null };

describe("syncDreMappingsFromOmie", () => {
  it("inserts a new mapping for a category with confirmed metadata", async () => {
    const { repository, inserts, updates, store } = fakeRepository([pessoal]);
    const summary = await syncDreMappingsFromOmie(repository);

    expect(summary).toEqual({
      totalCategories: 1,
      autoMapped: 1,
      unmapped: 0,
      manual: 0,
      conflicts: 0,
      inserted: 1,
      updated: 0,
      unchanged: 0,
    });
    expect(inserts).toHaveLength(1);
    expect(updates).toHaveLength(0);
    expect(store.get("1")?.omie).toMatchObject({ dreType: "2", dreGroup: "2.11", dreAccount: "Despesas com Pessoal" });
  });

  it("is idempotent: a second run with identical metadata reports unchanged", async () => {
    const { repository, inserts, updates } = fakeRepository([pessoal]);
    await syncDreMappingsFromOmie(repository);
    const second = await syncDreMappingsFromOmie(repository);

    expect(second).toMatchObject({ inserted: 0, updated: 0, unchanged: 1 });
    expect(inserts).toHaveLength(1);
    expect(updates).toHaveLength(0);
  });

  it("updates the omie mapping when Omie metadata changes", async () => {
    const { repository, updates } = fakeRepository([pessoal], {
      "1": { omie: { dreType: "2", dreGroup: "2.11", dreAccount: "Old label", signBehavior: "-" } },
    });
    const summary = await syncDreMappingsFromOmie(repository);

    expect(summary).toMatchObject({ inserted: 0, updated: 1, unchanged: 0 });
    expect(updates).toHaveLength(1);
    expect(updates[0].derivation.dreAccount).toBe("Despesas com Pessoal");
  });

  it("never overwrites a manual mapping and still keeps the omie mapping current", async () => {
    const { repository, store, updates } = fakeRepository([pessoal], {
      "1": {
        manual: { dreType: "custom-type", dreGroup: "custom-group", dreAccount: "Curated label", signBehavior: null },
      },
    });
    const summary = await syncDreMappingsFromOmie(repository);

    expect(summary.manual).toBe(1);
    expect(store.get("1")?.manual).toEqual({
      dreType: "custom-type",
      dreGroup: "custom-group",
      dreAccount: "Curated label",
      signBehavior: null,
    });
    expect(updates).toHaveLength(0);
    expect(store.get("1")?.omie).toMatchObject({ dreAccount: "Despesas com Pessoal" });
  });

  it("flags a conflict when a manual mapping disagrees with the derived Omie mapping", async () => {
    const { repository } = fakeRepository([pessoal], {
      "1": {
        manual: { dreType: "custom-type", dreGroup: "custom-group", dreAccount: "Curated label", signBehavior: null },
      },
    });
    const summary = await syncDreMappingsFromOmie(repository);
    expect(summary.conflicts).toBe(1);
  });

  it("leaves categories without confirmed metadata unmapped", async () => {
    const { repository, inserts } = fakeRepository([semMetadata]);
    const summary = await syncDreMappingsFromOmie(repository);

    expect(summary).toEqual({
      totalCategories: 1,
      autoMapped: 0,
      unmapped: 1,
      manual: 0,
      conflicts: 0,
      inserted: 0,
      updated: 0,
      unchanged: 0,
    });
    expect(inserts).toHaveLength(0);
  });
});
