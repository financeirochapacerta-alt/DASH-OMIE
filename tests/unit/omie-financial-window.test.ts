import { describe, expect, it } from "vitest";

import {
  createFinancialSyncWindow,
  FINANCIAL_HISTORY_START,
} from "@/services/omie/financial";

describe("financial synchronization window", () => {
  it("starts in 2025 and ends one calendar year after today", () => {
    expect(createFinancialSyncWindow(new Date("2026-08-20T12:00:00.000Z"))).toEqual({
      from: FINANCIAL_HISTORY_START,
      to: "2027-08-20",
    });
  });
});
