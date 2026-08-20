import "server-only";

import { paginateOmie } from "../pagination";
import type { OmieRequester } from "../reference-data/types";
import type { FinancialListOptions, FinancialTitleDto } from "./types";

type FinancialPageResponse = {
  pagina: number;
  total_de_paginas: number;
  conta_receber_cadastro?: readonly FinancialTitleDto[];
  conta_pagar_cadastro?: readonly FinancialTitleDto[];
};

type ListParam = {
  pagina: number;
  registros_por_pagina: number;
  apenas_importado_api: "N";
};

function listFinancialTitles(
  client: OmieRequester,
  kind: "receivable" | "payable",
  options: FinancialListOptions = {},
) {
  const receivable = kind === "receivable";
  return paginateOmie<FinancialPageResponse, FinancialTitleDto>({
    fetchPage: (pagina, registros_por_pagina) =>
      client.request<FinancialPageResponse, ListParam>({
        endpoint: receivable ? "financas/contareceber" : "financas/contapagar",
        call: receivable ? "ListarContasReceber" : "ListarContasPagar",
        param: [{ pagina, registros_por_pagina, apenas_importado_api: "N" }],
      }),
    extractPage: (response) => ({
      records: receivable
        ? (response.conta_receber_cadastro ?? [])
        : (response.conta_pagar_cadastro ?? []),
      currentPage: response.pagina,
      totalPages: response.total_de_paginas,
    }),
    ...options,
  });
}

export const listReceivables = (client: OmieRequester, options?: FinancialListOptions) =>
  listFinancialTitles(client, "receivable", options);

export const listPayables = (client: OmieRequester, options?: FinancialListOptions) =>
  listFinancialTitles(client, "payable", options);
