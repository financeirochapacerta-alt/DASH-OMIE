import "server-only";

import { sumDecimals } from "../financial/decimal";
import { normalizeNumeric, optionalText, parseBrazilianDate, parseOmieBoolean } from "../reference-data/normalize";
import type {
  CommercialRelationIds,
  SalesOrderDto,
  SalesOrderEnrichment,
  SalesOrderInstallmentDto,
  SalesOrderInstallmentRecord,
  SalesOrderRecord,
  ServiceOrderDto,
  ServiceOrderRecord,
} from "./types";

function requiredId(value: unknown, field: string) {
  if (typeof value !== "string" && typeof value !== "number") throw new TypeError(`${field} is required`);
  const id = String(value).trim();
  if (!id) throw new TypeError(`${field} is required`);
  return id;
}

function nonNegativeNumeric(value: unknown, defaultValue = "0") {
  const result = normalizeNumeric(value, defaultValue).replace(/^\+/, "");
  if (result.startsWith("-")) throw new RangeError("Commercial value cannot be negative");
  return result;
}

function totalOrderItems(dto: SalesOrderDto) {
  return sumDecimals(
    (dto.det ?? []).map((item) => nonNegativeNumeric(item.produto?.valor_mercadoria)),
  );
}

export function normalizeSalesOrder(
  dto: SalesOrderDto,
  relations: CommercialRelationIds,
  stageClassification: string | null,
): SalesOrderRecord {
  return {
    omieId: requiredId(dto.cabecalho.codigo_pedido, "codigo_pedido"),
    ...relations,
    displayNumber: optionalText(dto.cabecalho.numero_pedido),
    contractNumber: optionalText(dto.informacoes_adicionais?.numero_contrato),
    forecastDate: parseBrazilianDate(dto.cabecalho.data_previsao),
    stageCode: optionalText(dto.cabecalho.etapa),
    stageClassification,
    totalValue: totalOrderItems(dto),
    isCancelled: null,
    cancelledAt: null,
    invoiceDate: null,
    realDueDate: null,
    enrichmentStatus: "pending",
  };
}

export function normalizeInstallments(
  installments: readonly SalesOrderInstallmentDto[] | undefined,
): SalesOrderInstallmentRecord[] {
  const normalized = (installments ?? []).map((installment) => {
    const dueDate = parseBrazilianDate(installment.data_vencimento);
    if (!dueDate) throw new TypeError("Installment due date is required");
    return {
      installmentNumber:
        installment.numero_parcela === undefined
          ? null
          : requiredId(installment.numero_parcela, "numero_parcela"),
      dueDate,
      amount:
        installment.valor === undefined ? null : nonNegativeNumeric(installment.valor),
      omieReference:
        installment.codigo_parcela === undefined
          ? null
          : requiredId(installment.codigo_parcela, "codigo_parcela"),
    };
  });

  normalized.sort((left, right) => {
    const leftNumber = Number(left.installmentNumber);
    const rightNumber = Number(right.installmentNumber);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }
    return left.dueDate.localeCompare(right.dueDate);
  });

  const unique = new Map<string, SalesOrderInstallmentRecord>();
  for (const installment of normalized) {
    const key = installment.omieReference
      ? `reference:${installment.omieReference}`
      : installment.installmentNumber
        ? `number:${installment.installmentNumber}`
        : `value:${installment.dueDate}:${installment.amount ?? ""}`;
    const previous = unique.get(key);
    if (previous && JSON.stringify(previous) !== JSON.stringify(installment)) {
      throw new Error(`Conflicting duplicate installment: ${key}`);
    }
    unique.set(key, installment);
  }
  return [...unique.values()];
}

export function normalizeSalesOrderEnrichment(dto: SalesOrderDto): {
  enrichment: SalesOrderEnrichment;
  installments: SalesOrderInstallmentRecord[];
} {
  const installments = normalizeInstallments(dto.lista_parcelas?.parcela);
  const cancelled = parseOmieBoolean(dto.infoCadastro?.cancelado);
  return {
    enrichment: {
      isCancelled: cancelled,
      cancelledAt: null,
      invoiceDate: parseBrazilianDate(dto.infoCadastro?.dFat),
      realDueDate: installments[0]?.dueDate ?? null,
      enrichmentStatus: "enriched",
    },
    installments,
  };
}

export function normalizeServiceOrder(
  dto: ServiceOrderDto,
  relations: CommercialRelationIds,
  stageClassification: string | null,
): ServiceOrderRecord {
  return {
    omieId: requiredId(dto.Cabecalho.nCodOS, "nCodOS"),
    ...relations,
    displayNumber: optionalText(dto.Cabecalho.cNumOS),
    contractNumber: optionalText(dto.Cabecalho.cNumContrato),
    forecastDate: parseBrazilianDate(dto.Cabecalho.dDtPrevisao),
    stageCode: optionalText(dto.Cabecalho.cEtapa),
    stageClassification,
    totalValue: nonNegativeNumeric(
      dto.Cabecalho.nValorTotal ?? dto.InfoCadastro?.nValorTot,
    ),
    inclusionDate: parseBrazilianDate(dto.InfoCadastro?.dDtInc),
    invoiceDate: parseBrazilianDate(dto.InfoCadastro?.dDtFat),
    isCancelled: null,
    realDueDate: null,
  };
}
