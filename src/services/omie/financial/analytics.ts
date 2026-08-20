import "server-only";

import { sumDecimals } from "./decimal";
import type { FinancialTitleRecord } from "./types";

export function isOpenTitle(title: Pick<FinancialTitleRecord, "isSettled" | "isCancelled">) {
  return !title.isSettled && !title.isCancelled;
}

export function isOverdueTitle(
  title: Pick<FinancialTitleRecord, "dueDate" | "isSettled" | "isCancelled">,
  currentDate: string,
) {
  return isOpenTitle(title) && title.dueDate < currentDate;
}

export function consolidateSignedValues(titles: readonly Pick<FinancialTitleRecord, "signedValue">[]) {
  return sumDecimals(titles.map((title) => title.signedValue));
}
