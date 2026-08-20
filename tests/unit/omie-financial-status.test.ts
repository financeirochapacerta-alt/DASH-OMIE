import { describe, expect, it } from "vitest";

import { classifyFinancialStatus } from "@/services/omie/financial";

describe("financial status classification", () => {
  it.each(["pago", "RECEBIDO", "Título liquidado", "BAIXADO manualmente", "Quitado"])(
    "classifies %s as settled",
    (status) => {
      expect(classifyFinancialStatus(status)).toMatchObject({ isSettled: true, isCancelled: false });
    },
  );

  it("classifies cancellation independently", () => {
    expect(classifyFinancialStatus("Título CANCELADO pelo usuário")).toMatchObject({
      isSettled: false,
      isCancelled: true,
      isKnown: true,
    });
  });

  it("fails safe for unknown and negated statuses", () => {
    expect(classifyFinancialStatus("Em análise manual")).toEqual({
      isSettled: false,
      isCancelled: false,
      isKnown: false,
    });
    expect(classifyFinancialStatus("Não pago")).toMatchObject({
      isSettled: false,
      isCancelled: false,
    });
  });
});
