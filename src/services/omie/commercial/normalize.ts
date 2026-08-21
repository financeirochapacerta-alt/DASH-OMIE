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

// Confirmed with real payloads (Onda 3, 2026-08-21, 435 real pedidos): infoCadastro and
// lista_parcelas are present in 100% of ListarPedidos records, not only in ConsultarPedido.
// Cancellation must come from infoCadastro.cancelado (never inferred from etapa); cancelledAt
// uses infoCadastro.dCan/hCan when present. Since the listing already carries everything
// ConsultarPedido would confirm, the base sync now resolves cancellation, installments,
// invoiceDate and realDueDate directly instead of deferring them to a separate enrichment
// call. enrichmentStatus stays "pending" only when infoCadastro is genuinely absent from the
// listing (not observed in the real dataset, but not assumed away either). ConsultarPedido
// remains available for point diagnostics/reconciliation, never required for the normal flow.
function cancellationFromInfoCadastro(infoCadastro: SalesOrderDto["infoCadastro"]) {
  const isCancelled = parseOmieBoolean(infoCadastro?.cancelado);
  if (!isCancelled) return { isCancelled, cancelledAt: null };
  const date = parseBrazilianDate(infoCadastro?.dCan);
  const time = optionalText(infoCadastro?.hCan);
  const cancelledAt = date ? `${date}T${time ?? "00:00:00"}` : null;
  return { isCancelled, cancelledAt };
}

export function normalizeSalesOrder(
  dto: SalesOrderDto,
  relations: CommercialRelationIds,
  stageClassification: string | null,
): SalesOrderRecord {
  const { isCancelled, cancelledAt } = cancellationFromInfoCadastro(dto.infoCadastro);
  const installments = normalizeInstallments(dto.lista_parcelas?.parcela);
  return {
    omieId: requiredId(dto.cabecalho.codigo_pedido, "codigo_pedido"),
    ...relations,
    displayNumber: optionalText(dto.cabecalho.numero_pedido),
    contractNumber: optionalText(dto.informacoes_adicionais?.numero_contrato),
    forecastDate: parseBrazilianDate(dto.cabecalho.data_previsao),
    stageCode: optionalText(dto.cabecalho.etapa),
    stageClassification,
    totalValue: totalOrderItems(dto),
    isCancelled,
    cancelledAt,
    invoiceDate: parseBrazilianDate(dto.infoCadastro?.dFat),
    realDueDate: installments[0]?.dueDate ?? null,
    enrichmentStatus: dto.infoCadastro ? "enriched" : "pending",
    installments,
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
  const { isCancelled, cancelledAt } = cancellationFromInfoCadastro(dto.infoCadastro);
  return {
    enrichment: {
      isCancelled,
      cancelledAt,
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
    isCancelled: parseOmieBoolean(dto.InfoCadastro?.cCancelada),
    realDueDate: null,
  };
}
