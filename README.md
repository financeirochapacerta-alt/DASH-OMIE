# Chapa Certa — Central de Gestão

Aplicação web gerencial para a Chapa Certa. A Omie é a fonte operacional; PostgreSQL/Supabase é a fonte analítica. Backend integra e aplica regras (sinais financeiros, cancelamento, DRE, caixa); o frontend só apresenta o que já foi calculado no banco. Stack: Next.js 16 (App Router), TypeScript estrito, Tailwind CSS, Supabase (Auth + Postgres/RLS).

## Stack

- Next.js 16 + TypeScript + Tailwind CSS.
- Supabase: Auth, Postgres com RLS, schemas `raw`/`public`/`analytics` (ADR-007).
- Recharts para gráficos (única biblioteca visual — ADR-016).
- Vitest para testes; Playwright para E2E (ver `e2e/`).

## Pré-requisitos e instalação

- Node.js 20.9 ou superior e npm.
- Execute `npm install`.
- Copie `.env.example` para `.env.local` e preencha localmente (nunca commitar valores reais):
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — necessárias para rodar a aplicação.
  - `SUPABASE_SERVICE_ROLE_KEY` — necessária apenas para os scripts de sincronização (`scripts/sync-*.ts`), nunca usada em rota/Server Action.
  - `OMIE_APP_KEY` / `OMIE_APP_SECRET` — necessárias apenas para os scripts de sincronização.

## Desenvolvimento

- `npm run dev` — servidor de desenvolvimento.
- `npm run lint` — análise estática (ESLint).
- `npm run typecheck` — tipos estritos (`tsc --noEmit`).
- `npm test` — testes unitários (Vitest).
- `npm run build` — build de produção.
- `npx playwright test` — testes E2E (ver [`docs/OPERATIONS.md`](docs/OPERATIONS.md) para credenciais de teste).

## Supabase

Projeto exclusivo da Chapa Certa (nunca reutilizar projeto pessoal — ver `AGENTS.md`). Migrations em `supabase/migrations/`, append-only: nunca editar uma migration já aplicada ao remoto, sempre criar uma nova com `create or replace view`/`alter table` quando precisar corrigir algo já publicado. Aplicar com `npx supabase db push` (sempre revisar com `--dry-run` antes). Tipos TypeScript do banco são gerados, não escritos à mão: `npx supabase gen types typescript --linked > src/types/database.ts`, regenerar após qualquer migration que mude tabela/view/função.

## Sincronização com a Omie

Cada onda é um script Node standalone (`SUPABASE_SERVICE_ROLE_KEY`/`OMIE_APP_KEY`/`OMIE_APP_SECRET`), executável localmente ou agendado via GitHub Actions (`.github/workflows/sync-omie.yml`). Ver [`docs/OPERATIONS.md`](docs/OPERATIONS.md) para o passo a passo de cada onda e para o que **não** fazer, e [`docs/PRODUCTION.md`](docs/PRODUCTION.md) para a frequência de produção.

## Produção

Deploy, variáveis de ambiente, Auth URLs, sincronização agendada, observabilidade, backup/recovery e rollback: [`docs/PRODUCTION.md`](docs/PRODUCTION.md).

## Documentação e estado

Comece por [`docs/00-PROJECT-MASTER.md`](docs/00-PROJECT-MASTER.md) e siga [`AGENTS.md`](AGENTS.md). Dados reais da Omie sincronizados e validados (clientes, vendedores, categorias, contas correntes, financeiro, DRE, comercial); frontend homologado contra esses dados, incluindo Auth real e RLS por role. Operação recorrente documentada em [`docs/OPERATIONS.md`](docs/OPERATIONS.md).
