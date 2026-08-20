import { describe, expect, it } from "vitest";

import {
  normalizeBankAccount,
  normalizeCategory,
  normalizeCustomer,
  normalizeSeller,
  parseBrazilianDate,
  parseOmieBoolean,
} from "@/services/omie/reference-data";
import { bankAccounts, categories, customers, sellers } from "../fixtures/omie-reference-data";

describe("Omie reference-data normalizers", () => {
  it("normalizes customers and empty optional fields", () => {
    expect(normalizeCustomer(customers[0])).toEqual({
      omieId: "1001",
      legalName: "Cliente Exemplo Ltda",
      tradeName: "Cliente Exemplo",
      documentNumber: "00.000.000/0001-00",
      isActive: true,
    });
    expect(normalizeCustomer(customers[1])).toMatchObject({
      omieId: "1002",
      tradeName: null,
      documentNumber: null,
    });
  });

  it("normalizes sellers with active state and optional email", () => {
    expect(normalizeSeller(sellers[0])).toMatchObject({ omieId: "2001", isActive: true });
    expect(normalizeSeller(sellers[1])).toMatchObject({ email: null, isActive: false });
  });

  it("preserves confirmed category DRE metadata", () => {
    expect(normalizeCategory(categories[0])).toMatchObject({
      omieId: "1.01.01",
      name: "Receita de exemplo",
      codigoDre: "01.01",
      dreMetadata: { grupo: "receita", nivel: 2 },
    });
  });

  it("normalizes bank account values without adding local configuration", () => {
    const normalized = normalizeBankAccount(bankAccounts[0]);
    expect(normalized).toEqual({
      omieId: "3001",
      description: "Conta Corrente Exemplo",
      initialBalance: "1234.56",
      balanceDate: "2026-12-31",
      blocked: false,
      inactive: false,
      accountType: "CC",
    });
    expect(normalized).not.toHaveProperty("selectedForCash");
  });
});

describe("shared Omie value parsing", () => {
  it.each([
    ["S", true],
    ["N", false],
    [undefined, null],
  ])("maps %s without silently coercing unknown values", (input, expected) => {
    expect(parseOmieBoolean(input)).toBe(expected);
  });

  it("rejects unknown Omie booleans", () => {
    expect(() => parseOmieBoolean("X")).toThrow("Invalid Omie boolean");
  });

  it.each([
    ["01/01/2025", "2025-01-01"],
    ["31/12/2026", "2026-12-31"],
    ["", null],
  ])("parses Brazilian date %s explicitly", (input, expected) => {
    expect(parseBrazilianDate(input)).toBe(expected);
  });

  it("rejects impossible dates", () => {
    expect(() => parseBrazilianDate("31/02/2026")).toThrow("Invalid Brazilian date");
  });
});
