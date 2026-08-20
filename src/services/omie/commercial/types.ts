import type { OmieRequester } from "../reference-data/types";

export type SalesOrderDto = {
  cabecalho: {
    codigo_pedido: number | string;
    numero_pedido?: string;
    codigo_cliente?: number | string;
    data_previsao?: string;
    etapa?: string;
    quantidade_itens?: number;
  };
  informacoes_adicionais?: {
    codVend?: number | string;
    numero_contrato?: string;
  };
  det?: readonly { produto?: { valor_mercadoria?: number | string } }[];
  infoCadastro?: {
    cancelado?: string;
    dCan?: string;
    hCan?: string;
    dFat?: string;
  };
  lista_parcelas?: { parcela?: readonly SalesOrderInstallmentDto[] };
};

export type SalesOrderInstallmentDto = {
  numero_parcela?: number | string;
  data_vencimento?: string;
  valor?: number | string;
  codigo_parcela?: number | string;
};

export type ServiceOrderDto = {
  Cabecalho: {
    nCodOS: number | string;
    cNumOS?: string;
    nCodCli?: number | string;
    nCodVend?: number | string;
    cNumContrato?: string;
    dDtPrevisao?: string;
    cEtapa?: string;
    nValorTotal?: number | string;
  };
  InfoCadastro?: {
    dDtInc?: string;
    dDtFat?: string;
    nValorTot?: number | string;
    cCancelada?: string;
  };
};

export type CommercialRelationIds = { customerId: string | null; sellerId: string | null };

export type SalesOrderRecord = CommercialRelationIds & {
  omieId: string;
  displayNumber: string | null;
  contractNumber: string | null;
  forecastDate: string | null;
  stageCode: string | null;
  stageClassification: string | null;
  totalValue: string;
  isCancelled: boolean | null;
  cancelledAt: string | null;
  invoiceDate: string | null;
  realDueDate: string | null;
  enrichmentStatus: "pending" | "enriched" | "failed";
};

export type ServiceOrderRecord = CommercialRelationIds & {
  omieId: string;
  displayNumber: string | null;
  contractNumber: string | null;
  forecastDate: string | null;
  stageCode: string | null;
  stageClassification: string | null;
  totalValue: string;
  inclusionDate: string | null;
  invoiceDate: string | null;
  isCancelled: null;
  realDueDate: null;
};

export type SalesOrderInstallmentRecord = {
  installmentNumber: string | null;
  dueDate: string;
  amount: string | null;
  omieReference: string | null;
};

export type SalesOrderEnrichment = {
  isCancelled: boolean | null;
  cancelledAt: string | null;
  invoiceDate: string | null;
  realDueDate: string | null;
  enrichmentStatus: "enriched";
};

export type CommercialResolver = {
  resolveCustomer(omieId: number | string | undefined): Promise<string | null>;
  resolveSeller(omieId: number | string | undefined): Promise<string | null>;
  resolveStage(entityType: "sales_order" | "service_order", code: string | undefined): Promise<string | null>;
};

export type CommercialListOptions = {
  pageDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
};

export type CommercialModuleDependencies = { client: OmieRequester };
