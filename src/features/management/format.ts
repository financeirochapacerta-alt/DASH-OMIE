const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export const formatBRL = (value: number | string | null | undefined) => brl.format(Number(value ?? 0));
export const formatPercent = (value: number | null | undefined) => percent.format((value ?? 0) / 100);
export const formatInteger = (value: number | null | undefined) => integer.format(value ?? 0);
export function formatDate(value: string | null | undefined) {
  if (!value) return "—"; const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`;
}
