import "server-only";

const SETTLED_TERMS = ["pago", "recebido", "liquidado", "baixado", "quitado"] as const;
const OPEN_TERMS = ["aberto", "a vencer", "vencido", "pendente"] as const;
const NEGATED_SETTLED_TERMS = ["nao pago", "nao recebido", "nao liquidado", "nao baixado", "nao quitado"] as const;

function searchableStatus(status: string) {
  return status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function containsTerm(status: string, terms: readonly string[]) {
  return terms.some((term) => status.includes(term));
}

export type FinancialStatusClassification = {
  isSettled: boolean;
  isCancelled: boolean;
  isKnown: boolean;
};

export function classifyFinancialStatus(status: string): FinancialStatusClassification {
  const normalized = searchableStatus(status);
  if (!normalized) return { isSettled: false, isCancelled: false, isKnown: false };

  const isCancelled = normalized.includes("cancelado");
  const isSettled =
    !containsTerm(normalized, NEGATED_SETTLED_TERMS) && containsTerm(normalized, SETTLED_TERMS);
  const isKnown = isCancelled || isSettled || containsTerm(normalized, OPEN_TERMS);
  return { isSettled, isCancelled, isKnown };
}
