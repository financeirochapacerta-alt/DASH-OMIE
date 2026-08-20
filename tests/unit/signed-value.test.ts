import { describe, expect, it } from "vitest";

import { toSignedValue } from "@/services/finance/signed-value";

describe("financial signed values", () => {
  it("keeps receivables positive", () => {
    expect(toSignedValue("100", "receivable")).toBe("100");
  });

  it("makes payables negative", () => {
    expect(toSignedValue("100", "payable")).toBe("-100");
  });

  it("rejects invalid original values", () => {
    expect(() => toSignedValue("-1", "receivable")).toThrow(RangeError);
  });
});
