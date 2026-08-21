import { formatBRL, formatInteger } from "@/features/management/format";
import type { CompositionSlice } from "@/features/management/data";

export function CompositionBar({ slices }: { slices: CompositionSlice[] }) {
  const hasData = slices.some((slice) => slice.value !== 0);
  return (
    <section className="panel">
      <div className="panel-title"><div><h2>Composição das vendas</h2><p>Mercadoria (sales_orders) x Serviço (service_orders) no período</p></div></div>
      {hasData ? (
        <>
          <div className="composition-bar">
            {slices.map((slice) => (
              <div key={slice.label} className="composition-segment" style={{ width: `${Math.max(0, slice.percent)}%`, background: slice.color }}>
                {slice.percent >= 12 ? `${slice.percent.toFixed(0)}%` : ""}
              </div>
            ))}
          </div>
          <div className="composition-legend">
            {slices.map((slice) => (
              <div className="composition-legend-item" key={slice.label}>
                <span className="composition-swatch" style={{ background: slice.color }} />
                <span>
                  <strong>{slice.label}</strong> — {formatBRL(slice.value)} ({slice.percent.toFixed(1)}%, {formatInteger(slice.count)} {slice.count === 1 ? "registro" : "registros"})
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="drawer-loading">Nenhuma venda no período selecionado.</p>
      )}
    </section>
  );
}
