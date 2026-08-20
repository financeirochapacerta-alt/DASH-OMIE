import "server-only";

type DecimalParts = { units: bigint; scale: number };

function parseDecimal(value: string): DecimalParts {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) throw new TypeError(`Invalid decimal: ${value}`);
  const [, sign, integer, fraction = ""] = match;
  const units = BigInt(`${integer}${fraction}`) * (sign === "-" ? -BigInt(1) : BigInt(1));
  return { units, scale: fraction.length };
}

function pow10(exponent: number) {
  return BigInt(10) ** BigInt(exponent);
}

export function compareDecimals(left: string, right: string) {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  const scale = Math.max(a.scale, b.scale);
  const difference = a.units * pow10(scale - a.scale) - b.units * pow10(scale - b.scale);
  return difference < BigInt(0) ? -1 : difference > BigInt(0) ? 1 : 0;
}

export function negateDecimal(value: string): string {
  const parsed = parseDecimal(value);
  if (parsed.units === BigInt(0)) return value.replace(/^\+/, "");
  return value.startsWith("-") ? value.slice(1) : `-${value.replace(/^\+/, "")}`;
}

export function applyFinancialSign(value: string, direction: "receivable" | "payable") {
  parseDecimal(value);
  const unsigned = value.replace(/^\+/, "");
  if (unsigned.startsWith("-")) throw new RangeError("Financial original value cannot be negative");
  return direction === "receivable" ? unsigned : negateDecimal(unsigned);
}

export function sumDecimals(values: readonly string[]): string {
  const parsed = values.map(parseDecimal);
  const scale = parsed.reduce((maximum, item) => Math.max(maximum, item.scale), 0);
  const total = parsed.reduce(
    (sum, item) => sum + item.units * pow10(scale - item.scale),
    BigInt(0),
  );
  const sign = total < BigInt(0) ? "-" : "";
  const digits = (total < BigInt(0) ? -total : total).toString().padStart(scale + 1, "0");
  if (scale === 0) return `${sign}${digits}`;
  const integer = digits.slice(0, -scale);
  const fraction = digits.slice(-scale).replace(/0+$/, "");
  return fraction ? `${sign}${integer}.${fraction}` : `${sign}${integer}`;
}
