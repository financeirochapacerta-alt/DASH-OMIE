import { describe, expect, it, vi } from "vitest";

import { listPayables, listReceivables } from "@/services/omie/financial";
import type { OmieRequester } from "@/services/omie/reference-data/types";
import { payables, receivables } from "../fixtures/omie-financial";

function requester(responses: readonly unknown[]) {
  const request = vi.fn().mockImplementation(async () => responses[request.mock.calls.length - 1]);
  return { client: { request } as OmieRequester, request };
}

describe("financial listing modules", () => {
  it("paginates receivables through the Omie Core", async () => {
    const { client, request } = requester([
      { pagina: 1, total_de_paginas: 2, conta_receber_cadastro: [receivables[0]] },
      { pagina: 2, total_de_paginas: 2, conta_receber_cadastro: [receivables[1]] },
    ]);
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(listReceivables(client, { sleep })).resolves.toMatchObject({
      records: [receivables[0], receivables[1]],
      pagesFetched: 2,
    });
    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ endpoint: "financas/contareceber", call: "ListarContasReceber" }),
    );
  });

  it("keeps payables as an independent endpoint and collection", async () => {
    const { client, request } = requester([
      { pagina: 1, total_de_paginas: 1, conta_pagar_cadastro: payables },
    ]);
    await expect(listPayables(client)).resolves.toMatchObject({ records: payables });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "financas/contapagar", call: "ListarContasPagar" }),
    );
  });
});
