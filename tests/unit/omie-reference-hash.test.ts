import { describe, expect, it } from "vitest";

import { hashPayload } from "@/services/omie/reference-data";

describe("hashPayload", () => {
  it("is deterministic regardless of object property order", () => {
    const first = { codigo: 10, nested: { description: "example", active: true } };
    const second = { nested: { active: true, description: "example" }, codigo: 10 };
    expect(hashPayload(first)).toBe(hashPayload(second));
  });

  it("changes when the payload changes", () => {
    expect(hashPayload({ codigo: 10 })).not.toBe(hashPayload({ codigo: 11 }));
  });
});
