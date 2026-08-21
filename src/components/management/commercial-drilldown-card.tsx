"use client";

import { useState } from "react";
import { getCommercialDrilldown, type CommercialDrilldownKind, type CommercialDrilldownRow } from "@/features/management/drilldown";
import { formatBRL, formatDate, formatInteger } from "@/features/management/format";
import type { Period } from "@/features/management/period";
import { DetailDrawer } from "./detail-drawer";
import { InteractiveTable, type InteractiveColumn } from "./interactive-table";

const KIND_LABEL: Record<CommercialDrilldownKind, string> = {
  total: "Vendas totais",
  mercadoria: "Mercadorias",
  servico: "Serviços",
  faturado: "Faturado",
  a_faturar: "A faturar",
};

export function CommercialDrilldownCard({
  kind,
  period,
  value,
  detail,
  tone,
  clickable = true,
}: {
  kind: CommercialDrilldownKind;
  period: Period;
  value: string;
  detail?: string;
  tone?: "positive" | "warning" | "negative" | "neutral";
  clickable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getCommercialDrilldown>> | null>(null);
  const title = KIND_LABEL[kind];

  const handleOpen = async () => {
    setOpen(true);
    if (data || loading) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getCommercialDrilldown(kind, period));
    } catch {
      setError("Não foi possível carregar o detalhamento agora.");
    } finally {
      setLoading(false);
    }
  };

  const columns: InteractiveColumn<CommercialDrilldownRow>[] = [
    { key: "tipo", label: "Tipo", sortValue: (r) => r.tipo, render: (r) => <span className={`status-badge ${r.tipo === "Mercadoria" ? "" : "warning"}`}>{r.tipo}</span> },
    { key: "registro", label: "Registro", sortValue: (r) => r.registro, render: (r) => r.registro },
    { key: "cliente", label: "Cliente", sortValue: (r) => r.cliente ?? "", render: (r) => r.cliente ?? "Sem cliente" },
    { key: "vendedor", label: "Vendedor", sortValue: (r) => r.vendedor ?? "", render: (r) => r.vendedor ?? "Sem vendedor" },
    { key: "data", label: "Previsão/Vencimento", sortValue: (r) => r.data ?? "", render: (r) => formatDate(r.data) },
    { key: "etapa", label: "Etapa", sortValue: (r) => r.etapa ?? "", render: (r) => r.etapa ?? "—" },
    { key: "faturado", label: "Faturado", sortValue: (r) => (r.faturado ? 1 : 0), render: (r) => (r.faturado ? "Sim" : "Não") },
    { key: "contrato", label: "Contrato", sortValue: (r) => r.contrato ?? "", render: (r) => r.contrato ?? "—" },
    { key: "valor", label: "Valor", align: "right", sortValue: (r) => r.valor, render: (r) => formatBRL(r.valor) },
  ];

  const card = (
    <article className={tone ?? "neutral"}>
      <span>{title}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
      {clickable && <span className="metric-card-hint">Ver pedidos e OS →</span>}
    </article>
  );

  return (
    <>
      {clickable ? (
        <button className="metric-card metric-card-clickable" onClick={handleOpen}>
          {card}
        </button>
      ) : (
        card
      )}
      <DetailDrawer open={open} onClose={() => setOpen(false)} title={title} subtitle={`Pedidos e ordens de serviço não cancelados — ${period.label}. Cancelados seguem excluídos dos indicadores.`}>
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
                <strong>{formatBRL(data.count ? data.total / data.count : 0)}</strong>
              </div>
            </div>
            <InteractiveTable
              rows={data.rows}
              columns={columns}
              searchPlaceholder="Buscar por cliente, vendedor ou registro…"
              searchText={(r) => `${r.cliente ?? ""} ${r.vendedor ?? ""} ${r.registro}`}
            />
          </>
        )}
      </DetailDrawer>
    </>
  );
}
