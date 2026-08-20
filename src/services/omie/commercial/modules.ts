import "server-only";

import { paginateOmie } from "../pagination";
import type { OmieRequester } from "../reference-data/types";
import type { CommercialListOptions, SalesOrderDto, ServiceOrderDto } from "./types";

type PageResponse = {
  pagina: number;
  total_de_paginas: number;
  pedido_venda_produto?: readonly SalesOrderDto[];
  osCadastro?: readonly ServiceOrderDto[];
};
type ListParam = { pagina: number; registros_por_pagina: number; apenas_importado_api: "N" };

function listCommercial<TRecord>(
  client: OmieRequester,
  kind: "sales_order" | "service_order",
  options: CommercialListOptions = {},
) {
  const salesOrder = kind === "sales_order";
  return paginateOmie<PageResponse, TRecord>({
    fetchPage: (pagina, registros_por_pagina) =>
      client.request<PageResponse, ListParam>({
        endpoint: salesOrder ? "produtos/pedido" : "servicos/os",
        call: salesOrder ? "ListarPedidos" : "ListarOS",
        param: [{ pagina, registros_por_pagina, apenas_importado_api: "N" }],
      }),
    extractPage: (response) => ({
      records: ((salesOrder ? response.pedido_venda_produto : response.osCadastro) ?? []) as readonly TRecord[],
      currentPage: response.pagina,
      totalPages: response.total_de_paginas,
    }),
    ...options,
  });
}

export const listSalesOrders = (client: OmieRequester, options?: CommercialListOptions) =>
  listCommercial<SalesOrderDto>(client, "sales_order", options);

export const listServiceOrders = (client: OmieRequester, options?: CommercialListOptions) =>
  listCommercial<ServiceOrderDto>(client, "service_order", options);
