import { FoundationCard } from "@/components/ui/foundation-card";

const foundations = [
  { label: "Next.js", detail: "App Router pronto" },
  { label: "TypeScript", detail: "Modo estrito" },
  { label: "Supabase", detail: "Clientes preparados" },
  { label: "Testes", detail: "Vitest configurado" },
];

export default function Home() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="brand-mark" aria-hidden="true">CC</div>
        <p className="eyebrow">CHAPA CERTA</p>
        <h1 id="page-title">Central de Gestão</h1>
        <p className="status">Fundação técnica inicializada com sucesso</p>

        <div className="foundation-grid" aria-label="Tecnologias configuradas">
          {foundations.map((foundation) => (
            <FoundationCard key={foundation.label} {...foundation} />
          ))}
        </div>

        <p className="stage">Etapa 1 · Bootstrap técnico</p>
      </section>
    </main>
  );
}
