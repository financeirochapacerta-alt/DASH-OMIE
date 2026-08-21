import { AlertList, ChartCard, MetricGrid, PageHeading } from "@/components/management/dashboard-ui";
import { GlobalFilters } from "@/components/management/global-filters";
import { requireManagementAccess } from "@/features/management/access";
import { getManagementPageData } from "@/features/management/data";
import { resolvePeriod, type PageSearchParams } from "@/features/management/period";

export default async function ExecutivePage({ searchParams }: { searchParams: PageSearchParams }) {
  await requireManagementAccess("dashboard");
  const period = resolvePeriod(await searchParams);
  const data = await getManagementPageData("executive", period);
  const [vendas, faturado, aFaturar, aReceber, aPagar, vencido, saldoAtual, projecaoCaixa, resultado, melhorVendedor, caixaCritico] = data.metrics;

  return (
    <>
      <PageHeading eyebrow="Visão Geral" title="Pulso do negócio" description="Indicadores essenciais para decisões rápidas e seguras">
        <GlobalFilters period={period} />
      </PageHeading>

      {/* Vendendo / faturando: quanto estamos vendendo, já faturamos e como está o resultado/caixa */}
      <MetricGrid tier="primary" metrics={[vendas, faturado, saldoAtual, resultado]} />

      <section className="section-block">
        <p className="section-block-heading">Faturamento, recebimento e pagamento</p>
        <MetricGrid tier="secondary" metrics={[aFaturar, aReceber, aPagar, vencido]} />
      </section>

      <section className="section-block">
        <p className="section-block-heading">Caixa, resultado e vendas</p>
        <div className="dashboard-grid">
          <ChartCard title="Resultado gerencial mensal" subtitle="Últimos 6 meses, por vencimento" data={data.chart} kind="bar" />
          <ChartCard title="Saldo projetado" subtitle="Próximos 30 dias, limite de caixa mínimo" data={data.secondaryChart ?? []} kind="line" referenceLine={data.cashReferenceLine ? { value: data.cashReferenceLine, label: "Caixa mínimo" } : undefined} />
        </div>
      </section>

      <section className="section-block">
        <p className="section-block-heading">Quem vende e principais riscos</p>
        <div className="narrative-grid">
          <MetricGrid tier="secondary" metrics={[melhorVendedor, projecaoCaixa, caixaCritico]} />
          <AlertList alerts={data.alerts} />
        </div>
      </section>
    </>
  );
}
