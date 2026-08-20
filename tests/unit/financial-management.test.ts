import { describe, expect, it } from "vitest";
import { aggregateDre, buildDreDetails, currentBalances, projectCash, type ManagementTitle } from "@/services/omie/financial";

const title = (overrides: Partial<ManagementTitle> = {}): ManagementTitle => ({
  id: "1", direction: "receivable", categoryId: "cat-revenue", bankAccountId: "bank-a",
  dueDate: "2026-08-20", signedValue: "1000", isSettled: false, isCancelled: false, ...overrides,
});
const mappings = [{ categoryId: "cat-revenue", type: "Receita", group: "Receitas", account: "Vendas", source: "manual", active: true },
  { categoryId: "cat-cost", type: "Despesa", group: "Custos", account: "Insumos", source: "manual", active: true }];

describe("management DRE", () => {
  it("protects the 1000 - 400 = 600 signed-value regression", () => {
    const details = buildDreDetails([title(), title({ id: "2", direction: "payable", categoryId: "cat-cost", signedValue: "-400" })], mappings);
    expect(aggregateDre(details, "month")).toEqual([{ key: "2026-08", value: "600" }]);
    expect(aggregateDre(details, "type")).toEqual([{ key: "Despesa", value: "-400" }, { key: "Receita", value: "1000" }]);
  });
  it("excludes cancelled titles and exposes unmapped titles with drill-down", () => {
    const details = buildDreDetails([title({ id: "unmapped", categoryId: null }), title({ id: "cancelled", isCancelled: true })], mappings);
    expect(details).toHaveLength(1); expect(details[0]).toMatchObject({ id: "unmapped", mappingStatus: "unmapped", type: null });
  });
});

describe("management cash flow", () => {
  it("calculates selected active account balances and consolidated 10000 + 5000 - 3000", () => {
    const accounts = [
      { id: "bank-a", initialBalance: "10000", balanceDate: "2026-01-01", selectedForCash: true, blocked: false, inactive: false },
      { id: "bank-b", initialBalance: "99999", balanceDate: "2026-01-01", selectedForCash: false, blocked: false, inactive: false },
      { id: "bank-c", initialBalance: "99999", balanceDate: "2026-01-01", selectedForCash: true, blocked: true, inactive: false },
      { id: "bank-d", initialBalance: "99999", balanceDate: "2026-01-01", selectedForCash: true, blocked: false, inactive: true }];
    const balances = currentBalances(accounts, [title({ signedValue: "5000", isSettled: true }), title({ id: "2", direction: "payable", signedValue: "-3000", isSettled: true })]);
    expect(balances).toEqual([{ accountId: "bank-a", balance: "12000" }]);
  });
  it("moves overdue open titles to today without mutating due date and accumulates projection", () => {
    const overdue = title({ id: "overdue-in", dueDate: "2026-08-01", signedValue: "2000" });
    const result = projectCash({ currentDate: "2026-08-20", openingBalance: "10000", horizonDays: 2, minimumCash: "5000", titles: [
      overdue, title({ id: "overdue-out", direction: "payable", dueDate: "2026-08-10", signedValue: "-1000" }),
      title({ id: "tomorrow", dueDate: "2026-08-21", signedValue: "5000" }),
      title({ id: "later", direction: "payable", dueDate: "2026-08-22", signedValue: "-8000" }),
      title({ id: "cancelled", signedValue: "999", isCancelled: true }), title({ id: "settled", signedValue: "999", isSettled: true })] });
    expect(result.days.map((day) => day.closingBalance)).toEqual(["11000", "16000", "8000"]);
    expect(overdue.dueDate).toBe("2026-08-01"); expect(result.firstNegativeCashDate).toBeNull();
  });
  it("detects exact first negative and below-minimum dates and excludes out-of-horizon titles", () => {
    const result = projectCash({ currentDate: "2026-08-20", openingBalance: "6000", horizonDays: 2, minimumCash: "5000", titles: [
      title({ id: "low", direction: "payable", dueDate: "2026-08-21", signedValue: "-1500" }),
      title({ id: "negative", direction: "payable", dueDate: "2026-08-22", signedValue: "-5000" }),
      title({ id: "outside", dueDate: "2026-08-23", signedValue: "99999" })] });
    expect(result.firstBelowMinimumCashDate).toBe("2026-08-21"); expect(result.firstNegativeCashDate).toBe("2026-08-22");
    expect(result.days[2]?.closingBalance).toBe("-500");
  });
});
