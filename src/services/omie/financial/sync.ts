import "server-only";

import type { SleepFunction } from "../types";
import {
  syncReferenceEntity,
  type NormalizedRepository,
  type RawRecordRepository,
  type SyncErrorRepository,
  type SyncStateRepository,
} from "../reference-data/sync";
import type { OmieRequester } from "../reference-data/types";
import { listPayables, listReceivables } from "./modules";
import { normalizePayable, normalizeReceivable } from "./normalize";
import type {
  FinancialRelationshipResolver,
  FinancialTitleDto,
  FinancialTitleRecord,
} from "./types";
import { createFinancialSyncWindow, isWithinFinancialWindow } from "./window";

type FinancialSyncOptions = {
  client: OmieRequester;
  relationshipResolver: FinancialRelationshipResolver;
  rawRepository: RawRecordRepository;
  normalizedRepository: NormalizedRepository<FinancialTitleRecord>;
  errorRepository?: SyncErrorRepository;
  stateRepository?: SyncStateRepository;
  syncRunId?: string;
  pageDelayMs?: number;
  sleep?: SleepFunction;
  today?: Date;
  now?: () => Date;
};

function rawId(value: unknown) {
  return typeof value === "string" || (typeof value === "number" && Number.isFinite(value))
    ? String(value)
    : null;
}

function sharedOptions(options: FinancialSyncOptions) {
  return {
    rawRepository: options.rawRepository,
    normalizedRepository: options.normalizedRepository,
    ...(options.errorRepository ? { errorRepository: options.errorRepository } : {}),
    ...(options.stateRepository ? { stateRepository: options.stateRepository } : {}),
    ...(options.syncRunId ? { syncRunId: options.syncRunId } : {}),
    ...(options.now ? { now: options.now } : {}),
  };
}

function listOptions(options: FinancialSyncOptions) {
  return {
    ...(options.pageDelayMs === undefined ? {} : { pageDelayMs: options.pageDelayMs }),
    ...(options.sleep ? { sleep: options.sleep } : {}),
  };
}

function inWindow(records: readonly FinancialTitleDto[], today = new Date()) {
  const window = createFinancialSyncWindow(today);
  return records.filter((record) => {
    try {
      return isWithinFinancialWindow(record.data_vencimento, window);
    } catch {
      return true;
    }
  });
}

export const syncReceivables = (options: FinancialSyncOptions) =>
  syncReferenceEntity<FinancialTitleDto, FinancialTitleRecord>({
    entityType: "accounts_receivable",
    fetch: async () => {
      const result = await listReceivables(options.client, listOptions(options));
      return { records: inWindow(result.records, options.today) };
    },
    identify: (dto) => rawId(dto.codigo_lancamento_omie),
    normalize: async (dto) => normalizeReceivable(dto, await options.relationshipResolver.resolve(dto)),
    ...sharedOptions(options),
  });

export const syncPayables = (options: FinancialSyncOptions) =>
  syncReferenceEntity<FinancialTitleDto, FinancialTitleRecord>({
    entityType: "accounts_payable",
    fetch: async () => {
      const result = await listPayables(options.client, listOptions(options));
      return { records: inWindow(result.records, options.today) };
    },
    identify: (dto) => rawId(dto.codigo_lancamento_omie),
    normalize: async (dto) => normalizePayable(dto, await options.relationshipResolver.resolve(dto)),
    ...sharedOptions(options),
  });
