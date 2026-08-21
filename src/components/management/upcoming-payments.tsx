import { formatBRL } from "@/features/management/format";
import type { UpcomingBucket } from "@/features/management/data";

export function UpcomingPayments({ buckets }: { buckets: UpcomingBucket[] }) {
  return (
    <section className="panel">
      <div className="panel-title"><div><h2>Próximos compromissos</h2><p>Títulos abertos por janela de vencimento — não é o filtro de período principal</p></div></div>
      <div className="upcoming-grid">
        {buckets.map((bucket) => (
          <article className="upcoming-card" key={bucket.label}>
            <span>{bucket.label}</span>
            <div className="upcoming-row receber"><span>Receber</span><strong>{formatBRL(bucket.receivable)}</strong></div>
            <div className="upcoming-row pagar"><span>Pagar</span><strong>{formatBRL(bucket.payable)}</strong></div>
          </article>
        ))}
      </div>
    </section>
  );
}
