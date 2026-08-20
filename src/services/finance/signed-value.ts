import "server-only";

import { applyFinancialSign } from "@/services/omie/financial/decimal";

export type FinancialDirection = "receivable" | "payable";

export const toSignedValue = (originalValue: string, direction: FinancialDirection) =>
  applyFinancialSign(originalValue, direction);
