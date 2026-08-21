export function MetricTooltip({ text }: { text: string }) {
  return (
    <span className="tooltip-trigger" tabIndex={0} aria-label={text}>
      ?<span className="tooltip-bubble" role="tooltip">{text}</span>
    </span>
  );
}
