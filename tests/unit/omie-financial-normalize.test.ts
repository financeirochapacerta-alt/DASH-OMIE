import { describe, expect, it } from "vitest";

import { normalizePayable, normalizeReceivable } from "@/services/omie/financial";
import { payables, receivables } from "../fixtures/omie-financial";

describe("financial normalizers", () => {
  it("preserves receivable original value and applies a positive sign", () => {
    const result = normalizeReceivable({ ...receivables[0], valor_documento: "100" });
    expect(result.originalValue).toBe("100");
    expect(result.signedValue).toBe("100");
  });

  it("preserves payable original value and always applies a negative sign", () => {
    const result = normalizePayable({ ...payables[0], valor_documento: "100" });
    expect(result.originalValue).toBe("100");
    expect(result.signedValue).toBe("-100");
    expect(result.signedValue).not.toBe("100");
  });

  it("preserves original dates and status", () => {
    const result = normalizeReceivable({
      ...receivables[0],
      data_vencimento: "31/12/2026",
      data_previsao: "01/01/2027",
      data_emissao: "20/08/2026",
      status_titulo: "Recebido parcialmente",
    });
    expect(result).toMatchObject({
      dueDate: "2026-12-31",
      forecastDate: "2027-01-01",
      issueDate: "2026-08-20",
      status: "Recebido parcialmente",
      isSettled: true,
    });
  });

  it("accepts every unresolved relationship as null", () => {
    expect(normalizePayable(payables[5])).toMatchObject({
      customerId: null,
      sellerId: null,
      categoryId: null,
      bankAccountId: null,
    });
  });

  it("uses resolved references without inventing missing entities", () => {
    expect(
      normalizeReceivable(receivables[0], {
        customerId: "10",
        sellerId: "20",
        categoryId: "30",
        bankAccountId: "40",
      }),
    ).toMatchObject({ customerId: "10", sellerId: "20", categoryId: "30", bankAccountId: "40" });
  });

  it("rejects negative source values and invalid dates", () => {
    expect(() => normalizePayable({ ...payables[0], valor_documento: "-1" })).toThrow(RangeError);
    expect(() => normalizeReceivable({ ...receivables[0], data_vencimento: "31/02/2026" })).toThrow(
      "Invalid Brazilian date",
    );
  });
});
