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
import { listSalesOrders, listServiceOrders } from "./modules";
import { normalizeSalesOrder, normalizeServiceOrder } from "./normalize";
import type {
  CommercialResolver,
  SalesOrderDto,
  SalesOrderRecord,
  ServiceOrderDto,
  ServiceOrderRecord,
} from "./types";

type CommercialSyncOptions<TRecord> = {
  client: OmieRequester;
  resolver: CommercialResolver;
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

function shared<TRecord>(options: CommercialSyncOptions<TRecord>) {
  return {
    rawRepository: options.rawRepository,
    normalizedRepository: options.normalizedRepository,
    ...(options.errorRepository ? { errorRepository: options.errorRepository } : {}),
    ...(options.stateRepository ? { stateRepository: options.stateRepository } : {}),
    ...(options.syncRunId ? { syncRunId: options.syncRunId } : {}),
    ...(options.now ? { now: options.now } : {}),
  };
}

function listOptions<TRecord>(options: CommercialSyncOptions<TRecord>) {
  return {
    ...(options.pageDelayMs === undefined ? {} : { pageDelayMs: options.pageDelayMs }),
    ...(options.sleep ? { sleep: options.sleep } : {}),
  };
}

export const syncSalesOrders = (options: CommercialSyncOptions<SalesOrderRecord>) =>
  syncReferenceEntity<SalesOrderDto, SalesOrderRecord>({
    entityType: "sales_orders",
    fetch: () => listSalesOrders(options.client, listOptions(options)),
    identify: (dto) => rawId(dto.cabecalho.codigo_pedido),
    normalize: async (dto) =>
      normalizeSalesOrder(
        dto,
        {
          customerId: await options.resolver.resolveCustomer(dto.cabecalho.codigo_cliente),
          sellerId: await options.resolver.resolveSeller(dto.informacoes_adicionais?.codVend),
        },
        await options.resolver.resolveStage("sales_order", dto.cabecalho.etapa),
      ),
    ...shared(options),
  });

export const syncServiceOrders = (options: CommercialSyncOptions<ServiceOrderRecord>) =>
  syncReferenceEntity<ServiceOrderDto, ServiceOrderRecord>({
    entityType: "service_orders",
    fetch: () => listServiceOrders(options.client, listOptions(options)),
    identify: (dto) => rawId(dto.Cabecalho.nCodOS),
    normalize: async (dto) =>
      normalizeServiceOrder(
        dto,
        {
          customerId: await options.resolver.resolveCustomer(dto.Cabecalho.nCodCli),
          sellerId: await options.resolver.resolveSeller(dto.Cabecalho.nCodVend),
        },
        await options.resolver.resolveStage("service_order", dto.Cabecalho.cEtapa),
      ),
    ...shared(options),
  });
