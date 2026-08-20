type FoundationCardProps = {
  label: string;
  detail: string;
};

export function FoundationCard({ label, detail }: FoundationCardProps) {
  return (
    <article className="foundation-card">
      <strong>{label}</strong>
      <span>{detail}</span>
    </article>
  );
}
