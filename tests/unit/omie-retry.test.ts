import { describe, expect, it } from "vitest";

import { calculateBackoffDelay, parseRetryAfter } from "@/services/omie/retry";

describe("Omie retry timing", () => {
  it("follows the documented exponential sequence", () => {
    expect([1, 2, 3, 4, 5, 6].map((retry) => calculateBackoffDelay(retry))).toEqual([
      2_000,
      4_000,
      8_000,
      16_000,
      32_000,
      60_000,
    ]);
  });

  it("caps all later retries at 60 seconds", () => {
    expect(calculateBackoffDelay(20)).toBe(60_000);
  });

  it("parses seconds and HTTP dates from Retry-After", () => {
    expect(parseRetryAfter("3", 0, 60_000)).toBe(3_000);
    expect(parseRetryAfter("Thu, 01 Jan 1970 00:00:05 GMT", 1_000, 60_000)).toBe(4_000);
    expect(parseRetryAfter("invalid", 0, 60_000)).toBeNull();
  });
});
