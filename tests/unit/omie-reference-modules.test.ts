import { describe, expect, it, vi } from "vitest";

import {
  listBankAccounts,
  listCategories,
  listCustomers,
  listSellers,
} from "@/services/omie/reference-data";
import type { OmieRequester } from "@/services/omie/reference-data/types";
import { bankAccounts, categories, customers, sellers } from "../fixtures/omie-reference-data";

function requester(responses: readonly unknown[]) {
  const request = vi.fn().mockImplementation(async () => responses[request.mock.calls.length - 1]);
  return { client: { request } as OmieRequester, request };
}

describe("Omie reference-data listing modules", () => {
  it("uses the shared paginator for multiple customer pages", async () => {
    const { client, request } = requester([
      { pagina: 1, total_de_paginas: 2, clientes_cadastro: [customers[0]] },
      { pagina: 2, total_de_paginas: 2, clientes_cadastro: [customers[1]] },
    ]);
    const sleep = vi.fn().mockResolvedValue(undefined);
    const result = await listCustomers(client, { sleep });

    expect(result.records).toEqual(customers);
    expect(result.pagesFetched).toBe(2);
    expect(sleep).toHaveBeenCalledWith(800);
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ param: [{ pagina: 2, registros_por_pagina: 50, apenas_importado_api: "N" }] }),
    );
  });

  it("maps each official list response collection", async () => {
    const sellerClient = requester([{ pagina: 1, total_de_paginas: 1, cadastro: sellers }]).client;
    const categoryClient = requester([
      { pagina: 1, total_de_paginas: 1, categoria_cadastro: categories },
    ]).client;
    const bankClient = requester([
      { pagina: 1, total_de_paginas: 1, fin_conta_corrente_cadastro: bankAccounts },
    ]).client;

    await expect(listSellers(sellerClient)).resolves.toMatchObject({ records: sellers });
    await expect(listCategories(categoryClient)).resolves.toMatchObject({ records: categories });
    await expect(listBankAccounts(bankClient)).resolves.toMatchObject({ records: bankAccounts });
  });

  it("adds only documented customer incremental filters", async () => {
    const { client, request } = requester([
      { pagina: 1, total_de_paginas: 1, clientes_cadastro: [] },
    ]);
    await listCustomers(client, {
      incremental: {
        dateFrom: "20/08/2026",
        timeFrom: "10:30:00",
        onlyChanged: true,
      },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        param: [
          expect.objectContaining({
            filtrar_por_data_de: "20/08/2026",
            filtrar_por_hora_de: "10:30:00",
            filtrar_apenas_alteracao: "S",
          }),
        ],
      }),
    );
  });
});
