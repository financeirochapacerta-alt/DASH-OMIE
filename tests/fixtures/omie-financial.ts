import type { FinancialTitleDto } from "@/services/omie/financial";

const baseReceivable: FinancialTitleDto = {
  codigo_lancamento_omie: 5001,
  codigo_cliente_fornecedor: 1001,
  codigo_vendedor: 2001,
  data_vencimento: "30/09/2026",
  data_previsao: "30/09/2026",
  data_emissao: "20/08/2026",
  valor_documento: "1000.00",
  status_titulo: "ABERTO",
  codigo_categoria: "1.01.01",
  numero_documento_fiscal: "NF-EXEMPLO-1",
  numero_parcela: "001/001",
  id_conta_corrente: 3001,
};

const basePayable: FinancialTitleDto = {
  codigo_lancamento_omie: 6001,
  codigo_cliente_fornecedor: 1002,
  data_vencimento: "30/09/2026",
  data_previsao: "30/09/2026",
  data_emissao: "20/08/2026",
  valor_documento: "400.00",
  status_titulo: "PENDENTE",
  codigo_categoria: "2.01.01",
  numero_documento_fiscal: "DOC-EXEMPLO-1",
  numero_parcela: "001/001",
  id_conta_corrente: 3001,
};

export const receivables: readonly FinancialTitleDto[] = [
  baseReceivable,
  { ...baseReceivable, codigo_lancamento_omie: 5002, status_titulo: "Recebido" },
  { ...baseReceivable, codigo_lancamento_omie: 5003, data_vencimento: "01/01/2026" },
  { ...baseReceivable, codigo_lancamento_omie: 5004, status_titulo: "CANCELADO" },
  { ...baseReceivable, codigo_lancamento_omie: 5005, data_vencimento: "01/02/2027" },
  {
    ...baseReceivable,
    codigo_lancamento_omie: 5006,
    codigo_vendedor: undefined,
    id_conta_corrente: undefined,
    codigo_categoria: undefined,
    codigo_cliente_fornecedor: undefined,
  },
  { ...baseReceivable, codigo_lancamento_omie: 5007, status_titulo: "Em análise manual" },
];

export const payables: readonly FinancialTitleDto[] = [
  basePayable,
  { ...basePayable, codigo_lancamento_omie: 6002, status_titulo: "PAGO" },
  { ...basePayable, codigo_lancamento_omie: 6003, data_vencimento: "01/01/2026" },
  { ...basePayable, codigo_lancamento_omie: 6004, status_titulo: "Cancelado pelo usuário" },
  { ...basePayable, codigo_lancamento_omie: 6005, data_vencimento: "01/02/2027" },
  {
    ...basePayable,
    codigo_lancamento_omie: 6006,
    id_conta_corrente: undefined,
    codigo_categoria: undefined,
  },
  { ...basePayable, codigo_lancamento_omie: 6007, status_titulo: "Aguardando conferência" },
];
