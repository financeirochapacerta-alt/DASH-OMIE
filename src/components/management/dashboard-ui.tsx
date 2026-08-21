import { formatBRL } from "@/features/management/format";
import type { ChartPoint, Metric } from "@/features/management/data";
import { DeltaIndicator } from "./delta-indicator";
import { ManagementChart } from "./management-chart";
import { MetricTooltip } from "./metric-tooltip";

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <><div className="page-heading"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{children}</div></>;
}
export function MetricGrid({ metrics, tier }: { metrics: Metric[]; tier?: "primary" | "secondary" }) {
  const tierClass = tier ? ` ${tier}` : "";
  if (!metrics.length) return <div className={`metric-grid${tierClass}`} aria-label="Indicadores sem dados">{["Faturamento", "A receber", "Saldo atual", "Resultado"].map((label) => <article className="metric-card skeleton-card" key={label}><span>{label}</span><strong>—</strong><small>Aguardando conexão de dados</small></article>)}</div>;
  return <div className={`metric-grid${tierClass}`}>{metrics.map((metric) => <article className={`metric-card ${metric.tone ?? "neutral"}`} key={metric.label}><span>{metric.label}{metric.tooltip && <MetricTooltip text={metric.tooltip} />}</span><strong>{metric.value}</strong>{metric.delta && <DeltaIndicator current={metric.delta.current} previous={metric.delta.previous} label={metric.delta.comparisonLabel} />}{metric.detail && <small>{metric.detail}</small>}</article>)}</div>;
}
export function ChartCard({ title, subtitle, data, kind = "area", referenceLine }: { title: string; subtitle: string; data: ChartPoint[]; kind?: "area" | "bar" | "line"; referenceLine?: { value: number; label: string } }) {
  return <section className="panel chart-panel"><div className="panel-title"><div><h2>{title}</h2><p>{subtitle}</p></div><span className="panel-chip">Analytics</span></div>{data.length ? <ManagementChart data={data} kind={kind} referenceLine={referenceLine} /> : <EmptyState title="Ainda não há dados para este gráfico" detail="Os dados aparecerão quando a fonte analítica estiver conectada e possuir registros no período." />}</section>;
}
export function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><div aria-hidden="true">◇</div><strong>{title}</strong><p>{detail}</p></div>; }
export function DataTable({ title, columns, rows }: { title: string; columns: string[]; rows: Record<string, string | number | null>[] }) {
  return <section className="panel table-panel"><div className="panel-title"><div><h2>{title}</h2><p>Detalhamento seguro da camada analítica</p></div></div>{rows.length ? <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{row[column] ?? "—"}</td>)}</tr>)}</tbody></table></div> : <EmptyState title="Nenhum registro encontrado" detail="Ajuste os filtros ou aguarde a próxima sincronização." />}</section>;
}
export function AlertList({ alerts }: { alerts: { title: string; detail: string; priority: "critical" | "warning" | "info" }[] }) {
  return <section className="panel"><div className="panel-title"><div><h2>Alertas prioritários</h2><p>Sinais determinísticos que exigem atenção</p></div></div>{alerts.length ? <div className="alert-list">{alerts.map((alert) => <article className={`alert-item ${alert.priority}`} key={alert.title}><span>{alert.priority}</span><div><strong>{alert.title}</strong><p>{alert.detail}</p></div></article>)}</div> : <EmptyState title="Nenhum alerta ativo" detail="Os sinais serão avaliados quando os analytics estiverem disponíveis." />}</section>;
}
export type CashAccountRow = { description: string; balance: number; hasKnownBalanceDate: boolean; participationPercent: number };
export function CashAccountCards({ accounts }: { accounts: CashAccountRow[] }) {
  return (
    <section className="panel">
      <div className="panel-title"><div><h2>Saldo por conta</h2><p>Somente contas selecionadas, ativas e não bloqueadas</p></div></div>
      {accounts.length ? (
        <div className="account-card-grid">
          {accounts.map((account) => (
            <article className={`account-card ${account.balance < 0 ? "negative" : "positive"}`} key={account.description}>
              <span>{account.description}</span>
              <strong>{formatBRL(account.balance)}</strong>
              <small>{account.participationPercent.toFixed(1)}% do caixa total{!account.hasKnownBalanceDate && " · Sem data de referência confirmada na Omie"}</small>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhuma conta disponível" detail="Nenhuma conta corrente selecionada para caixa está ativa e desbloqueada." />
      )}
    </section>
  );
}
