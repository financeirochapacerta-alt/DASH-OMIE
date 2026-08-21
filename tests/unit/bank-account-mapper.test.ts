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
  it("never includes selected_for_cash or the manual balance fields in the sync upsert payload", () => {
    // selected_for_cash and the manual_* balance columns are ADMIN-only local choices
    // (see src/features/management/bank-accounts.ts). The Omie sync always runs as
    // service_role and must never be able to reset them — this locks in that the
    // upsert payload structurally cannot include those columns, regardless of what
    // Omie sends.
    const keys = Object.keys(bankAccountRow(record));
    expect(keys).not.toContain("selected_for_cash");
    expect(keys).not.toContain("manual_opening_balance");
    expect(keys).not.toContain("manual_balance_date");
    expect(keys).not.toContain("manual_balance_enabled");
    expect(keys).not.toContain("manual_balance_updated_at");
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
