import type { OmieRequester } from "../reference-data/types";

export type FinancialTitleDto = {
  codigo_lancamento_omie: number | string;
  codigo_cliente_fornecedor?: number | string;
  codigo_vendedor?: number | string;
  data_vencimento: string;
  data_previsao?: string;
  data_emissao?: string;
  valor_documento: number | string;
  status_titulo: string;
  codigo_categoria?: string;
  numero_documento_fiscal?: string;
  numero_parcela?: string;
  id_conta_corrente?: number | string;
};

export type ReceivableDto = FinancialTitleDto;
export type PayableDto = FinancialTitleDto;

export type FinancialRelationIds = {
  customerId: string | null;
  sellerId: string | null;
  categoryId: string | null;
  bankAccountId: string | null;
};

export type FinancialTitleRecord = FinancialRelationIds & {
  omieId: string;
  dueDate: string;
  forecastDate: string | null;
  issueDate: string | null;
  originalValue: string;
  signedValue: string;
  status: string;
  statusKnown: boolean;
  documentNumber: string | null;
  installmentNumber: string | null;
  isSettled: boolean;
  isCancelled: boolean;
};

export type FinancialRelationshipResolver = {
  resolve(dto: FinancialTitleDto): Promise<FinancialRelationIds>;
};

export type FinancialListOptions = {
  pageDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
};

export type FinancialModuleDependencies = {
  client: OmieRequester;
};
