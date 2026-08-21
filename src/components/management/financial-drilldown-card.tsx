"use client";

import { useState } from "react";
import { getFinancialDrilldown, type FinancialDrilldownKind, type FinancialDrilldownRow } from "@/features/management/drilldown";
import { formatBRL, formatDate, formatInteger } from "@/features/management/format";
import { DetailDrawer } from "./detail-drawer";
import { InteractiveTable, type InteractiveColumn } from "./interactive-table";

const KIND_LABEL: Record<FinancialDrilldownKind, { title: string; contraparteLabel: string; description: string }> = {
  receivable: { title: "A Receber", contraparteLabel: "Cliente", description: "Títulos abertos, não cancelados — independente do filtro de período." },
  payable: { title: "A Pagar", contraparteLabel: "Fornecedor", description: "Títulos abertos, não cancelados — independente do filtro de período." },
  overdue_receivable: { title: "Recebíveis Vencidos", contraparteLabel: "Cliente", description: "Abertos, não cancelados e com vencimento antes de hoje." },
  overdue_payable: { title: "Pagáveis Vencidos", contraparteLabel: "Fornecedor", description: "Abertos, não cancelados e com vencimento antes de hoje." },
};

function daysLabel(days: number | null) {
  if (days === null) return "—";
  if (days === 0) return "Vence hoje";
  if (days > 0) return `${days} ${days === 1 ? "dia" : "dias"} para vencer`;
  return `${Math.abs(days)} ${Math.abs(days) === 1 ? "dia" : "dias"} em atraso`;
}

export function FinancialDrilldownCard({
  kind,
  value,
  detail,
  tone,
}: {
  kind: FinancialDrilldownKind;
  value: string;
  detail?: string;
  tone?: "positive" | "warning" | "negative" | "neutral";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getFinancialDrilldown>> | null>(null);
  const meta = KIND_LABEL[kind];

  const handleOpen = async () => {
    setOpen(true);
    if (data || loading) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getFinancialDrilldown(kind));
    } catch {
      setError("Não foi possível carregar o detalhamento agora.");
    } finally {
      setLoading(false);
    }
  };

  const columns: InteractiveColumn<FinancialDrilldownRow>[] = [
    { key: "customerName", label: meta.contraparteLabel, sortValue: (r) => r.customerName ?? "", render: (r) => r.customerName ?? "Sem cadastro na Omie" },
    { key: "documentNumber", label: "Documento", sortValue: (r) => r.documentNumber ?? "", render: (r) => r.documentNumber ?? "—" },
    { key: "categoryName", label: "Categoria", sortValue: (r) => r.categoryName ?? "", render: (r) => r.categoryName ?? "Sem categoria" },
    { key: "bankAccountDescription", label: "Conta", sortValue: (r) => r.bankAccountDescription ?? "", render: (r) => r.bankAccountDescription ?? "—" },
    { key: "sellerName", label: "Vendedor", sortValue: (r) => r.sellerName ?? "", render: (r) => r.sellerName ?? "—" },
    { key: "dueDate", label: "Vencimento", sortValue: (r) => r.dueDate ?? "", render: (r) => formatDate(r.dueDate) },
    { key: "daysToDue", label: "Prazo", sortValue: (r) => r.daysToDue ?? 0, render: (r) => daysLabel(r.daysToDue) },
    { key: "status", label: "Status", sortValue: (r) => r.status ?? "", render: (r) => r.status ?? "—" },
    { key: "value", label: "Valor", align: "right", sortValue: (r) => r.value, render: (r) => formatBRL(r.value) },
  ];

  return (
    <>
      <button className="metric-card metric-card-clickable" onClick={handleOpen}>
        <article className={tone ?? "neutral"}>
          <span>{meta.title}</span>
          <strong>{value}</strong>
          {detail && <small>{detail}</small>}
          <span className="metric-card-hint">Ver detalhamento →</span>
        </article>
      </button>
      <DetailDrawer open={open} onClose={() => setOpen(false)} title={meta.title} subtitle={meta.description}>
        {loading && <p className="drawer-loading">Carregando detalhamento…</p>}
        {error && <p className="form-error">{error}</p>}
        {data && (
          <>
            <div className="drawer-summary">
              <div>
                <span>Total</span>
                <strong>{formatBRL(data.total)}</strong>
              </div>
              <div>
                <span>Quantidade</span>
                <strong>{formatInteger(data.count)}</strong>
              </div>
              <div>
                <span>Valor médio</span>
                <strong>{formatBRL(data.average)}</strong>
              </div>
            </div>
            <InteractiveTable
              rows={data.rows}
              columns={columns}
              searchPlaceholder={`Buscar por ${meta.contraparteLabel.toLowerCase()} ou documento…`}
              searchText={(r) => `${r.customerName ?? ""} ${r.documentNumber ?? ""} ${r.categoryName ?? ""}`}
              rowClassName={(r) => (r.daysToDue !== null && r.daysToDue < 0 ? "row-overdue" : undefined)}
            />
          </>
        )}
      </DetailDrawer>
    </>
  );
}
