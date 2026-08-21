import { formatBRL, formatInteger } from "@/features/management/format";
import type { AgingBucket } from "@/features/management/drilldown";

export function AgingBars({ title, buckets }: { title: string; buckets: AgingBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.totalValue));
  const total = buckets.reduce((sum, b) => sum + b.totalValue, 0);
  return (
    <section className="panel aging-panel">
      <div className="panel-title">
        <div>
          <h2>{title}</h2>
          <p>Abertos, não cancelados e vencidos, por faixa de atraso</p>
        </div>
        <span className="status-badge warning">{formatBRL(total)}</span>
      </div>
      {buckets.length ? (
        <div className="aging-bars">
          {buckets.map((bucket) => (
            <div className="aging-row" key={bucket.bucket}>
              <span className="aging-label">{bucket.bucket}</span>
              <div className="aging-track">
                <div
                  className={`aging-fill ${bucket.bucketOrder >= 5 ? "critical" : bucket.bucketOrder >= 3 ? "warning" : "moderate"}`}
                  style={{ width: `${Math.max(4, (bucket.totalValue / max) * 100)}%` }}
                />
              </div>
              <span className="aging-value">
                {formatBRL(bucket.totalValue)} <small>({formatInteger(bucket.titleCount)})</small>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="drawer-loading">Nenhum título vencido nesta categoria.</p>
      )}
    </section>
  );
}
