"use client";

import { useState } from "react";
import { getCommercialDrilldownByParty, type CommercialDrilldownRow } from "@/features/management/drilldown";
import { formatBRL, formatInteger } from "@/features/management/format";
import type { Period } from "@/features/management/period";
import type { ManagementPageData } from "@/features/management/data";
import { DetailDrawer } from "./detail-drawer";
import { InteractiveTable, type InteractiveColumn } from "./interactive-table";

type SellerRow = NonNullable<ManagementPageData["sellerRanking"]>[number];
type CustomerRow = NonNullable<ManagementPageData["customerRanking"]>[number];

type Party = { type: "seller" | "customer"; id: number; name: string } | null;

const orderColumns: InteractiveColumn<CommercialDrilldownRow>[] = [
  { key: "tipo", label: "Tipo", sortValue: (r) => r.tipo, render: (r) => <span className={`status-badge ${r.tipo === "Mercadoria" ? "" : "warning"}`}>{r.tipo}</span> },
  { key: "registro", label: "Registro", sortValue: (r) => r.registro, render: (r) => r.registro },
  { key: "cliente", label: "Cliente", sortValue: (r) => r.cliente ?? "", render: (r) => r.cliente ?? "Sem cliente" },
  { key: "vendedor", label: "Vendedor", sortValue: (r) => r.vendedor ?? "", render: (r) => r.vendedor ?? "Sem vendedor" },
  { key: "etapa", label: "Etapa", sortValue: (r) => r.etapa ?? "", render: (r) => r.etapa ?? "—" },
  { key: "faturado", label: "Faturado", sortValue: (r) => (r.faturado ? 1 : 0), render: (r) => (r.faturado ? "Sim" : "Não") },
  { key: "valor", label: "Valor", align: "right", sortValue: (r) => r.valor, render: (r) => formatBRL(r.valor) },
];

export function CommercialRankingTables({ sellers, customers, period }: { sellers: SellerRow[]; customers: CustomerRow[]; period: Period }) {
  const [party, setParty] = useState<Party>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getCommercialDrilldownByParty>> | null>(null);

  const openParty = async (next: NonNullable<Party>) => {
    setParty(next);
    setData(null);
    setLoading(true);
    setError(null);
    try {
      setData(await getCommercialDrilldownByParty(next.type, next.id, period));
    } catch {
      setError("Não foi possível carregar o detalhamento agora.");
    } finally {
      setLoading(false);
    }
  };

  const sellerColumns: InteractiveColumn<SellerRow>[] = [
    { key: "position", label: "#", sortValue: (r) => r.position, render: (r) => r.position },
    { key: "sellerName", label: "Vendedor", sortValue: (r) => r.sellerName, render: (r) => r.sellerName },
    { key: "value", label: "Valor vendido", align: "right", sortValue: (r) => r.value, render: (r) => formatBRL(r.value) },
    { key: "count", label: "Quantidade", align: "right", sortValue: (r) => r.count, render: (r) => formatInteger(r.count) },
    { key: "averageTicket", label: "Ticket médio", align: "right", sortValue: (r) => r.averageTicket, render: (r) => formatBRL(r.averageTicket) },
    { key: "participationPercent", label: "Participação", align: "right", sortValue: (r) => r.participationPercent, render: (r) => `${r.participationPercent.toFixed(1)}%` },
  ];

  const customerColumns: InteractiveColumn<CustomerRow>[] = [
    { key: "customerName", label: "Cliente", sortValue: (r) => r.customerName, render: (r) => r.customerName },
    { key: "value", label: "Valor", align: "right", sortValue: (r) => r.value, render: (r) => formatBRL(r.value) },
    { key: "sharePercent", label: "% total", align: "right", sortValue: (r) => r.sharePercent, render: (r) => `${r.sharePercent.toFixed(1)}%` },
    { key: "cumulativePercent", label: "% acumulado", align: "right", sortValue: (r) => r.cumulativePercent, render: (r) => `${r.cumulativePercent.toFixed(1)}%` },
    { key: "abcClass", label: "Classe", sortValue: (r) => r.abcClass, render: (r) => <span className="status-badge">{r.abcClass}</span> },
  ];

  return (
    <>
      <div className="dashboard-grid lower">
        <section className="panel table-panel">
          <div className="panel-title"><div><h2>Ranking de vendedores — {period.label}</h2><p>Clique em um vendedor para ver os pedidos/OS dele</p></div></div>
          <InteractiveTable rows={sellers} columns={sellerColumns} searchPlaceholder="Buscar vendedor…" searchText={(r) => r.sellerName} onRowClick={(r) => openParty({ type: "seller", id: r.sellerId, name: r.sellerName })} />
        </section>
        <section className="panel table-panel">
          <div className="panel-title"><div><h2>Curva ABC de clientes — {period.label}</h2><p>Clique em um cliente para ver os pedidos/OS dele</p></div></div>
          <InteractiveTable rows={customers} columns={customerColumns} searchPlaceholder="Buscar cliente…" searchText={(r) => r.customerName} onRowClick={(r) => openParty({ type: "customer", id: r.customerId, name: r.customerName })} />
        </section>
      </div>
      <DetailDrawer open={party !== null} onClose={() => setParty(null)} title={party?.name ?? ""} subtitle={`Pedidos e OS não cancelados — ${period.label}`}>
        {loading && <p className="drawer-loading">Carregando detalhamento…</p>}
        {error && <p className="form-error">{error}</p>}
        {data && (
          <>
            <div className="drawer-summary">
              <div><span>Total</span><strong>{formatBRL(data.total)}</strong></div>
              <div><span>Quantidade</span><strong>{formatInteger(data.count)}</strong></div>
              <div><span>Valor médio</span><strong>{formatBRL(data.count ? data.total / data.count : 0)}</strong></div>
            </div>
            <InteractiveTable rows={data.rows} columns={orderColumns} searchPlaceholder="Buscar por registro…" searchText={(r) => r.registro} />
          </>
        )}
      </DetailDrawer>
    </>
  );
}
