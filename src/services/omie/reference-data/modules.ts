import "server-only";

import { paginateOmie } from "../pagination";
import type { SleepFunction } from "../types";
import type {
  BankAccountDto,
  CategoryDto,
  CustomerDto,
  OmieRequester,
  SellerDto,
} from "./types";

type PageMetadata = { pagina: number; total_de_paginas: number };
type CustomerResponse = PageMetadata & { clientes_cadastro?: readonly CustomerDto[] };
type SellerResponse = PageMetadata & { cadastro?: readonly SellerDto[] };
type CategoryResponse = PageMetadata & { categoria_cadastro?: readonly CategoryDto[] };
type BankAccountResponse = PageMetadata & {
  ListarContasCorrentes?: readonly BankAccountDto[];
};

type ListOptions = { pageDelayMs?: number; sleep?: SleepFunction };
type IncrementalDateFilter = {
  dateFrom?: string;
  dateTo?: string;
  onlyCreated?: boolean;
  onlyChanged?: boolean;
};
type CustomerListOptions = ListOptions & {
  incremental?: IncrementalDateFilter & { timeFrom?: string; timeTo?: string };
};
type SellerListOptions = ListOptions & { incremental?: IncrementalDateFilter };
type ListParam = Record<string, string | number> & {
  pagina: number;
  registros_por_pagina: number;
  apenas_importado_api: "N";
};

function listPages<TResponse extends PageMetadata, TRecord>(
  client: OmieRequester,
  endpoint: string,
  call: string,
  records: (response: TResponse) => readonly TRecord[] | undefined,
  options: ListOptions,
  extraParam: Record<string, string> = {},
) {
  return paginateOmie<TResponse, TRecord>({
    fetchPage: (pagina, registros_por_pagina) =>
      client.request<TResponse, ListParam>({
        endpoint,
        call,
        param: [{ pagina, registros_por_pagina, apenas_importado_api: "N", ...extraParam }],
      }),
    extractPage: (response) => ({
      records: records(response) ?? [],
      currentPage: response.pagina,
      totalPages: response.total_de_paginas,
    }),
    ...options,
  });
}

function incrementalParam(filter: IncrementalDateFilter | undefined) {
  if (!filter) return {};
  return {
    ...(filter.dateFrom ? { filtrar_por_data_de: filter.dateFrom } : {}),
    ...(filter.dateTo ? { filtrar_por_data_ate: filter.dateTo } : {}),
    ...(filter.onlyCreated === undefined
      ? {}
      : { filtrar_apenas_inclusao: filter.onlyCreated ? "S" : "N" }),
    ...(filter.onlyChanged === undefined
      ? {}
      : { filtrar_apenas_alteracao: filter.onlyChanged ? "S" : "N" }),
  };
}

export const listCustomers = (client: OmieRequester, options: CustomerListOptions = {}) =>
  listPages<CustomerResponse, CustomerDto>(
    client,
    "geral/clientes",
    "ListarClientes",
    (response) => response.clientes_cadastro,
    options,
    {
      ...incrementalParam(options.incremental),
      ...(options.incremental?.timeFrom
        ? { filtrar_por_hora_de: options.incremental.timeFrom }
        : {}),
      ...(options.incremental?.timeTo
        ? { filtrar_por_hora_ate: options.incremental.timeTo }
        : {}),
    },
  );

export const listSellers = (client: OmieRequester, options: SellerListOptions = {}) =>
  listPages<SellerResponse, SellerDto>(
    client,
    "geral/vendedores",
    "ListarVendedores",
    (response) => response.cadastro,
    options,
    incrementalParam(options.incremental),
  );

export const listCategories = (client: OmieRequester, options: ListOptions = {}) =>
  listPages<CategoryResponse, CategoryDto>(
    client,
    "geral/categorias",
    "ListarCategorias",
    (response) => response.categoria_cadastro,
    options,
  );

export const listBankAccounts = (client: OmieRequester, options: ListOptions = {}) =>
  listPages<BankAccountResponse, BankAccountDto>(
    client,
    "geral/contacorrente",
    "ListarContasCorrentes",
    (response) => response.ListarContasCorrentes,
    options,
  );
