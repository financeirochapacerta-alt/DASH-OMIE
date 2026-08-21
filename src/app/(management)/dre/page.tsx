import { DataTable, EmptyState, MetricGrid, PageHeading } from "@/components/management/dashboard-ui"; import { GlobalFilters } from "@/components/management/global-filters"; import { requireManagementAccess } from "@/features/management/access"; import { getManagementPageData } from "@/features/management/data"; import { resolvePeriod, type PageSearchParams } from "@/features/management/period";
export default async function DrePage({ searchParams }: { searchParams: PageSearchParams }){
  await requireManagementAccess("dre");
  const period=resolvePeriod(await searchParams);
  const data=await getManagementPageData("dre", period);
  const unmapped=data.metrics.find((metric)=>metric.label==="Categorias não classificadas")?.value??"0";
  const unmappedRows=data.rows.filter((row)=>row.Origem==="Unmapped");
  return <>
    <PageHeading eyebrow="DRE Gerencial" title="Resultado com rastreabilidade" description="Tipo, grupo, conta e categoria por vencimento"><GlobalFilters period={period} /></PageHeading>
    <MetricGrid metrics={data.metrics}/>
    <section className="panel dre-tree">
      <div className="panel-title"><div><h2>Categorias pendentes de classificação</h2><p>Ausência legítima na Omie ou aguardando decisão do ADMIN — nunca escondidas</p></div><span className="status-badge warning">{unmapped} não classificadas</span></div>
      {unmappedRows.length
        ? <DataTable title="Categorias unmapped" columns={["Categoria","Valor"]} rows={unmappedRows.map((row)=>({Categoria:row.Categoria,Valor:row.Valor}))}/>
        : <EmptyState title="Nenhuma categoria pendente" detail="Todas as categorias com movimento no período já têm classificação Omie ou manual."/>}
    </section>
    <DataTable title={`Hierarquia Tipo → Grupo → Conta → Categoria — ${period.label}`} columns={["Tipo","Grupo","Conta","Categoria","Origem","Valor"]} rows={data.rows}/>
  </>;
}
