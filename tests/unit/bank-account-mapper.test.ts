import { describe, expect, it } from "vitest";
import { bankAccountRow } from "@/services/supabase/mappers";
import type { BankAccountRecord } from "@/services/omie/reference-data/types";

const record: BankAccountRecord = {
  omieId: "123",
  description: "Banco do Brasil",
  initialBalance: "1000",
  balanceDate: "2026-01-01",
  blocked: false,
  inactive: false,
  accountType: "CC",
};

describe("bankAccountRow", () => {
  it("never includes selected_for_cash in the sync upsert payload", () => {
    // selected_for_cash is an ADMIN-only local choice (see
    // src/features/management/bank-accounts.ts). The Omie sync always runs as
    // service_role and must never be able to reset it — this locks in that the
    // upsert payload structurally cannot include the column, regardless of what
    // Omie sends.
    expect(Object.keys(bankAccountRow(record))).not.toContain("selected_for_cash");
  });

  it("maps every other reference field", () => {
    expect(bankAccountRow(record)).toEqual({
      description: "Banco do Brasil",
      initial_balance: "1000",
      balance_date: "2026-01-01",
      account_type: "CC",
      blocked: false,
      inactive: false,
    });
  });
});
