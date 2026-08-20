# Registro de decisões

## ADR-001 — Separação de fontes e responsabilidades

- Status: aceito — 2026-08-20
- Decisão: Omie operacional; PostgreSQL analítico; backend integra/aplica regras; frontend apresenta.
- Motivo: segurança, auditabilidade, performance e consistência.

## ADR-002 — Três camadas de dados

- Status: aceito — 2026-08-20
- Decisão: RAW, NORMALIZED e BUSINESS/ANALYTICS explicitamente separadas e rastreáveis.
- Motivo: auditoria, reprocessamento e evolução independente.

## ADR-003 — Sincronização híbrida resiliente

- Status: aceito — 2026-08-20
- Decisão: incremental/upsert por entidade, inbox assíncrona para webhooks e reconciliação periódica obrigatória.
- Motivo: webhooks e cursores podem ter lacunas; cargas monolíticas são frágeis.

## ADR-004 — Stack preferencial e custo

- Status: aceito como direção — 2026-08-20
- Decisão: Next.js, TypeScript, Tailwind, PostgreSQL/Supabase e Supabase Auth; gráficos após avaliação. Priorizar tier gratuito sem sacrificar requisitos.
- Consequência: versões e bibliotecas específicas serão decididas no bootstrap.

## ADR-005 — Regras financeiras fora da UI

- Status: aceito — 2026-08-20
- Decisão: sinais, cancelamento, DRE e caixa são calculados no backend/banco e protegidos por testes; originais preservados.

