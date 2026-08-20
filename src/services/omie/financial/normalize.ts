import "server-only";

import { normalizeNumeric, optionalText, parseBrazilianDate } from "../reference-data/normalize";
import { applyFinancialSign } from "./decimal";
import { classifyFinancialStatus } from "./status";
import type { FinancialRelationIds, FinancialTitleDto, FinancialTitleRecord } from "./types";

const EMPTY_RELATIONS: FinancialRelationIds = {
  customerId: null,
  sellerId: null,
  categoryId: null,
  bankAccountId: null,
};

function requiredText(value: unknown, field: string) {
  const text = optionalText(value);
  if (!text) throw new TypeError(`${field} is required`);
  return text;
}

function omieId(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new TypeError("codigo_lancamento_omie is required");
  }
  return requiredText(String(value), "codigo_lancamento_omie");
}

function originalValue(value: unknown) {
  const normalized = normalizeNumeric(value);
  if (normalized.startsWith("-")) throw new RangeError("valor_documento cannot be negative");
  return normalized.replace(/^\+/, "");
}

function normalizeTitle(
  dto: FinancialTitleDto,
  kind: "receivable" | "payable",
  relations: FinancialRelationIds = EMPTY_RELATIONS,
): FinancialTitleRecord {
  const status = requiredText(dto.status_titulo, "status_titulo");
  const classification = classifyFinancialStatus(status);
  const value = originalValue(dto.valor_documento);
  const dueDate = parseBrazilianDate(dto.data_vencimento);
  if (!dueDate) throw new TypeError("data_vencimento is required");

  return {
    omieId: omieId(dto.codigo_lancamento_omie),
    ...relations,
    dueDate,
    forecastDate: parseBrazilianDate(dto.data_previsao),
    issueDate: parseBrazilianDate(dto.data_emissao),
    originalValue: value,
    signedValue: applyFinancialSign(value, kind),
    status,
    statusKnown: classification.isKnown,
    documentNumber: optionalText(dto.numero_documento_fiscal),
    installmentNumber: optionalText(dto.numero_parcela),
    isSettled: classification.isSettled,
    isCancelled: classification.isCancelled,
  };
}

export const normalizeReceivable = (
  dto: FinancialTitleDto,
  relations: FinancialRelationIds = EMPTY_RELATIONS,
) => normalizeTitle(dto, "receivable", relations);

export const normalizePayable = (
  dto: FinancialTitleDto,
  relations: FinancialRelationIds = EMPTY_RELATIONS,
) => normalizeTitle(dto, "payable", relations);
