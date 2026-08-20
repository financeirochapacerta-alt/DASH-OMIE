import "server-only";

import type { SleepFunction } from "../types";
import { listBankAccounts, listCategories, listCustomers, listSellers } from "./modules";
import {
  normalizeBankAccount,
  normalizeCategory,
  normalizeCustomer,
  normalizeSeller,
} from "./normalize";
import {
  syncReferenceEntity,
  type NormalizedRepository,
  type RawRecordRepository,
  type SyncErrorRepository,
  type SyncStateRepository,
} from "./sync";
import type {
  BankAccountDto,
  BankAccountRecord,
  CategoryDto,
  CategoryRecord,
  CustomerDto,
  CustomerRecord,
  OmieRequester,
  SellerDto,
  SellerRecord,
} from "./types";

type EntitySyncOptions<TRecord> = {
  client: OmieRequester;
  rawRepository: RawRecordRepository;
  normalizedRepository: NormalizedRepository<TRecord>;
  errorRepository?: SyncErrorRepository;
  stateRepository?: SyncStateRepository;
  syncRunId?: string;
  pageDelayMs?: number;
  sleep?: SleepFunction;
  now?: () => Date;
};

function rawId(value: unknown) {
  return typeof value === "string" || (typeof value === "number" && Number.isFinite(value))
    ? String(value)
    : null;
}

function sharedOptions<TRecord>(options: EntitySyncOptions<TRecord>) {
  return {
    rawRepository: options.rawRepository,
    normalizedRepository: options.normalizedRepository,
    ...(options.errorRepository ? { errorRepository: options.errorRepository } : {}),
    ...(options.stateRepository ? { stateRepository: options.stateRepository } : {}),
    ...(options.syncRunId ? { syncRunId: options.syncRunId } : {}),
    ...(options.now ? { now: options.now } : {}),
  };
}

function listOptions<TRecord>(options: EntitySyncOptions<TRecord>) {
  return {
    ...(options.pageDelayMs === undefined ? {} : { pageDelayMs: options.pageDelayMs }),
    ...(options.sleep ? { sleep: options.sleep } : {}),
  };
}

export const syncCustomers = (options: EntitySyncOptions<CustomerRecord>) =>
  syncReferenceEntity<CustomerDto, CustomerRecord>({
    entityType: "customers",
    fetch: () => listCustomers(options.client, listOptions(options)),
    identify: (dto) => rawId(dto.codigo_cliente_omie),
    normalize: normalizeCustomer,
    ...sharedOptions(options),
  });

export const syncSellers = (options: EntitySyncOptions<SellerRecord>) =>
  syncReferenceEntity<SellerDto, SellerRecord>({
    entityType: "sellers",
    fetch: () => listSellers(options.client, listOptions(options)),
    identify: (dto) => rawId(dto.codigo),
    normalize: normalizeSeller,
    ...sharedOptions(options),
  });

export const syncCategories = (options: EntitySyncOptions<CategoryRecord>) =>
  syncReferenceEntity<CategoryDto, CategoryRecord>({
    entityType: "categories",
    fetch: () => listCategories(options.client, listOptions(options)),
    identify: (dto) => rawId(dto.codigo),
    normalize: normalizeCategory,
    ...sharedOptions(options),
  });

export const syncBankAccounts = (options: EntitySyncOptions<BankAccountRecord>) =>
  syncReferenceEntity<BankAccountDto, BankAccountRecord>({
    entityType: "bank_accounts",
    fetch: () => listBankAccounts(options.client, listOptions(options)),
    identify: (dto) => rawId(dto.nCodCC),
    normalize: normalizeBankAccount,
    ...sharedOptions(options),
  });
