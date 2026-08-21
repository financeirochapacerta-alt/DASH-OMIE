import { formatBRL } from "@/features/management/format";
import type { ConcentrationRow } from "@/features/management/data";

export function ConcentrationList({ title, description, rows }: { title: string; description: string; rows: ConcentrationRow[] }) {
  return (
    <section className="panel">
      <div className="panel-title"><div><h2>{title}</h2><p>{description}</p></div></div>
      {rows.length ? (
        <div className="concentration-list">
          {rows.map((row) => (
            <div className="concentration-row" key={row.name}>
              <strong>{row.name}</strong>
              <span>{formatBRL(row.value)}</span>
              <span>{row.percent.toFixed(1)}%</span>
              <div className="concentration-bar"><div className="concentration-fill" style={{ width: `${Math.min(100, row.percent)}%` }} /></div>
            </div>
          ))}
        </div>
      ) : (
        <p className="drawer-loading">Nenhum título aberto no momento.</p>
      )}
    </section>
  );
}
