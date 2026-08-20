import { describe, expect, it } from "vitest";

import {
  consolidateSignedValues,
  isOpenTitle,
  isOverdueTitle,
  normalizePayable,
  normalizeReceivable,
} from "@/services/omie/financial";
import { payables, receivables } from "../fixtures/omie-financial";

describe("financial analytics rules", () => {
  it("consolidates receivable 1000 and payable 400 as 600 exactly", () => {
    const receivable = normalizeReceivable({ ...receivables[0], valor_documento: "1000" });
    const payable = normalizePayable({ ...payables[0], valor_documento: "400" });
    expect(consolidateSignedValues([receivable, payable])).toBe("600");
  });

  it.each([
    ["receivable", normalizeReceivable(receivables[3])],
    ["payable", normalizePayable(payables[3])],
  ])("excludes cancelled %s from open titles", (_kind, title) => {
    expect(isOpenTitle(title)).toBe(false);
  });

  it("marks only overdue, open and non-cancelled titles", () => {
    const overdue = normalizeReceivable(receivables[2]);
    const settled = normalizeReceivable({ ...receivables[2], status_titulo: "Recebido" });
    const cancelled = normalizeReceivable({ ...receivables[2], status_titulo: "Cancelado" });
    expect(isOverdueTitle(overdue, "2026-08-20")).toBe(true);
    expect(isOverdueTitle(settled, "2026-08-20")).toBe(false);
    expect(isOverdueTitle(cancelled, "2026-08-20")).toBe(false);
    expect(overdue.dueDate).toBe("2026-01-01");
  });
});
