import "server-only";

import { hashPayload } from "./hash";
import type {
  RawOmieRecord,
  ReferenceEntity,
  SyncSummary,
  UpsertResult,
} from "./types";

export type RawRecordRepository = {
  store(record: RawOmieRecord): Promise<void>;
};

export type NormalizedRepository<TRecord> = {
  upsert(record: TRecord, payloadHash: string): Promise<UpsertResult>;
};

export type SyncErrorRecord = {
  entityType: ReferenceEntity;
  omieId: string | null;
  message: string;
  syncRunId?: string;
};

export type SyncErrorRepository = {
  store(error: SyncErrorRecord): Promise<void>;
};

export type SyncStateRepository = {
  complete(entityType: ReferenceEntity, summary: SyncSummary, syncRunId?: string): Promise<void>;
};

type SyncOptions<TDto, TRecord extends { omieId: string }> = {
  entityType: ReferenceEntity;
  fetch: () => Promise<{ records: readonly TDto[] }>;
  identify: (dto: TDto) => string | null;
  normalize: (dto: TDto) => TRecord;
  rawRepository: RawRecordRepository;
  normalizedRepository: NormalizedRepository<TRecord>;
  errorRepository?: SyncErrorRepository;
  stateRepository?: SyncStateRepository;
  syncRunId?: string;
  now?: () => Date;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown synchronization error";
}

export async function syncReferenceEntity<TDto, TRecord extends { omieId: string }>({
  entityType,
  fetch,
  identify,
  normalize,
  rawRepository,
  normalizedRepository,
  errorRepository,
  stateRepository,
  syncRunId,
  now = () => new Date(),
}: SyncOptions<TDto, TRecord>): Promise<SyncSummary> {
  const pageResult = await fetch();
  const summary: SyncSummary = {
    fetched: pageResult.records.length,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
  };

  for (const dto of pageResult.records) {
    let omieId = identify(dto);
    try {
      const payloadHash = hashPayload(dto);
      await rawRepository.store({
        entityType,
        omieId,
        rawJson: dto,
        payloadHash,
        source: "omie_api",
        fetchedAt: now().toISOString(),
        ...(syncRunId ? { syncRunId } : {}),
      });
      const normalized = normalize(dto);
      omieId = normalized.omieId;
      const outcome = await normalizedRepository.upsert(normalized, payloadHash);
      summary[outcome] += 1;
    } catch (error) {
      summary.failed += 1;
      await errorRepository?.store({
        entityType,
        omieId,
        message: errorMessage(error),
        ...(syncRunId ? { syncRunId } : {}),
      });
    }
  }

  await stateRepository?.complete(entityType, summary, syncRunId);
  return summary;
}
