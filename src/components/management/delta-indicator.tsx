export function DeltaIndicator({ current, previous, label }: { current: number; previous: number | null; label: string }) {
  if (previous === null) return <small className="delta neutral">Sem base de comparação</small>;
  if (previous === 0) {
    if (current === 0) return <small className="delta neutral">Igual a {label}</small>;
    return <small className={`delta ${current > 0 ? "positive" : "negative"}`}>Sem valor em {label} para comparar</small>;
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
  const tone = Math.abs(change) < 0.05 ? "neutral" : change > 0 ? "positive" : "negative";
  return (
    <small className={`delta ${tone}`}>
      {arrow} {Math.abs(change).toFixed(1)}% vs {label}
    </small>
  );
}
