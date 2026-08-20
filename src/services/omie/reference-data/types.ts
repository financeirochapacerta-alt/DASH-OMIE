export type OmieFlag = "S" | "N" | string;

export type ListPageResponse<T> = {
  pagina: number;
  total_de_paginas: number;
  registros?: number;
  total_de_registros?: number;
  records: readonly T[];
};

export type CustomerDto = {
  codigo_cliente_omie: number | string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj_cpf?: string;
  inativo?: OmieFlag;
};

export type SellerDto = {
  codigo: number | string;
  nome: string;
  email?: string;
  inativo?: OmieFlag;
};

export type CategoryDto = {
  codigo: string;
  descricao: string;
  codigo_dre?: string;
  dadosDRE?: unknown;
  inativo?: OmieFlag;
};

export type BankAccountDto = {
  nCodCC: number | string;
  descricao: string;
  saldo_inicial?: number | string;
  saldo_data?: string;
  bloqueado?: OmieFlag;
  inativo?: OmieFlag;
  tipo_conta_corrente?: string;
};

export type CustomerRecord = {
  omieId: string;
  legalName: string;
  tradeName: string | null;
  documentNumber: string | null;
  isActive?: boolean;
};

export type SellerRecord = {
  omieId: string;
  name: string;
  email: string | null;
  isActive?: boolean;
};

export type CategoryRecord = {
  omieId: string;
  name: string;
  codigoDre: string | null;
  dreMetadata: unknown | null;
  isActive?: boolean;
};

export type BankAccountRecord = {
  omieId: string;
  description: string;
  initialBalance: string;
  balanceDate: string | null;
  blocked?: boolean;
  inactive?: boolean;
  accountType: string | null;
};

export type ReferenceEntity =
  | "customers"
  | "sellers"
  | "categories"
  | "bank_accounts"
  | "accounts_receivable"
  | "accounts_payable"
  | "sales_orders"
  | "sales_order_details"
  | "service_orders";

export type RawOmieRecord = {
  entityType: ReferenceEntity;
  omieId: string | null;
  rawJson: unknown;
  payloadHash: string;
  source: "omie_api";
  fetchedAt: string;
  syncRunId?: string;
};

export type UpsertResult = "inserted" | "updated" | "unchanged";

export type SyncSummary = {
  fetched: number;
  inserted: number;
  updated: number;
  unchanged: number;
  failed: number;
};

export type OmieRequester = {
  request<TResponse, TParam>(options: {
    endpoint: string;
    call: string;
    param: readonly TParam[];
  }): Promise<TResponse>;
};
