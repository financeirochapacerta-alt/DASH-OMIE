import { AlertList, ChartCard, MetricGrid, PageHeading } from "@/components/management/dashboard-ui";
import { GlobalFilters } from "@/components/management/global-filters";
import { requireManagementAccess } from "@/features/management/access";
import { getManagementPageData } from "@/features/management/data";

export default async function ExecutivePage() { await requireManagementAccess("dashboard"); const data = await getManagementPageData("executive");
  return <><PageHeading eyebrow="Visão Geral" title="Pulso do negócio" description="Indicadores essenciais para decisões rápidas e seguras"><GlobalFilters /></PageHeading><MetricGrid metrics={data.metrics} /><div className="dashboard-grid"><ChartCard title="Resultado gerencial mensal" subtitle="Últimos 6 meses, por vencimento" data={data.chart} kind="bar" /><ChartCard title="Saldo projetado" subtitle="Próximos 30 dias, limite de caixa mínimo" data={data.secondaryChart ?? []} kind="line" /></div><div className="dashboard-grid lower single"><AlertList alerts={data.alerts} /></div></>;
}
