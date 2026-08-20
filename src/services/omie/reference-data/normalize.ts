import "server-only";

import type {
  BankAccountDto,
  BankAccountRecord,
  CategoryDto,
  CategoryRecord,
  CustomerDto,
  CustomerRecord,
  SellerDto,
  SellerRecord,
} from "./types";

export function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new TypeError("Expected text value");
  const normalized = value.trim();
  return normalized || null;
}

function requiredText(value: unknown, field: string): string {
  const normalized = optionalText(value);
  if (!normalized) throw new TypeError(`${field} is required`);
  return normalized;
}

function identifier(value: unknown, field: string): string {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new TypeError(`${field} must be a string or number`);
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError(`${field} must be finite`);
  }
  return requiredText(String(value), field);
}

export function parseOmieBoolean(value: unknown): boolean | null {
  if (value === undefined || value === null || value === "") return null;
  if (value === "S") return true;
  if (value === "N") return false;
  throw new TypeError(`Invalid Omie boolean: ${String(value)}`);
}

export function parseBrazilianDate(value: unknown): string | null {
  const text = optionalText(value);
  if (!text) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) throw new TypeError(`Invalid Brazilian date: ${text}`);
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    throw new TypeError(`Invalid Brazilian date: ${text}`);
  }
  return `${year}-${month}-${day}`;
}

export function normalizeNumeric(value: unknown, defaultValue = "0"): string {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new TypeError("Invalid numeric value");
  }
  const text = String(value).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) {
    throw new TypeError(`Invalid numeric value: ${text}`);
  }
  if (!Number.isFinite(Number(text))) throw new TypeError(`Invalid numeric value: ${text}`);
  return text;
}

function applyActiveFlag<T extends object>(record: T, inactive: unknown): T & { isActive?: boolean } {
  const parsed = parseOmieBoolean(inactive);
  return parsed === null ? record : { ...record, isActive: !parsed };
}

export function normalizeCustomer(dto: CustomerDto): CustomerRecord {
  return applyActiveFlag(
    {
      omieId: identifier(dto.codigo_cliente_omie, "codigo_cliente_omie"),
      legalName: requiredText(dto.razao_social, "razao_social"),
      tradeName: optionalText(dto.nome_fantasia),
      documentNumber: optionalText(dto.cnpj_cpf),
    },
    dto.inativo,
  );
}

export function normalizeSeller(dto: SellerDto): SellerRecord {
  return applyActiveFlag(
    {
      omieId: identifier(dto.codigo, "codigo"),
      name: requiredText(dto.nome, "nome"),
      email: optionalText(dto.email),
    },
    dto.inativo,
  );
}

export function normalizeCategory(dto: CategoryDto): CategoryRecord {
  return applyActiveFlag(
    {
      omieId: identifier(dto.codigo, "codigo"),
      name: requiredText(dto.descricao, "descricao"),
      codigoDre: optionalText(dto.codigo_dre),
      dreMetadata: dto.dadosDRE ?? null,
    },
    dto.inativo,
  );
}

export function normalizeBankAccount(dto: BankAccountDto): BankAccountRecord {
  const blocked = parseOmieBoolean(dto.bloqueado);
  const inactive = parseOmieBoolean(dto.inativo);
  return {
    omieId: identifier(dto.nCodCC, "nCodCC"),
    description: requiredText(dto.descricao, "descricao"),
    initialBalance: normalizeNumeric(dto.saldo_inicial),
    balanceDate: parseBrazilianDate(dto.saldo_data),
    ...(blocked === null ? {} : { blocked }),
    ...(inactive === null ? {} : { inactive }),
    accountType: optionalText(dto.tipo_conta_corrente),
  };
}
