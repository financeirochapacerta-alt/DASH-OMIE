import { describe, expect, it } from "vitest";

import { canAccess } from "@/features/auth/authorization";

describe("authorization matrix", () => {
  it("allows admins to read business data and manage configuration", () => {
    expect(canAccess("ADMIN", true, "financial")).toBe(true);
    expect(canAccess("ADMIN", true, "configuration", "write")).toBe(true);
  });

  it("allows finance while denying it to commercial", () => {
    expect(canAccess("FINANCEIRO", true, "financial")).toBe(true);
    expect(canAccess("COMERCIAL", true, "financial")).toBe(false);
  });

  it("limits production to operational areas", () => {
    expect(canAccess("PRODUCAO", true, "sales_orders")).toBe(true);
    expect(canAccess("PRODUCAO", true, "financial")).toBe(false);
    expect(canAccess("PRODUCAO", true, "analytics_commercial")).toBe(false);
  });

  it("gives viewers only the explicitly released dashboard", () => {
    expect(canAccess("VIEWER", true, "dashboard")).toBe(true);
    expect(canAccess("VIEWER", true, "customers")).toBe(false);
  });

  it("denies inactive users and unknown roles", () => {
    expect(canAccess("ADMIN", false, "configuration", "write")).toBe(false);
    expect(canAccess("UNKNOWN", true, "dashboard")).toBe(false);
    expect(canAccess(null, true, "dashboard")).toBe(false);
  });
});
