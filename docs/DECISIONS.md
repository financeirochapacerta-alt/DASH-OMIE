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

## ADR-006 — Supabase SSR e validação de ambiente

- Status: aceito — 2026-08-20
- Decisão: usar `@supabase/ssr` atual com clientes browser/server separados; o cliente comum usa chave anon, e service role/Omie permanecem em módulo protegido por `server-only`. Zod centraliza contratos de ambiente.
- Motivo: impedir importação acidental de secrets no browser e validar configuração na fronteira, sem conectar projeto real.

## ADR-007 — Schemas, chaves e exposição do banco

- Status: aceito — 2026-08-20
- Decisão: separar `raw`, `public` normalizado e `analytics`; usar UUID em ingestão/eventos e `bigint identity` internamente nas entidades normalizadas. `raw`/`analytics` ficam fora dos schemas expostos; tabelas começam com RLS e sem policies até Auth.
- Motivo: rastreabilidade, índices menores no modelo relacional e menor superfície de acesso.

## ADR-008 — Sinal financeiro como dado derivado

- Status: aceito — 2026-08-20
- Decisão: `signed_value` é coluna gerada a partir de `original_value`: positiva em recebíveis e negativa em pagáveis; valores originais não negativos são protegidos por constraint.
- Motivo: tornar a regra invariável no banco e independente do frontend/importador.
