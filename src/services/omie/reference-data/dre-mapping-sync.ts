import "server-only";

import { deriveDreMappingFromOmie, type DreMappingDerivation } from "./dre-mapping";

export type DreMappingCategory = {
  id: string;
  codigoDre: string | null;
  dreMetadata: unknown;
};

export type StoredDreMapping = {
  dreType: string;
  dreGroup: string;
  dreAccount: string;
  signBehavior: string | null;
};

export type DreMappingRepository = {
  listCategories(): Promise<readonly DreMappingCategory[]>;
  findMapping(categoryId: string, source: "omie" | "manual"): Promise<StoredDreMapping | null>;
  insertMapping(categoryId: string, derivation: DreMappingDerivation): Promise<void>;
  updateMapping(categoryId: string, derivation: DreMappingDerivation): Promise<void>;
};

export type DreMappingSyncSummary = {
  totalCategories: number;
  autoMapped: number;
  unmapped: number;
  manual: number;
  conflicts: number;
  inserted: number;
  updated: number;
  unchanged: number;
};

function sameMapping(a: StoredDreMapping, b: DreMappingDerivation) {
  return (
    a.dreType === b.dreType &&
    a.dreGroup === b.dreGroup &&
    a.dreAccount === b.dreAccount &&
    a.signBehavior === b.signBehavior
  );
}

export async function syncDreMappingsFromOmie(
  repository: DreMappingRepository,
): Promise<DreMappingSyncSummary> {
  const categories = await repository.listCategories();
  const summary: DreMappingSyncSummary = {
    totalCategories: categories.length,
    autoMapped: 0,
    unmapped: 0,
    manual: 0,
    conflicts: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
  };

  for (const category of categories) {
    const manual = await repository.findMapping(category.id, "manual");
    if (manual) summary.manual += 1;

    const derivation = deriveDreMappingFromOmie(category.codigoDre, category.dreMetadata);
    if (!derivation) {
      summary.unmapped += 1;
      continue;
    }

    summary.autoMapped += 1;
    if (manual && !sameMapping(manual, derivation)) summary.conflicts += 1;

    const existingOmie = await repository.findMapping(category.id, "omie");
    if (!existingOmie) {
      await repository.insertMapping(category.id, derivation);
      summary.inserted += 1;
    } else if (sameMapping(existingOmie, derivation)) {
      summary.unchanged += 1;
    } else {
      await repository.updateMapping(category.id, derivation);
      summary.updated += 1;
    }
  }

  return summary;
}
