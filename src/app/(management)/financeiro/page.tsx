import { AgingBars } from "@/components/management/aging-bars";
import { ChartCard, DataTable, PageHeading } from "@/components/management/dashboard-ui";
import { ConcentrationList } from "@/components/management/concentration-list";
import { FinancialDrilldownCard } from "@/components/management/financial-drilldown-card";
import { GlobalFilters } from "@/components/management/global-filters";
import { UpcomingPayments } from "@/components/management/upcoming-payments";
import { requireManagementAccess } from "@/features/management/access";
import { getManagementPageData } from "@/features/management/data";
import { getPayablesAging, getReceivablesAging } from "@/features/management/drilldown";
import { resolvePeriod, type PageSearchParams } from "@/features/management/period";

export default async function FinancialPage({ searchParams }: { searchParams: PageSearchParams }) {
  await requireManagementAccess("financial");
  const period = resolvePeriod(await searchParams);
  const [data, receivablesAging, payablesAging] = await Promise.all([
    getManagementPageData("financial", period),
    getReceivablesAging(),
    getPayablesAging(),
  ]);
  const [aReceber, aPagar, recebiveisVencidos, pagaveisVencidos] = data.metrics;

  return (
    <>
      <PageHeading eyebrow="Financeiro" title="Compromissos sob controle" description="Receber, pagar, vencimentos e inadimplência gerencial">
        <GlobalFilters period={period} />
      </PageHeading>

      <div className="metric-grid primary">
        <FinancialDrilldownCard kind="receivable" value={aReceber.value} detail={aReceber.detail} tone={aReceber.tone} />
        <FinancialDrilldownCard kind="payable" value={aPagar.value} detail={aPagar.detail} tone={aPagar.tone} />
        <FinancialDrilldownCard kind="overdue_receivable" value={recebiveisVencidos.value} detail={recebiveisVencidos.detail} tone={recebiveisVencidos.tone} />
        <FinancialDrilldownCard kind="overdue_payable" value={pagaveisVencidos.value} detail={pagaveisVencidos.detail} tone={pagaveisVencidos.tone} />
      </div>

      <section className="section-block">
        <p className="section-block-heading">Realizado</p>
        <ChartCard title="Entradas x saídas realizadas" subtitle="Movimentos quitados, últimos 6 meses" data={data.chart} kind="bar" />
      </section>

      <section className="section-block">
        <p className="section-block-heading">Inadimplência</p>
        <div className="narrative-grid">
          <AgingBars title="Aging — Recebíveis vencidos" buckets={receivablesAging} />
          <AgingBars title="Aging — Pagáveis vencidos" buckets={payablesAging} />
        </div>
      </section>

      <section className="section-block">
        <p className="section-block-heading">Compromissos</p>
        <div className="narrative-grid">
          {data.upcoming && <UpcomingPayments buckets={data.upcoming} />}
          {data.concentration && <ConcentrationList title="Concentração de recebíveis" description="Clientes que mais respondem pelo saldo a receber em aberto" rows={data.concentration} />}
        </div>
      </section>

      <section className="section-block">
        <p className="section-block-heading">Detalhamento</p>
        <DataTable title={`Movimentos financeiros (não cancelados) — ${period.label}`} columns={["Contraparte", "Categoria", "Tipo", "Documento", "Vencimento", "Valor", "Status"]} rows={data.rows} />
      </section>
    </>
  );
}
