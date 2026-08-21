import { ChartCard, DataTable, MetricGrid, PageHeading } from "@/components/management/dashboard-ui";
import { CommercialDrilldownCard } from "@/components/management/commercial-drilldown-card";
import { CommercialRankingTables } from "@/components/management/commercial-ranking-tables";
import { CompositionBar } from "@/components/management/composition-bar";
import { GlobalFilters } from "@/components/management/global-filters";
import { requireManagementAccess } from "@/features/management/access";
import { getManagementPageData } from "@/features/management/data";
import { resolvePeriod, type PageSearchParams } from "@/features/management/period";

export default async function CommercialPage({ searchParams }: { searchParams: PageSearchParams }) {
  await requireManagementAccess("analytics_commercial");
  const period = resolvePeriod(await searchParams);
  const data = await getManagementPageData("commercial", period);
  const [vendas, faturado, aFaturar, ticketMedio, melhorVendedor, clientesAtendidos, mercadorias, servicos] = data.metrics;

  return (
    <>
      <PageHeading eyebrow="Comercial" title="Venda com contexto" description="Pedidos e serviços, faturamento, funil e concentração">
        <GlobalFilters period={period} commercial />
      </PageHeading>

      <div className="metric-grid primary">
        <CommercialDrilldownCard kind="total" period={period} value={vendas.value} detail={vendas.detail} tone={vendas.tone} />
        <CommercialDrilldownCard kind="mercadoria" period={period} value={mercadorias.value} detail={mercadorias.detail} tone={mercadorias.tone} />
        <CommercialDrilldownCard kind="servico" period={period} value={servicos.value} detail={servicos.detail} tone={servicos.tone} />
        <CommercialDrilldownCard kind="faturado" period={period} value={faturado.value} detail={faturado.detail} tone={faturado.tone} />
      </div>

      <MetricGrid tier="secondary" metrics={[aFaturar, ticketMedio, melhorVendedor, clientesAtendidos]} />

      {data.composition && (
        <section className="section-block">
          <CompositionBar slices={data.composition} />
        </section>
      )}

      <div className="dashboard-grid">
        <ChartCard title="Funil comercial" subtitle={`Quantidade e valor por etapa — ${period.label}`} data={data.chart} kind="bar" />
        <ChartCard title="Ranking de vendedores" subtitle={`Top 10 por valor total — ${period.label}`} data={data.secondaryChart ?? []} kind="bar" />
      </div>

      <section className="section-block">
        <CommercialRankingTables sellers={data.sellerRanking ?? []} customers={data.customerRanking ?? []} period={period} />
      </section>

      <section className="section-block">
        <DataTable title={`Pedidos e ordens de serviço — ${period.label}`} columns={["Registro", "Tipo", "Cliente", "Vendedor", "Etapa", "Valor", "Situação"]} rows={data.secondaryRows ?? []} />
      </section>
    </>
  );
}
