import "server-only";

import { parseBrazilianDate } from "../reference-data/normalize";

export const FINANCIAL_HISTORY_START = "2025-01-01";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function createFinancialSyncWindow(today: Date) {
  const end = new Date(Date.UTC(today.getUTCFullYear() + 1, today.getUTCMonth(), today.getUTCDate()));
  return { from: FINANCIAL_HISTORY_START, to: isoDate(end) };
}

export function isWithinFinancialWindow(dateBr: string, window: { from: string; to: string }) {
  const date = parseBrazilianDate(dateBr);
  if (!date) throw new TypeError("Financial due date is required");
  return date >= window.from && date <= window.to;
}
