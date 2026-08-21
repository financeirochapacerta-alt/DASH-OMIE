import { DataTable, EmptyState, PageHeading } from "@/components/management/dashboard-ui";
import { requireManagementAccess } from "@/features/management/access";
import { getDataQualitySummary, getSyncOverview } from "@/features/management/admin-insights";
import { formatBRL } from "@/features/management/format";

export default async function AdminPage() {
  await requireManagementAccess("configuration");
  const [quality, sync] = await Promise.all([getDataQualitySummary(), getSyncOverview()]);

  return (
    <>
      <PageHeading eyebrow="Administração" title="Qualidade dos dados e sincronização" description="Ausência legítima na origem Omie não é falha de integração — as duas coisas são distinguidas aqui" />

      <section className="panel">
        <div className="panel-title"><div><h2>Qualidade dos dados</h2><p>Sinais de dado ausente ou pendente de decisão do ADMIN</p></div></div>
        <div className="quality-grid">
          <article className="quality-card"><span>Categorias DRE unmapped</span><strong>{quality.unmappedDreCategories.length}</strong><small>Aguardando classificação Omie ou manual</small></article>
          <article className="quality-card"><span>Pedidos sem parcelas</span><strong>{quality.ordersWithoutInstallments}</strong><small>lista_parcelas ausente na origem</small></article>
          <article className="quality-card"><span>Pedidos sem real_due_date</span><strong>{quality.ordersWithoutRealDueDate}</strong><small>Decorrente da ausência de parcelas</small></article>
          <article className="quality-card"><span>Pedidos sem vendedor</span><strong>{quality.ordersWithoutSeller}</strong><small>codVend ausente na origem</small></article>
          <article className="quality-card"><span>OS sem vendedor</span><strong>{quality.osWithoutSeller}</strong><small>nCodVend ausente na origem</small></article>
          <article className={`quality-card ${quality.unknownFinancialStatuses.length ? "warning" : ""}`}><span>Status financeiros desconhecidos</span><strong>{quality.unknownFinancialStatuses.reduce((sum, s) => sum + s.count, 0)}</strong><small>{quality.unknownFinancialStatuses.length ? "Falha de integração — investigar" : "Nenhum status fora do dicionário conhecido"}</small></article>
        </div>
        {quality.unmappedDreCategories.length > 0 && (
          <DataTable
            title="Categorias DRE não classificadas"
            columns={["Categoria", "Valor"]}
            rows={quality.unmappedDreCategories.map((c) => ({ Categoria: c.name, Valor: formatBRL(Number(c.amount)) }))}
          />
        )}
        {quality.unknownFinancialStatuses.length > 0 && (
          <DataTable
            title="Status financeiros fora do dicionário conhecido"
            columns={["Status", "Ocorrências"]}
            rows={quality.unknownFinancialStatuses.map((s) => ({ Status: s.status, Ocorrências: s.count }))}
          />
        )}
      </section>

      <section className="panel">
        <div className="panel-title"><div><h2>Sincronização por entidade</h2><p>Última execução conhecida — o botão &ldquo;Sincronizar agora&rdquo; foi deliberadamente adiado (ver docs/OPERATIONS.md)</p></div></div>
        {sync.runs.length ? (
          <DataTable
            title="Última execução"
            columns={["Entidade", "Status", "Início", "Fim", "Duração (s)", "Fetched", "Inserted", "Updated", "Unchanged", "Failed"]}
            rows={sync.runs.map((r) => ({
              Entidade: r.entityType,
              Status: r.status,
              Início: r.startedAt ?? "—",
              Fim: r.finishedAt ?? "—",
              "Duração (s)": r.durationSeconds ?? "—",
              Fetched: r.fetched,
              Inserted: r.inserted,
              Updated: r.updated,
              Unchanged: r.unchanged,
              Failed: r.failed,
            }))}
          />
        ) : (
          <EmptyState title="Nenhuma sincronização registrada" detail="Execute uma das ondas via npm run sync:* para popular este painel." />
        )}
      </section>

      <section className="panel">
        <div className="panel-title"><div><h2>Locks ativos</h2><p>Impedem execução concorrente da mesma entidade</p></div></div>
        {sync.activeLocks.length ? (
          <DataTable title="Locks" columns={["Entidade", "Expira em"]} rows={sync.activeLocks.map((l) => ({ Entidade: l.entityType, "Expira em": l.expiresAt }))} />
        ) : (
          <EmptyState title="Nenhum lock ativo" detail="Todas as entidades estão livres para uma nova sincronização." />
        )}
      </section>
    </>
  );
}
