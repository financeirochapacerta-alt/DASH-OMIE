# Chapa Certa — Central de Gestão

Aplicação web gerencial que usa a Omie como fonte operacional e PostgreSQL/Supabase como fonte analítica. A fundação executável utiliza Next.js, TypeScript, App Router e Tailwind CSS.

## Pré-requisitos e instalação

- Node.js 20.9 ou superior e npm.
- Execute `npm install`.
- Copie `.env.example` para `.env.local` e preencha apenas no ambiente local. Variáveis Omie e service role são exclusivamente server-side; nenhuma integração real é necessária nesta etapa.

## Comandos

- `npm run dev` — desenvolvimento.
- `npm run lint` — análise estática.
- `npm run typecheck` — tipos estritos.
- `npm test` — testes automatizados.
- `npm run build` — build de produção.

## Documentação e estado

Comece por [`docs/00-PROJECT-MASTER.md`](docs/00-PROJECT-MASTER.md) e siga [`AGENTS.md`](AGENTS.md). Etapas 0 e 1 concluídas; próxima etapa: banco e migrations, mediante configuração autorizada do Supabase.
