export type FinancialDirection = "receivable" | "payable";

export function toSignedValue(originalValue: number, direction: FinancialDirection) {
  if (!Number.isFinite(originalValue) || originalValue < 0) {
    throw new RangeError("originalValue must be a finite, non-negative number");
  }

  return direction === "receivable" ? originalValue : -originalValue;
}
