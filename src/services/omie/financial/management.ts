import "server-only";

import { compareDecimals, sumDecimals } from "./decimal";

export type ManagementTitle = {
  id: string; direction: "receivable" | "payable"; categoryId: string | null; bankAccountId: string | null;
  dueDate: string; signedValue: string; isSettled: boolean; isCancelled: boolean;
};
export type DreMapping = { categoryId: string; type: string; group: string; account: string; source: string; active: boolean };
export type BankAccountBalance = { id: string; initialBalance: string; balanceDate: string; selectedForCash: boolean; blocked: boolean; inactive: boolean };

export function buildDreDetails(titles: readonly ManagementTitle[], mappings: readonly DreMapping[]) {
  const active = new Map(mappings.filter((mapping) => mapping.active).map((mapping) => [mapping.categoryId, mapping]));
  return titles.filter((title) => !title.isCancelled).map((title) => {
    const mapping = title.categoryId ? active.get(title.categoryId) : undefined;
    return { ...title, month: title.dueDate.slice(0, 7), mappingStatus: mapping ? "mapped" as const : "unmapped" as const,
      type: mapping?.type ?? null, group: mapping?.group ?? null, account: mapping?.account ?? null, mappingSource: mapping?.source ?? null };
  });
}

export function aggregateDre(details: ReturnType<typeof buildDreDetails>, level: "type" | "group" | "account" | "categoryId" | "month") {
  const values = new Map<string, string[]>();
  for (const detail of details) { const key = detail[level] ?? "unmapped"; values.set(key, [...(values.get(key) ?? []), detail.signedValue]); }
  return [...values].map(([key, amounts]) => ({ key, value: sumDecimals(amounts) })).sort((a, b) => a.key.localeCompare(b.key));
}

export function currentBalances(accounts: readonly BankAccountBalance[], titles: readonly ManagementTitle[]) {
  return accounts.filter((account) => account.selectedForCash && !account.blocked && !account.inactive).map((account) => ({
    accountId: account.id,
    balance: sumDecimals([account.initialBalance, ...titles.filter((title) => title.bankAccountId === account.id && title.isSettled && !title.isCancelled && title.dueDate >= account.balanceDate).map((title) => title.signedValue)]),
  }));
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number); const value = new Date(Date.UTC(year!, month! - 1, day!));
  value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10);
}

export function projectCash(options: { currentDate: string; openingBalance: string; titles: readonly ManagementTitle[]; horizonDays: number; minimumCash: string }) {
  const eligible = options.titles.filter((title) => !title.isSettled && !title.isCancelled && title.dueDate <= addDays(options.currentDate, options.horizonDays));
  let opening = options.openingBalance;
  const days = Array.from({ length: options.horizonDays + 1 }, (_, offset) => {
    const date = addDays(options.currentDate, offset);
    const daily = eligible.filter((title) => (title.dueDate < options.currentDate ? options.currentDate : title.dueDate) === date);
    const inflows = sumDecimals(daily.filter((title) => title.direction === "receivable").map((title) => title.signedValue));
    const outflows = sumDecimals(daily.filter((title) => title.direction === "payable").map((title) => title.signedValue));
    const netFlow = sumDecimals([inflows, outflows]); const closingBalance = sumDecimals([opening, netFlow]);
    const result = { date, openingBalance: opening, inflows, outflows, netFlow, closingBalance };
    opening = closingBalance; return result;
  });
  return { days,
    firstNegativeCashDate: days.find((day) => compareDecimals(day.closingBalance, "0") < 0)?.date ?? null,
    firstBelowMinimumCashDate: days.find((day) => compareDecimals(day.closingBalance, options.minimumCash) < 0)?.date ?? null };
}
