import { AlertList, ChartCard, MetricGrid, PageHeading } from "@/components/management/dashboard-ui";
import { GlobalFilters } from "@/components/management/global-filters";
import { requireManagementAccess } from "@/features/management/access";
import { getManagementPageData } from "@/features/management/data";

export default async function ExecutivePage() { await requireManagementAccess("dashboard"); const data = await getManagementPageData("executive");
  return <><PageHeading eyebrow="Visão Geral" title="Pulso do negócio" description="Indicadores essenciais para decisões rápidas e seguras"><GlobalFilters /></PageHeading><MetricGrid metrics={data.metrics} /><div className="dashboard-grid"><ChartCard title="Faturamento mensal" subtitle="Realizado e ritmo da meta" data={data.chart} /><ChartCard title="Saldo projetado" subtitle="Evolução e limite de caixa mínimo" data={data.chart} kind="line" /></div><div className="dashboard-grid lower"><ChartCard title="Receita x despesas" subtitle="Visão gerencial por vencimento" data={data.chart} kind="bar" /><AlertList alerts={data.alerts} /></div></>;
}
